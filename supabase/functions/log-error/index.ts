import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";

const MAX_STACK_LENGTH = 4000;
const MAX_MESSAGE_LENGTH = 2000;

const VALID_SEVERITIES = new Set(["debug", "warning", "error", "blocker"]);
const VALID_CATEGORIES = new Set([
  "auth",
  "sync",
  "advice",
  "chat",
  "onboarding",
  "ui",
  "unknown",
]);

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "server_misconfigured" }, 500);
  }

  let userId: string | null = null;
  if (authHeader) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data } = await userClient.auth.getUser();
    userId = data.user?.id ?? null;
  }

  let body: {
    severity?: string;
    category?: string;
    message?: string;
    stack?: string;
    context?: Record<string, unknown>;
    platform?: string;
    app_version?: string;
    locale?: string;
  };

  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const severity = VALID_SEVERITIES.has(body.severity ?? "")
    ? body.severity!
    : "error";
  const category = VALID_CATEGORIES.has(body.category ?? "")
    ? body.category!
    : "unknown";
  const message = String(body.message ?? "unknown_error").slice(0, MAX_MESSAGE_LENGTH);

  if (!message.trim()) {
    return jsonResponse({ error: "missing_message" }, 400);
  }

  const stack = body.stack ? String(body.stack).slice(0, MAX_STACK_LENGTH) : null;
  const context =
    body.context && typeof body.context === "object" ? body.context : {};

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabaseAdmin
    .from("app_error_events")
    .insert({
      user_id: userId,
      severity,
      category,
      message,
      stack,
      context,
      platform: body.platform ?? null,
      app_version: body.app_version ?? null,
      locale: body.locale ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("log-error insert failed", error);
    return jsonResponse({ error: "insert_failed", detail: error.message }, 500);
  }

  return jsonResponse({ ok: true, id: data?.id ?? null });
});
