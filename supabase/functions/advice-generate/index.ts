import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildLlmRequest } from "../_shared/buildLlmRequest.ts";
import { ADVICE_PROMPT_VERSION, DEFAULT_GEMINI_MODEL } from "../_shared/constants.ts";
import {
  countryCodeFromSnapshot,
  resolvePromptVersion,
  selectKnowledgeServer,
} from "../_shared/selectKnowledgeServer.ts";
import { getServiceAccountAccessToken } from "../_shared/gcpAuth.ts";
import { geminiGenerateContent } from "../_shared/gemini.ts";
import { parseLlmResponseJson } from "../_shared/parseLlmResponse.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashSnapshot(snapshot: unknown): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(snapshot));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const saJson = Deno.env.get("GCP_SERVICE_ACCOUNT_JSON");
  if (!saJson) {
    return jsonResponse({ error: "server_misconfigured" }, 500);
  }

  let geminiAccessToken: string;
  try {
    geminiAccessToken = await getServiceAccountAccessToken(saJson);
  } catch (err) {
    const message = err instanceof Error ? err.message : "gcp_auth_failed";
    return jsonResponse({ error: "gcp_auth_failed", detail: message }, 500);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");

  const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader ?? "" } },
  });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data: authData, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !authData.user) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  const userId = authData.user.id;

  let body: {
    snapshot?: Record<string, unknown>;
    triggered_rules?: unknown[];
    locale?: string;
    kb_chunks?: { id: string; excerpt: string }[];
    kb_chunk_ids?: string[];
    household_id?: string;
    tab_key?: string;
  };

  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const {
    snapshot,
    triggered_rules = [],
    locale = "en",
    household_id,
    tab_key,
  } = body;

  if (!snapshot || typeof snapshot !== "object") {
    return jsonResponse({ error: "missing_snapshot" }, 400);
  }

  const resolvedTabKey = tab_key || (snapshot.tab_key as string | undefined) || "home";
  const countryCode = countryCodeFromSnapshot(snapshot);
  const promptVersion = await resolvePromptVersion(supabaseAdmin, "coach");

  const kb_chunks = await selectKnowledgeServer(supabaseAdmin, {
    triggered_rules,
    tabKey: resolvedTabKey,
    countryCode,
  });

  if (!Array.isArray(triggered_rules) || triggered_rules.length === 0) {
    const snapshotHash = await hashSnapshot({ ...snapshot, tab_key: resolvedTabKey });
    await supabaseAdmin.from("advice_runs").insert({
      user_id: userId,
      household_id: household_id ?? null,
      snapshot_hash: snapshotHash,
      model: DEFAULT_GEMINI_MODEL,
      prompt_version: promptVersion,
      locale,
      status: "skipped",
      rule_ids: [],
    });
    return jsonResponse({ status: "skipped", reason: "no_rules" });
  }

  const snapshotHash = await hashSnapshot({ ...snapshot, tab_key: resolvedTabKey });
  const model = DEFAULT_GEMINI_MODEL;
  const { systemPrompt, userMessage, kbChunkIds } = buildLlmRequest({
    snapshot,
    triggered_rules,
    locale,
    kb_chunks,
    tab_key: resolvedTabKey,
    promptVersion,
  });

  const { data: cached } = await supabaseAdmin
    .from("advice_cache")
    .select("narrative, run_id")
    .eq("user_id", userId)
    .eq("snapshot_hash", snapshotHash)
    .eq("locale", locale)
    .eq("model", model)
    .eq("prompt_version", promptVersion)
    .maybeSingle();

  if (cached?.narrative) {
    await supabaseAdmin.from("advice_runs").insert({
      user_id: userId,
      household_id: household_id ?? null,
      snapshot_hash: snapshotHash,
      model,
      prompt_version: promptVersion,
      locale,
      status: "cached",
      rule_ids: triggered_rules.map((r: { id?: string }) => r.id).filter(Boolean),
      kb_chunk_ids: kbChunkIds,
    });
    return jsonResponse({
      status: "ok",
      cached: true,
      narrative: cached.narrative,
      run_id: cached.run_id,
    });
  }

  const ruleIds = triggered_rules
    .map((r: { id?: string }) => r?.id)
    .filter((id): id is string => typeof id === "string");

  try {
    const { text, usage } = await geminiGenerateContent({
      accessToken: geminiAccessToken,
      model,
      systemPrompt,
      userMessage,
    });

    const parsed = parseLlmResponseJson(text);
    if (!parsed.ok) {
      await supabaseAdmin.from("advice_runs").insert({
        user_id: userId,
        household_id: household_id ?? null,
        snapshot_hash: snapshotHash,
        model,
        prompt_version: promptVersion,
        locale,
        prompt_tokens: usage.promptTokens,
        completion_tokens: usage.completionTokens,
        rule_ids: ruleIds,
        kb_chunk_ids: kbChunkIds,
        status: "error",
        error_message: parsed.error,
      });
      return jsonResponse({ error: "invalid_llm_response", detail: parsed.error }, 502);
    }

    const { data: runRow, error: runError } = await supabaseAdmin
      .from("advice_runs")
      .insert({
        user_id: userId,
        household_id: household_id ?? null,
        snapshot_hash: snapshotHash,
        model,
        prompt_version: promptVersion,
        locale,
        prompt_tokens: usage.promptTokens,
        completion_tokens: usage.completionTokens,
        rule_ids: ruleIds,
        kb_chunk_ids: kbChunkIds,
        status: "ok",
      })
      .select("id")
      .single();

    if (runError) {
      console.error("advice_runs insert failed", runError);
    }

    const runId = runRow?.id ?? null;

    await supabaseAdmin.from("advice_cache").upsert({
      user_id: userId,
      snapshot_hash: snapshotHash,
      locale,
      model,
      prompt_version: promptVersion,
      narrative: parsed.narrative,
      run_id: runId,
    });

    return jsonResponse({
      status: "ok",
      cached: false,
      narrative: parsed.narrative,
      run_id: runId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    await supabaseAdmin.from("advice_runs").insert({
      user_id: userId,
      household_id: household_id ?? null,
      snapshot_hash: snapshotHash,
      model,
      prompt_version: promptVersion,
      locale,
      rule_ids: ruleIds,
      kb_chunk_ids: kbChunkIds,
      status: "error",
      error_message: message,
    });
    return jsonResponse({ error: "gemini_failed", detail: message }, 502);
  }
});
