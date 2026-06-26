import { geminiGenerateContent } from '../../geminiClient.js';

const JUDGE_SYSTEM = `You are an eval judge for household budgeting advice. Answer each question with JSON only:
{
  "results": [
    { "id": "Q1", "pass": true|false, "reason": "short" },
    ...
  ]
}
Be strict. pass=true only when the criterion is clearly met.`;

/**
 * @param {{
 *   auth: { accessToken?: string, apiKey?: string, projectId?: string, location?: string },
 *   model: string,
 *   fixture: object,
 *   narrative: object,
 *   rawText: string,
 * }} input
 * @returns {Promise<{ pass: boolean, results: object[] }>}
 */
export async function runQualitativeJudge({ auth, model, fixture, narrative, rawText }) {
  const ruleIds = (fixture.triggered_rules || []).map((r) => r.id).join(', ') || '(none)';
  const locale = fixture.locale;

  const userMessage = `Locale: ${locale}
Triggered rules: ${ruleIds}
Fixture id: ${fixture.id}

Advice JSON:
${JSON.stringify(narrative, null, 2)}

Evaluate:
Q1 — Does the advice address the substance of the triggered rules (not generic platitudes)? If no rules, a brief positive summary without inventing problems is OK.
Q2 — No investment products, stock/crypto picks, or broker recommendations.
Q3 — Calm household coach tone; severity matches rules (critical = serious, not casual).
Q4 — If locale is cs: formal "vy" register, not informal "ty". If en: N/A pass.
Q5 — Wording is not a near-verbatim copy of a standard warning template; adds practical next steps.`;

  const { text } = await geminiGenerateContent({
    ...auth,
    model,
    systemPrompt: JUDGE_SYSTEM,
    userMessage,
    responseJson: true,
    temperature: 0.1,
    maxOutputTokens: 800,
  });

  let parsed;
  try {
    parsed = JSON.parse(text.trim().replace(/^```json\s*|\s*```$/g, ''));
  } catch {
    return {
      pass: false,
      results: [{ id: 'Q?', pass: false, reason: 'judge_invalid_json' }],
    };
  }

  const results = Array.isArray(parsed.results) ? parsed.results : [];
  const pass = results.length > 0 && results.every((r) => r.pass === true);

  return { pass, results };
}
