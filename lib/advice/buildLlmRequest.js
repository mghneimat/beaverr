import { ADVICE_PROMPT_VERSION } from './constants.js';
import { BEAVERR_COACH_SYSTEM_PROMPT } from './beaverrCoachSystemPrompt.js';

/**
 * @param {{
 *   snapshot: object,
 *   triggered_rules: object[],
 *   locale: string,
 *   kb_chunks?: { id: string, excerpt: string }[],
 *   tab_key?: string,
 * }} input
 * @returns {{ systemPrompt: string, userMessage: string, promptVersion: string, kbChunkIds: string[] }}
 */
export function buildLlmRequest({ snapshot, triggered_rules, locale, kb_chunks = [], tab_key }) {
  const kbChunkIds = kb_chunks.map((c) => c.id).filter(Boolean);

  const payload = {
    v: snapshot.v ?? 1,
    locale: locale || snapshot.locale,
    tab_key: tab_key || snapshot.tab_key || 'home',
    location: snapshot.location,
    household: snapshot.household,
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
    promptVersion: ADVICE_PROMPT_VERSION,
    kbChunkIds,
  };
}
