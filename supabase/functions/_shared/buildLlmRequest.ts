import { ADVICE_PROMPT_VERSION } from './constants.ts';

const SYSTEM_PROMPT = `You are a calm household budgeting coach for Beaverr (informational guidance only, not regulated financial advice).

Rules:
- Use ONLY numbers and facts from the user message JSON (triggered_rules, ledger, household).
- Do not invent amounts, rates, or facts.
- Do not recommend investment products, stocks, crypto, or specific financial products.
- Do not restate warning text verbatim; add practical next steps.
- Respond in the language given by the "locale" field (cs = formal Czech "vy"; en = English).
- citations_used: ONLY ids from kb_source_ids in the user message (curated book/guide source ids). If kb_source_ids is empty, citations_used MUST be [].
- NEVER put triggered_rules ids (e.g. overcommitted, fixed_cost_ratio_tight) in citations_used — those are not citations.
- Output a single JSON object with keys: headline (string), bullets (array of 2-4 strings), focus_area (one of: budget, costs, debts, goals, savings), citations_used (array of strings).`;

export function buildLlmRequest(input: {
  snapshot: Record<string, unknown>;
  triggered_rules: unknown[];
  locale: string;
  kb_chunk_ids?: string[];
}) {
  const { snapshot, triggered_rules, locale, kb_chunk_ids = [] } = input;
  const payload = {
    v: snapshot.v ?? 1,
    locale: locale || snapshot.locale,
    household: snapshot.household,
    ledger: snapshot.ledger,
    categories: snapshot.categories,
    triggered_rules,
    kb_source_ids: kb_chunk_ids,
  };

  return {
    systemPrompt: SYSTEM_PROMPT,
    userMessage: JSON.stringify(payload),
    promptVersion: ADVICE_PROMPT_VERSION,
    kbChunkIds: kb_chunk_ids,
  };
}
