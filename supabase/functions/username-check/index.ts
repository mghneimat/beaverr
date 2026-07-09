import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const WINDOW_MS = 60_000;
const RATE_LIMIT_PER_IP = 20;

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const limited = checkRateLimit(
    req,
    { key: "username-check", max: RATE_LIMIT_PER_IP, windowMs: WINDOW_MS },
    jsonResponse,
  );
  if (limited) return limited;

  let body: { username?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_body" }, 400);
  }

  const normalized = (body.username ?? "").trim().toLowerCase();
  if (!USERNAME_PATTERN.test(normalized)) {
    return jsonResponse({ available: false, reason: "invalid" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "server_misconfigured" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", normalized)
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: "check_failed", detail: error.message }, 500);
  }

  return jsonResponse({ available: !data });
});
