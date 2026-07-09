import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { requireAdmin, writeAuditLog } from "../_shared/requireAdmin.ts";

type ActionPayload = Record<string, unknown>;

async function handleAccessCheck(ctx: { userId: string }) {
  return { isAdmin: true, userId: ctx.userId };
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

async function handleStatsOverview(supabaseAdmin: SupabaseClient, payload: ActionPayload) {
  const days = Number(payload.days ?? 30);

  const [
    profilesRes,
    signups7Res,
    signups30Res,
    householdRes,
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", daysAgoIso(7)),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", daysAgoIso(30)),
    supabaseAdmin.from("household_data").select("household_id", { count: "exact", head: true }),
  ]);

  return {
    days,
    totalUsers: profilesRes.count ?? 0,
    signups7d: signups7Res.count ?? 0,
    signups30d: signups30Res.count ?? 0,
    householdsWithData: householdRes.count ?? 0,
  };
}

async function handleUsersList(supabaseAdmin: SupabaseClient, payload: ActionPayload) {
  const search = String(payload.search ?? "").trim().toLowerCase();
  const limit = Math.min(Number(payload.limit ?? 50), 100);
  const offset = Number(payload.offset ?? 0);

  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username, locale, role, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { error: error.message };

  const enriched = [];
  for (const profile of profiles ?? []) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    const email = authUser?.user?.email ?? null;

    if (search) {
      const hay = `${profile.username ?? ""} ${email ?? ""}`.toLowerCase();
      if (!hay.includes(search)) continue;
    }

    const { count: householdCount } = await supabaseAdmin
      .from("households")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", profile.id);

    enriched.push({
      ...profile,
      email,
      hasHousehold: (householdCount ?? 0) > 0,
    });
  }

  return { users: enriched, offset, limit };
}

async function handleUserDetail(supabaseAdmin: SupabaseClient, payload: ActionPayload) {
  const userId = String(payload.userId ?? "");
  if (!userId) return { error: "missing_user_id" };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, username, locale, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

  const { data: errors } = await supabaseAdmin
    .from("app_error_events")
    .select("id, severity, category, message, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    profile,
    email: authUser?.user?.email ?? null,
    recentErrors: errors ?? [],
  };
}

async function handleSetRole(
  supabaseAdmin: SupabaseClient,
  adminId: string,
  payload: ActionPayload,
) {
  const userId = String(payload.userId ?? "");
  const role = String(payload.role ?? "");
  if (!userId || !["user", "admin"].includes(role)) {
    return { error: "invalid_payload" };
  }
  if (userId === adminId && role !== "admin") {
    return { error: "cannot_demote_self" };
  }

  if (role === "user") {
    const { count } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    const { data: target } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).maybeSingle();
    if ((count ?? 0) <= 1 && target?.role === "admin") {
      return { error: "last_admin" };
    }
  }

  const { error } = await supabaseAdmin.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };

  await writeAuditLog(supabaseAdmin, {
    adminId,
    action: "users.setRole",
    targetUserId: userId,
    metadata: { role },
  });

  return { ok: true };
}

async function handleDeleteUser(
  supabaseAdmin: SupabaseClient,
  adminId: string,
  payload: ActionPayload,
) {
  const userId = String(payload.userId ?? "");
  if (!userId) return { error: "missing_user_id" };
  if (userId === adminId) return { error: "cannot_delete_self" };

  await writeAuditLog(supabaseAdmin, {
    adminId,
    action: "users.delete",
    targetUserId: userId,
  });

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  return { ok: true };
}

async function handleErrorsList(supabaseAdmin: SupabaseClient, payload: ActionPayload) {
  const severity = payload.severity ? String(payload.severity) : null;
  const category = payload.category ? String(payload.category) : null;
  const blockersOnly = Boolean(payload.blockersOnly);
  const resolved = payload.resolved;
  const limit = Math.min(Number(payload.limit ?? 50), 100);
  const offset = Number(payload.offset ?? 0);

  let query = supabaseAdmin
    .from("app_error_events")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (blockersOnly) {
    query = query.or("severity.eq.blocker,category.in.(auth,sync)");
  } else if (severity) {
    query = query.eq("severity", severity);
  }
  if (category) query = query.eq("category", category);
  if (typeof resolved === "boolean") query = query.eq("resolved", resolved);

  const { data, error, count } = await query;
  if (error) return { error: error.message };
  return { errors: data ?? [], total: count ?? 0, offset, limit };
}

async function handleErrorResolve(
  supabaseAdmin: SupabaseClient,
  adminId: string,
  payload: ActionPayload,
) {
  const errorId = String(payload.errorId ?? "");
  const adminNotes = payload.adminNotes ? String(payload.adminNotes) : null;
  if (!errorId) return { error: "missing_error_id" };

  const { error } = await supabaseAdmin
    .from("app_error_events")
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: adminId,
      admin_notes: adminNotes,
    })
    .eq("id", errorId);

  if (error) return { error: error.message };
  return { ok: true };
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  let body: { action?: string; payload?: ActionPayload };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const action = body.action ?? "";
  const payload = body.payload ?? {};

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { userId, supabaseAdmin } = auth.ctx;

  try {
    let result: unknown;

    switch (action) {
      case "access.check":
        result = await handleAccessCheck(auth.ctx);
        break;
      case "stats.overview":
        result = await handleStatsOverview(supabaseAdmin, payload);
        break;
      case "users.list":
        result = await handleUsersList(supabaseAdmin, payload);
        break;
      case "users.detail":
        result = await handleUserDetail(supabaseAdmin, payload);
        break;
      case "users.setRole":
        result = await handleSetRole(supabaseAdmin, userId, payload);
        break;
      case "users.delete":
        result = await handleDeleteUser(supabaseAdmin, userId, payload);
        break;
      case "errors.list":
        result = await handleErrorsList(supabaseAdmin, payload);
        break;
      case "errors.resolve":
        result = await handleErrorResolve(supabaseAdmin, userId, payload);
        break;
      default:
        return jsonResponse({ error: "unknown_action", action }, 400);
    }

    if (result && typeof result === "object" && "error" in result && !("ok" in result)) {
      return jsonResponse(result, 400);
    }

    return jsonResponse(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal_error";
    console.error("admin-api error", action, message);
    return jsonResponse({ error: "internal_error", detail: message }, 500);
  }
});
