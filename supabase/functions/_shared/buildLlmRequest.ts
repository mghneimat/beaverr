import { ADVICE_PROMPT_VERSION } from './constants.ts';
import { BEAVERR_COACH_SYSTEM_PROMPT } from './beaverrCoachSystemPrompt.ts';

export function buildLlmRequest(input: {
  snapshot: Record<string, unknown>;
  triggered_rules: unknown[];
  locale: string;
  kb_chunks?: { id: string; excerpt: string }[];
  tab_key?: string;
  promptVersion?: string;
}) {
  const { snapshot, triggered_rules, locale, kb_chunks = [], tab_key, promptVersion } = input;
  const kbChunkIds = kb_chunks.map((c) => c.id).filter(Boolean);

  const payload = {
    v: snapshot.v ?? 1,
    locale: locale || snapshot.locale,
    tab_key: tab_key || snapshot.tab_key || "home",
    household: snapshot.household,
    location: snapshot.location,
    ledger: snapshot.ledger,
    categories: snapshot.categories,
    budget: snapshot.budget,
    goals: snapshot.goals,
    tracker: snapshot.tracker,
    summary: snapshot.summary,
    alerts: snapshot.alerts,
    triggered_rules,
    kb_chunks,
  };

  return {
    systemPrompt: BEAVERR_COACH_SYSTEM_PROMPT,
    userMessage: JSON.stringify(payload),
    promptVersion: promptVersion ?? ADVICE_PROMPT_VERSION,
    kbChunkIds,
  };
}
