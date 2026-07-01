import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildChatRequest } from "../_shared/buildChatRequest.ts";
import {
  MAX_CHAT_MESSAGE_LENGTH,
  MAX_DAILY_CHAT_MESSAGES,
  MAX_MESSAGES_PER_THREAD,
} from "../_shared/chatLimits.ts";
import { DEFAULT_GEMINI_MODEL } from "../_shared/constants.ts";
import {
  countryCodeFromSnapshot,
  extractOfficialSources,
  resolvePromptVersion,
  selectKnowledgeServer,
} from "../_shared/selectKnowledgeServer.ts";
import { getServiceAccountAccessToken } from "../_shared/gcpAuth.ts";
import { geminiGenerateChat } from "../_shared/gemini.ts";
import { parseChatResponseJson } from "../_shared/parseChatResponse.ts";

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

async function hashMessage(message: string): Promise<string> {
  const normalized = message.trim().toLowerCase().replace(/\s+/g, " ");
  const data = new TextEncoder().encode(normalized);
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
    thread_id?: string;
    message?: string;
    tab_key?: string;
    locale?: string;
    snapshot?: Record<string, unknown>;
    triggered_rules?: unknown[];
    coach_paragraphs?: string[];
    kb_chunks?: {
      id: string;
      excerpt: string;
      title?: string;
      official_url?: string;
      last_reviewed?: string;
    }[];
    household_id?: string;
  };

  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const {
    thread_id: incomingThreadId,
    message,
    tab_key,
    locale = "en",
    snapshot,
    triggered_rules = [],
    coach_paragraphs = [],
    kb_chunks: _clientKbChunks = [],
    household_id,
  } = body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return jsonResponse({ error: "missing_message" }, 400);
  }

  if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
    return jsonResponse({ error: "message_too_long" }, 400);
  }

  if (!snapshot || typeof snapshot !== "object") {
    return jsonResponse({ error: "missing_snapshot" }, 400);
  }

  const resolvedTabKey = tab_key || (snapshot.tab_key as string | undefined) || "home";
  const countryCode = countryCodeFromSnapshot(snapshot);
  const snapshotHash = await hashSnapshot({ ...snapshot, tab_key: resolvedTabKey });

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  const { count: dailyCount, error: dailyError } = await supabaseAdmin
    .from("advice_chat_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", dayStart.toISOString());

  if (dailyError) {
    console.error("daily chat count failed", dailyError);
  } else if ((dailyCount ?? 0) >= MAX_DAILY_CHAT_MESSAGES) {
    return jsonResponse({ error: "daily_limit" }, 429);
  }

  let threadId = incomingThreadId;
  let history: { role: string; content: string }[] = [];

  if (threadId) {
    const { data: thread, error: threadError } = await supabaseAdmin
      .from("advice_threads")
      .select("id, user_id")
      .eq("id", threadId)
      .maybeSingle();

    if (threadError || !thread || thread.user_id !== userId) {
      return jsonResponse({ error: "thread_not_found" }, 404);
    }

    const { count: messageCount, error: countError } = await supabaseAdmin
      .from("advice_messages")
      .select("id", { count: "exact", head: true })
      .eq("thread_id", threadId);

    if (countError) {
      console.error("message count failed", countError);
    } else if ((messageCount ?? 0) >= MAX_MESSAGES_PER_THREAD) {
      return jsonResponse({ error: "thread_limit" }, 429);
    }

    const { data: priorMessages, error: historyError } = await supabaseAdmin
      .from("advice_messages")
      .select("role, content")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (historyError) {
      return jsonResponse({ error: "history_load_failed", detail: historyError.message }, 500);
    }

    history = (priorMessages || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));
  } else {
    const contextJson = {
      snapshot,
      triggered_rules,
      coach_paragraphs,
      tab_key: resolvedTabKey,
    };

    const { data: newThread, error: createError } = await supabaseAdmin
      .from("advice_threads")
      .insert({
        user_id: userId,
        household_id: household_id ?? null,
        tab_key: resolvedTabKey,
        locale,
        country_code: countryCode,
        snapshot_hash: snapshotHash,
        context_json: contextJson,
      })
      .select("id")
      .single();

    if (createError || !newThread) {
      return jsonResponse(
        { error: "thread_create_failed", detail: createError?.message },
        500,
      );
    }

    threadId = newThread.id;
  }

  const trimmedMessage = message.trim();
  const kb_chunks = await selectKnowledgeServer(supabaseAdmin, {
    triggered_rules,
    tabKey: resolvedTabKey,
    countryCode,
    userMessage: trimmedMessage,
    mode: "chat",
  });
  const kbChunkIds = kb_chunks.map((c) => c.id).filter(Boolean);

  const { error: userInsertError } = await supabaseAdmin.from("advice_messages").insert({
    thread_id: threadId,
    role: "user",
    content: trimmedMessage,
    kb_chunk_ids: [],
  });

  if (userInsertError) {
    return jsonResponse({ error: "message_save_failed", detail: userInsertError.message }, 500);
  }

  const model = DEFAULT_GEMINI_MODEL;
  const promptVersion = await resolvePromptVersion(supabaseAdmin, "chat");
  const messageHash = await hashMessage(trimmedMessage);

  const { data: cachedReply } = await supabaseAdmin
    .from("advice_chat_cache")
    .select("reply, sources, kb_chunk_ids")
    .eq("user_id", userId)
    .eq("snapshot_hash", snapshotHash)
    .eq("message_hash", messageHash)
    .eq("locale", locale)
    .eq("model", model)
    .eq("prompt_version", promptVersion)
    .maybeSingle();

  if (cachedReply?.reply) {
    const reply = cachedReply.reply as string;
    const sources = Array.isArray(cachedReply.sources) ? cachedReply.sources : [];
    const usedKbIds = Array.isArray(cachedReply.kb_chunk_ids) ? cachedReply.kb_chunk_ids : [];

    await supabaseAdmin.from("advice_messages").insert({
      thread_id: threadId,
      role: "assistant",
      content: reply,
      kb_chunk_ids: usedKbIds,
    });

    await supabaseAdmin
      .from("advice_threads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", threadId);

    await supabaseAdmin.from("advice_chat_runs").insert({
      thread_id: threadId,
      user_id: userId,
      model,
      prompt_tokens: 0,
      completion_tokens: 0,
      status: "ok",
    });

    return jsonResponse({
      status: "ok",
      thread_id: threadId,
      reply,
      sources,
      cached: true,
    });
  }

  const { systemPrompt, contents } = buildChatRequest({
    snapshot,
    triggered_rules,
    locale,
    tab_key: resolvedTabKey,
    coach_paragraphs,
    kb_chunks,
    history,
    message: trimmedMessage,
  });

  try {
    const { text, usage } = await geminiGenerateChat({
      accessToken: geminiAccessToken,
      model,
      systemPrompt,
      contents,
      maxOutputTokens: 256,
      temperature: 0.4,
      responseMimeType: "application/json",
    });

    const parsed = parseChatResponseJson(text, kbChunkIds);
    const reply = parsed.ok ? parsed.reply : text;
    const usedKbIds = parsed.ok ? parsed.used_kb_ids : [];
    const usedChunks = kb_chunks.filter((c) => usedKbIds.includes(c.id));
    const sources = extractOfficialSources(usedChunks);

    const { error: assistantInsertError } = await supabaseAdmin.from("advice_messages").insert({
      thread_id: threadId,
      role: "assistant",
      content: reply,
      kb_chunk_ids: usedKbIds.length > 0 ? usedKbIds : [],
    });

    if (assistantInsertError) {
      console.error("assistant message insert failed", assistantInsertError);
    }

    await supabaseAdmin
      .from("advice_threads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", threadId);

    await supabaseAdmin.from("advice_chat_runs").insert({
      thread_id: threadId,
      user_id: userId,
      model,
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      status: "ok",
    });

    await supabaseAdmin.from("advice_chat_cache").upsert({
      user_id: userId,
      snapshot_hash: snapshotHash,
      message_hash: messageHash,
      locale,
      model,
      prompt_version: promptVersion,
      reply,
      sources,
      kb_chunk_ids: usedKbIds,
    });

    return jsonResponse({
      status: "ok",
      thread_id: threadId,
      reply,
      sources,
    });
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : "unknown_error";
    await supabaseAdmin.from("advice_chat_runs").insert({
      thread_id: threadId,
      user_id: userId,
      model,
      status: "error",
      error_message: errMessage,
    });
    return jsonResponse({ error: "gemini_failed", detail: errMessage }, 502);
  }
});
