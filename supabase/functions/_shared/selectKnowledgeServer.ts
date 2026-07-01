import { SupabaseClient } from "npm:@supabase/supabase-js@2";
import bundle from "./knowledgeBundle.json" with { type: "json" };
import {
  ADVICE_PROMPT_VERSION,
} from "./constants.ts";
import { CHAT_PROMPT_VERSION } from "./beaverrChatSystemPrompt.ts";

export type KbChunkPayload = {
  id: string;
  excerpt: string;
  title?: string;
  official_url?: string;
  last_reviewed?: string;
};

type DbChunkRow = {
  id: string;
  excerpt: string;
  metadata?: Record<string, unknown>;
  country_code?: string | null;
};

type RouteRow = {
  route_type: string;
  rule_id?: string | null;
  tab_key?: string | null;
  country_code: string;
  keywords: string[];
  chunk_ids: string[];
};

const SEVERITY_RANK: Record<string, number> = { critical: 0, warning: 1, info: 2 };
const MAX_BOOK_CHUNKS = 2;
const MAX_COUNTRY_CHUNKS = 2;
const MAX_TOTAL_CHUNKS = 4;

function bundleRowToPayload(row: {
  id: string;
  excerpt: string;
  metadata?: Record<string, unknown>;
}): KbChunkPayload {
  const meta = row.metadata ?? {};
  return {
    id: row.id,
    excerpt: row.excerpt,
    title: typeof meta.title === "string" ? meta.title : undefined,
    official_url: typeof meta.official_url === "string" ? meta.official_url : undefined,
    last_reviewed: typeof meta.last_reviewed === "string" ? meta.last_reviewed : undefined,
  };
}

function dbRowToPayload(row: DbChunkRow): KbChunkPayload {
  const meta = row.metadata ?? {};
  return {
    id: row.id,
    excerpt: row.excerpt,
    title: typeof meta.title === "string" ? meta.title : undefined,
    official_url: typeof meta.official_url === "string" ? meta.official_url : undefined,
    last_reviewed: typeof meta.last_reviewed === "string" ? meta.last_reviewed : undefined,
  };
}

function defaultChunkMap(): Map<string, KbChunkPayload> {
  const map = new Map<string, KbChunkPayload>();
  for (const row of [...bundle.book, ...bundle.country]) {
    map.set(row.id, bundleRowToPayload(row));
  }
  return map;
}

export async function loadPublishedChunkMap(
  supabaseAdmin: SupabaseClient,
): Promise<Map<string, KbChunkPayload>> {
  const { data, error } = await supabaseAdmin
    .from("knowledge_chunks")
    .select("id, excerpt, metadata, country_code")
    .eq("is_published", true);

  if (error || !data?.length) {
    return defaultChunkMap();
  }

  const map = new Map<string, KbChunkPayload>();
  for (const row of data as DbChunkRow[]) {
    map.set(row.id, dbRowToPayload(row));
  }
  return map;
}

async function loadRoutes(supabaseAdmin: SupabaseClient): Promise<RouteRow[]> {
  const { data, error } = await supabaseAdmin
    .from("knowledge_routes")
    .select("route_type, rule_id, tab_key, country_code, keywords, chunk_ids");

  if (error || !data?.length) {
    return [];
  }
  return data as RouteRow[];
}

function matchMessageToChunkIds(message: string, routes: RouteRow[], countryCode: string): string[] {
  if (!message) return [];
  const lower = message.toLowerCase();
  const matched: string[] = [];
  for (const route of routes) {
    if (route.route_type !== "chat_keyword") continue;
    if (route.country_code !== countryCode) continue;
    if (route.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      matched.push(...route.chunk_ids);
    }
  }
  return matched;
}

function ruleRoutesFor(routes: RouteRow[], ruleId: string, countryCode: string): string[] {
  const ids: string[] = [];
  for (const route of routes) {
    if (route.route_type !== "rule" || route.rule_id !== ruleId) continue;
    if (route.country_code === countryCode || !route.country_code) {
      ids.push(...route.chunk_ids);
    }
  }
  return ids;
}

function tabRoutesFor(routes: RouteRow[], tabKey: string, countryCode: string): string[] {
  const ids: string[] = [];
  for (const route of routes) {
    if (route.route_type !== "tab" || route.tab_key !== tabKey) continue;
    if (route.country_code === countryCode || !route.country_code) {
      ids.push(...route.chunk_ids);
    }
  }
  return ids;
}

function isCountryChunkId(id: string): boolean {
  return id.startsWith("cz_official#");
}

