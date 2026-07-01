import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { requireAdmin, writeAuditLog } from "../_shared/requireAdmin.ts";
import {
  resolvePromptVersion,
  seedKnowledgeBundle,
} from "../_shared/selectKnowledgeServer.ts";

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
  const since = daysAgoIso(days);

  const [
    profilesRes,
    signups7Res,
    signups30Res,
    householdRes,
    adviceRes,
    chatRes,
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", daysAgoIso(7)),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", daysAgoIso(30)),
    supabaseAdmin.from("household_data").select("household_id", { count: "exact", head: true }),
    supabaseAdmin.from("advice_runs").select("status, cost_usd_micros, rule_ids, kb_chunk_ids").gte("created_at", since),
    supabaseAdmin.from("advice_chat_runs").select("status, prompt_tokens, completion_tokens").gte("created_at", since),
  ]);

  const adviceRows = adviceRes.data ?? [];
  const chatRows = chatRes.data ?? [];

  const adviceByStatus: Record<string, number> = {};
  let adviceSpendMicros = 0;
  const ruleCounts: Record<string, number> = {};
  const chunkCounts: Record<string, number> = {};

  for (const row of adviceRows) {
    adviceByStatus[row.status] = (adviceByStatus[row.status] ?? 0) + 1;
    adviceSpendMicros += Number(row.cost_usd_micros ?? 0);
    for (const ruleId of (row.rule_ids as string[]) ?? []) {
      ruleCounts[ruleId] = (ruleCounts[ruleId] ?? 0) + 1;
    }
    for (const chunkId of (row.kb_chunk_ids as string[]) ?? []) {
      chunkCounts[chunkId] = (chunkCounts[chunkId] ?? 0) + 1;
    }
  }

  let chatOk = 0;
  let chatError = 0;
  for (const row of chatRows) {
    if (row.status === "ok") chatOk += 1;
    else chatError += 1;
  }

  const topRules = Object.entries(ruleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));

  const topChunks = Object.entries(chunkCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));

  return {
    days,
    totalUsers: profilesRes.count ?? 0,
    signups7d: signups7Res.count ?? 0,
    signups30d: signups30Res.count ?? 0,
    householdsWithData: householdRes.count ?? 0,
    adviceRuns: adviceRows.length,
    adviceByStatus,
    adviceSpendUsd: adviceSpendMicros / 1_000_000,
    chatRuns: chatRows.length,
    chatOk,
    chatError,
    topRules,
    topChunks,
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

    const [{ count: householdCount }, { data: lastAdvice }] = await Promise.all([
      supabaseAdmin.from("households").select("id", { count: "exact", head: true }).eq("owner_id", profile.id),
      supabaseAdmin.from("advice_runs").select("created_at").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    enriched.push({
      ...profile,
      email,
      hasHousehold: (householdCount ?? 0) > 0,
      lastAdviceAt: lastAdvice?.created_at ?? null,
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

  const [{ data: adviceRuns }, { count: threadCount }, { data: errors }] = await Promise.all([
    supabaseAdmin.from("advice_runs").select("id, status, created_at, rule_ids").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    supabaseAdmin.from("advice_threads").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabaseAdmin.from("app_error_events").select("id, severity, category, message, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
  ]);

  return {
    profile,
    email: authUser?.user?.email ?? null,
    recentAdviceRuns: adviceRuns ?? [],
    threadCount: threadCount ?? 0,
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
    query = query.or("severity.eq.blocker,category.in.(auth,sync,advice)");
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

async function handleKnowledgeListSources(supabaseAdmin: SupabaseClient) {
  const { data, error } = await supabaseAdmin.from("knowledge_sources").select("*").order("id");
  if (error) return { error: error.message };
  return { sources: data ?? [] };
}

async function handleKnowledgeUpsertSource(
  supabaseAdmin: SupabaseClient,
  adminId: string,
  payload: ActionPayload,
) {
  const source = payload.source as Record<string, unknown>;
  if (!source?.id) return { error: "missing_source_id" };

  const row = {
    id: String(source.id),
    type: String(source.type ?? "book"),
    title: String(source.title ?? source.id),
    locale: String(source.locale ?? "en"),
    doc_path: source.doc_path ? String(source.doc_path) : null,
    country_code: source.country_code ? String(source.country_code) : null,
    is_active: source.is_active !== false,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from("knowledge_sources").upsert(row);
  if (error) return { error: error.message };

  await writeAuditLog(supabaseAdmin, { adminId, action: "knowledge.upsertSource", metadata: { id: row.id } });
  return { ok: true, source: row };
}

async function handleKnowledgeListChunks(supabaseAdmin: SupabaseClient, payload: ActionPayload) {
  let query = supabaseAdmin.from("knowledge_chunks").select("*").order("id");
  if (payload.sourceId) query = query.eq("source_id", String(payload.sourceId));
  const { data, error } = await query;
  if (error) return { error: error.message };
  return { chunks: data ?? [] };
}

async function handleKnowledgeUpsertChunk(
  supabaseAdmin: SupabaseClient,
  adminId: string,
  payload: ActionPayload,
) {
  const chunk = payload.chunk as Record<string, unknown>;
  if (!chunk?.id) return { error: "missing_chunk_id" };

  const row = {
    id: String(chunk.id),
    source_id: String(chunk.source_id ?? "unknown"),
    locale: String(chunk.locale ?? "en"),
    topic_tags: Array.isArray(chunk.topic_tags) ? chunk.topic_tags : [],
    excerpt: String(chunk.excerpt ?? ""),
    metadata: chunk.metadata && typeof chunk.metadata === "object" ? chunk.metadata : {},
    country_code: chunk.country_code ? String(chunk.country_code) : null,
    is_published: Boolean(chunk.is_published),
    updated_by: adminId,
    updated_at: new Date().toISOString(),
    version: Number(chunk.version ?? 1),
  };

  const { error } = await supabaseAdmin.from("knowledge_chunks").upsert(row);
  if (error) return { error: error.message };

  await writeAuditLog(supabaseAdmin, { adminId, action: "knowledge.upsertChunk", metadata: { id: row.id } });
  return { ok: true, chunk: row };
}

async function handleKnowledgeDeleteChunk(
  supabaseAdmin: SupabaseClient,
  adminId: string,
  payload: ActionPayload,
) {
  const chunkId = String(payload.chunkId ?? "");
  if (!chunkId) return { error: "missing_chunk_id" };

  const { error } = await supabaseAdmin.from("knowledge_chunks").delete().eq("id", chunkId);
  if (error) return { error: error.message };

  await writeAuditLog(supabaseAdmin, { adminId, action: "knowledge.deleteChunk", metadata: { chunkId } });
  return { ok: true };
}

async function handleKnowledgeListRoutes(supabaseAdmin: SupabaseClient) {
  const { data, error } = await supabaseAdmin.from("knowledge_routes").select("*").order("route_type");
  if (error) return { error: error.message };
  return { routes: data ?? [] };
}

async function handleKnowledgeUpsertRoute(
  supabaseAdmin: SupabaseClient,
  adminId: string,
  payload: ActionPayload,
) {
  const route = payload.route as Record<string, unknown>;
  if (!route?.route_type) return { error: "missing_route_type" };

  const row: Record<string, unknown> = {
    route_type: String(route.route_type),
    rule_id: route.rule_id ? String(route.rule_id) : null,
    tab_key: route.tab_key ? String(route.tab_key) : null,
    country_code: String(route.country_code ?? "CZ"),
    keywords: Array.isArray(route.keywords) ? route.keywords : [],
    chunk_ids: Array.isArray(route.chunk_ids) ? route.chunk_ids : [],
    priority: Number(route.priority ?? 0),
    updated_at: new Date().toISOString(),
  };

  if (route.id) row.id = String(route.id);

  const { data, error } = await supabaseAdmin
    .from("knowledge_routes")
    .upsert(row)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await writeAuditLog(supabaseAdmin, { adminId, action: "knowledge.upsertRoute", metadata: { id: data?.id } });
  return { ok: true, route: data };
}

async function handleKnowledgeDeleteSource(
  supabaseAdmin: SupabaseClient,
  adminId: string,
  payload: ActionPayload,
) {
  const sourceId = String(payload.sourceId ?? "");
  if (!sourceId) return { error: "missing_source_id" };

  const { error } = await supabaseAdmin.from("knowledge_sources").delete().eq("id", sourceId);
  if (error) return { error: error.message };

  await writeAuditLog(supabaseAdmin, { adminId, action: "knowledge.deleteSource", metadata: { sourceId } });
  return { ok: true };
}

async function handleKnowledgeDeleteRoute(
  supabaseAdmin: SupabaseClient,
  adminId: string,
  payload: ActionPayload,
) {
  const routeId = String(payload.routeId ?? "");
  if (!routeId) return { error: "missing_route_id" };

  const { error } = await supabaseAdmin.from("knowledge_routes").delete().eq("id", routeId);
  if (error) return { error: error.message };

  await writeAuditLog(supabaseAdmin, { adminId, action: "knowledge.deleteRoute", metadata: { routeId } });
  return { ok: true };
}

async function handleKnowledgePublish(
  supabaseAdmin: SupabaseClient,
  adminId: string,
) {
  const coachVersion = await resolvePromptVersion(supabaseAdmin, "coach");
  const chatVersion = await resolvePromptVersion(supabaseAdmin, "chat");

  const nextCoach = bumpVersion(coachVersion);
  const nextChat = bumpVersion(chatVersion);

  await supabaseAdmin.from("prompt_versions").update({ is_active: false }).eq("key", "coach");
  await supabaseAdmin.from("prompt_versions").update({ is_active: false }).eq("key", "chat");

  await supabaseAdmin.from("prompt_versions").upsert([
    { key: "coach", version: nextCoach, is_active: true, published_at: new Date().toISOString() },
    { key: "chat", version: nextChat, is_active: true, published_at: new Date().toISOString() },
  ]);

  await supabaseAdmin
    .from("knowledge_chunks")
    .update({ is_published: true, updated_by: adminId, updated_at: new Date().toISOString() })
    .neq("id", "");

  await writeAuditLog(supabaseAdmin, {
    adminId,
    action: "knowledge.publish",
    metadata: { coachVersion: nextCoach, chatVersion: nextChat },
  });

  const { count } = await supabaseAdmin
    .from("knowledge_chunks")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);

  return {
    ok: true,
    coachVersion: nextCoach,
    chatVersion: nextChat,
    publishedChunks: count ?? 0,
  };
}

function bumpVersion(version: string): string {
  const match = version.match(/^v(\d+)(.*)$/);
  if (!match) return `${version}-kb1`;
  const num = Number(match[1]) + 1;
  return `v${num}${match[2] ?? ""}`;
}

async function handleKnowledgeSeed(
  supabaseAdmin: SupabaseClient,
  adminId: string,
  payload: ActionPayload,
) {
  const publish = Boolean(payload.publish);
  const result = await seedKnowledgeBundle(supabaseAdmin, adminId, publish);
  await writeAuditLog(supabaseAdmin, {
    adminId,
    action: "knowledge.seed",
    metadata: result,
  });
  return { ok: true, ...result };
}

async function handleKnowledgeStatus(supabaseAdmin: SupabaseClient) {
  const [{ count: totalChunks }, { count: publishedChunks }, coachVersion, chatVersion, { data: sources }] =
    await Promise.all([
      supabaseAdmin.from("knowledge_chunks").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("knowledge_chunks").select("id", { count: "exact", head: true }).eq("is_published", true),
      resolvePromptVersion(supabaseAdmin, "coach"),
      resolvePromptVersion(supabaseAdmin, "chat"),
      supabaseAdmin.from("knowledge_sources").select("id, title, is_active").order("id"),
    ]);

  const liveInDb = (publishedChunks ?? 0) > 0;
  return {
    totalChunks: totalChunks ?? 0,
    publishedChunks: publishedChunks ?? 0,
    liveInDb,
    coachVersion,
    chatVersion,
    sources: sources ?? [],
  };
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
      case "knowledge.listSources":
        result = await handleKnowledgeListSources(supabaseAdmin);
        break;
      case "knowledge.upsertSource":
        result = await handleKnowledgeUpsertSource(supabaseAdmin, userId, payload);
        break;
      case "knowledge.listChunks":
        result = await handleKnowledgeListChunks(supabaseAdmin, payload);
        break;
      case "knowledge.upsertChunk":
        result = await handleKnowledgeUpsertChunk(supabaseAdmin, userId, payload);
        break;
      case "knowledge.deleteChunk":
        result = await handleKnowledgeDeleteChunk(supabaseAdmin, userId, payload);
        break;
      case "knowledge.listRoutes":
        result = await handleKnowledgeListRoutes(supabaseAdmin);
        break;
      case "knowledge.upsertRoute":
        result = await handleKnowledgeUpsertRoute(supabaseAdmin, userId, payload);
        break;
      case "knowledge.deleteSource":
        result = await handleKnowledgeDeleteSource(supabaseAdmin, userId, payload);
        break;
      case "knowledge.deleteRoute":
        result = await handleKnowledgeDeleteRoute(supabaseAdmin, userId, payload);
        break;
      case "knowledge.publish":
        result = await handleKnowledgePublish(supabaseAdmin, userId);
        break;
      case "knowledge.seed":
        result = await handleKnowledgeSeed(supabaseAdmin, userId, payload);
        break;
      case "knowledge.status":
        result = await handleKnowledgeStatus(supabaseAdmin);
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
