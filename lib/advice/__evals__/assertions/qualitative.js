import { geminiGenerateContent } from '../../geminiClient.js';
import { narrativeText } from '../../parseLlmResponse.js';

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
  const prose = narrativeText(narrative);

  const userMessage = `Locale: ${locale}
Triggered rules: ${ruleIds}
Fixture id: ${fixture.id}

Advice paragraphs (${narrative.paragraphs?.length ?? 0}):
${prose}

Evaluate:
Q1 — Does the advice address the substance of the triggered rules (not generic platitudes)? If no rules, a brief positive summary without inventing problems is OK.
Q2 — No investment products, stock/crypto picks, or broker recommendations.
Q3 — Knowledgeable friend tone: direct, warm, not corporate advisor language; severity matches rules without catastrophising.
Q4 — If locale is cs: formal "vy" register, not informal "ty". If en: N/A pass.
Q5 — Wording adds practical next steps, not a verbatim warning template.
Q6 — When 4 paragraphs: structure reads as Good signal, single Concern, one Action, one Observation (order may blend but roles distinct).
Q7 — No book titles, author names, or framework names (Sethi, CFPB, Ramsey, etc.).`;

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
    parsed = JSON.parse(text);
  } catch {
    return { pass: false, results: [{ id: 'Q0', pass: false, reason: 'judge_invalid_json' }] };
  }

  const results = Array.isArray(parsed.results) ? parsed.results : [];
  const pass = results.length > 0 && results.every((r) => r.pass);
  return { pass, results };
}