function selectBookChunkIds(
  triggeredRules: unknown[],
  tabKey: string,
  routes: RouteRow[],
  mode: "insight" | "chat" = "insight",
): string[] {
  const rules = Array.isArray(triggeredRules) ? triggeredRules : [];
  const sorted = [...rules].sort((a, b) => {
    const aRule = a as { severity?: string; id?: string };
    const bRule = b as { severity?: string; id?: string };
    const sa = SEVERITY_RANK[aRule.severity ?? ""] ?? 3;
    const sb = SEVERITY_RANK[bRule.severity ?? ""] ?? 3;
    return sa - sb;
  });

  const candidateIds: string[] = [];
  for (const rule of sorted) {
    const ruleId = (rule as { id?: string }).id;
    if (!ruleId) continue;
    if (mode === "chat") continue;
    candidateIds.push(...ruleRoutesFor(routes, ruleId, "CZ").filter((id) => !isCountryChunkId(id)));
  }

  if (mode === "insight") {
    candidateIds.unshift(...tabRoutesFor(routes, tabKey, "CZ").filter((id) => !isCountryChunkId(id)));
  }

  const uniqueIds: string[] = [];
  for (const id of candidateIds) {
    if (!uniqueIds.includes(id)) uniqueIds.push(id);
    if (uniqueIds.length >= MAX_BOOK_CHUNKS) break;
  }
  return uniqueIds;
}

function selectCountryChunkIds(
  triggeredRules: unknown[],
  tabKey: string,
  countryCode: string,
  userMessage: string | undefined,
  routes: RouteRow[],
  mode: "insight" | "chat" = "insight",
): string[] {
  const code = (countryCode || "CZ").toUpperCase();
  if (code !== "CZ") return [];

  const candidateIds: string[] = [];
  if (userMessage) {
    candidateIds.push(...matchMessageToChunkIds(userMessage, routes, code).filter(isCountryChunkId));
  }

  if (mode === "insight") {
    const rules = Array.isArray(triggeredRules) ? triggeredRules : [];
    for (const rule of rules) {
      const ruleId = (rule as { id?: string }).id;
      if (!ruleId) continue;
      candidateIds.push(...ruleRoutesFor(routes, ruleId, code).filter(isCountryChunkId));
    }
  }

  if (mode === "insight") {
    candidateIds.unshift(...tabRoutesFor(routes, tabKey, code).filter(isCountryChunkId));
  }

  const uniqueIds: string[] = [];
  for (const id of candidateIds) {
    if (!uniqueIds.includes(id)) uniqueIds.push(id);
    if (uniqueIds.length >= MAX_COUNTRY_CHUNKS) break;
  }
  return uniqueIds;
}

export async function selectKnowledgeServer(
  supabaseAdmin: SupabaseClient,
  input: {
    triggered_rules: unknown[];
    tabKey: string;
    countryCode: string;
    userMessage?: string;
    mode?: "insight" | "chat";
  },
): Promise<KbChunkPayload[]> {
  const mode = input.mode ?? (input.userMessage ? "chat" : "insight");
  const [chunkMap, routes] = await Promise.all([
    loadPublishedChunkMap(supabaseAdmin),
    loadRoutes(supabaseAdmin),
  ]);

  const bookIds = selectBookChunkIds(input.triggered_rules, input.tabKey, routes, mode);
  const countryIds = selectCountryChunkIds(
    input.triggered_rules,
    input.tabKey,
    input.countryCode,
    input.userMessage,
    routes,
    mode,
  );

  const merged: KbChunkPayload[] = [];
  const seen = new Set<string>();

  for (const id of [...bookIds, ...countryIds]) {
    const chunk = chunkMap.get(id);
    if (!chunk || seen.has(chunk.id)) continue;
    seen.add(chunk.id);
    merged.push(chunk);
    if (merged.length >= MAX_TOTAL_CHUNKS) break;
  }

  return merged;
}

export function countryCodeFromSnapshot(snapshot: Record<string, unknown>): string {
  const location = snapshot.location as { country_code?: string } | undefined;
  return (location?.country_code || "CZ").toUpperCase();
}

export async function resolvePromptVersion(
  supabaseAdmin: SupabaseClient,
  key: "coach" | "chat",
): Promise<string> {
  const { data } = await supabaseAdmin
    .from("prompt_versions")
    .select("version")
    .eq("key", key)
    .eq("is_active", true)
    .maybeSingle();

  if (data?.version) return data.version;
  return key === "chat" ? CHAT_PROMPT_VERSION : ADVICE_PROMPT_VERSION;
}

export async function seedKnowledgeBundle(
  supabaseAdmin: SupabaseClient,
  adminId: string,
  publish = false,
): Promise<{ inserted: number; published: boolean }> {
  const rows = [...bundle.book, ...bundle.country].map((row) => ({
    id: row.id,
    source_id: row.source_id,
    locale: row.locale,
    topic_tags: row.topic_tags,
    excerpt: row.excerpt,
    metadata: row.metadata ?? {},
    country_code: row.country_code ?? null,
    is_published: publish,
    updated_by: adminId,
    version: 1,
  }));

  const { error } = await supabaseAdmin.from("knowledge_chunks").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return { inserted: rows.length, published: publish };
}

export function extractOfficialSources(kbChunks: KbChunkPayload[]) {
  return kbChunks
    .filter((c) => c.official_url && c.title)
    .map((c) => ({
      id: c.id,
      title: c.title!,
      official_url: c.official_url!,
      last_reviewed: c.last_reviewed,
    }));
}
