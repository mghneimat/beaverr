#!/usr/bin/env node
/**
 * Run advice narration evals against Google Cloud Vertex Gemini (EU multi-region).
 *
 * Auth (first match wins):
 *   1. GEMINI_ACCESS_TOKEN
 *   2. Application Default Credentials (gcloud auth application-default login)
 *   3. GEMINI_API_KEY — legacy AI Studio only
 *
 * Usage:
 *   npm run advice:eval
 *   node scripts/run-advice-evals.mjs --mechanical-only
 *
 * Loads .env.local / .env from repo root if present.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { buildLlmRequest } from '../lib/advice/buildLlmRequest.js';
import { geminiGenerateContent } from '../lib/advice/geminiClient.js';
import { resolveGeminiAuth } from '../lib/advice/geminiAuth.js';
import { DEFAULT_GEMINI_MODEL } from '../lib/advice/constants.js';
import { runMechanicalAssertions } from '../lib/advice/__evals__/assertions/mechanical.js';
import { runQualitativeJudge } from '../lib/advice/__evals__/assertions/qualitative.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FIXTURES_DIR = join(ROOT, 'lib/advice/__evals__/fixtures');
const REPORTS_DIR = join(ROOT, 'lib/advice/__evals__/reports');

loadEnvFiles();

const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
const skipJudge = process.argv.includes('--mechanical-only');

let geminiAuth;
try {
  geminiAuth = await resolveGeminiAuth();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

/** @type {{ accessToken?: string, apiKey?: string, projectId?: string }} */
const auth =
  geminiAuth.mode === 'vertex'
    ? { accessToken: geminiAuth.accessToken, projectId: geminiAuth.projectId }
    : { apiKey: geminiAuth.apiKey };

const authLabel =
  geminiAuth.mode === 'vertex'
    ? `Vertex EU (project: ${geminiAuth.projectId})`
    : 'AI Studio (legacy API key)';

const fixtureFiles = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.json'));
const fixtures = fixtureFiles.map((f) => {
  const data = JSON.parse(readFileSync(join(FIXTURES_DIR, f), 'utf8'));
  return data;
});

console.log(`\nAdvice eval — model: ${model} — auth: ${authLabel} — fixtures: ${fixtures.length}\n`);

const reportLines = [
  `# Advice eval report`,
  ``,
  `- **Date:** ${new Date().toISOString()}`,
  `- **Model:** ${model}`,
  `- **Auth:** ${authLabel}`,
  `- **Prompt version:** from buildLlmRequest`,
  ``,
];

let allMechanicalPass = true;
let allQualitativePass = true;

for (const fixture of fixtures) {
  console.log(`--- ${fixture.id} ---`);

  const { systemPrompt, userMessage, kbChunkIds } = buildLlmRequest({
    snapshot: fixture.snapshot,
    triggered_rules: fixture.triggered_rules,
    locale: fixture.locale,
  });

  let rawText;
  let usage;
  try {
    const gen = await geminiGenerateContent({
      ...auth,
      model,
      systemPrompt,
      userMessage,
    });
    rawText = gen.text;
    usage = gen.usage;
    console.log(`  tokens: in=${usage.promptTokens} out=${usage.completionTokens}`);
  } catch (err) {
    console.error(`  FAIL generate: ${err.message}`);
    allMechanicalPass = false;
    reportLines.push(`## ${fixture.id}`, ``, `**Generate failed:** ${err.message}`, ``);
    continue;
  }

  const mechanical = runMechanicalAssertions(fixture.id, fixture, rawText, { kbChunkIds });
  for (const r of mechanical.results) {
    console.log(`  ${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.label}${r.detail ? ` (${r.detail})` : ''}`);
  }
  if (!mechanical.pass) allMechanicalPass = false;

  reportLines.push(`## ${fixture.id}`, ``);
  reportLines.push('### Narrative', '```json', JSON.stringify(mechanical.narrative || rawText, null, 2), '```', '');
  reportLines.push('### Mechanical', '');
  for (const r of mechanical.results) {
    reportLines.push(`- ${r.pass ? 'PASS' : 'FAIL'} **${r.id}** ${r.label}${r.detail ? ` — ${r.detail}` : ''}`);
  }
  reportLines.push('');

  if (!skipJudge && mechanical.narrative) {
    try {
      const qualitative = await runQualitativeJudge({
        auth,
        model,
        fixture,
        narrative: mechanical.narrative,
        rawText,
      });
      for (const r of qualitative.results) {
        console.log(`  ${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.reason || ''}`);
      }
      if (!qualitative.pass) allQualitativePass = false;
      reportLines.push('### Qualitative (LLM judge)', '');
      for (const r of qualitative.results) {
        reportLines.push(`- ${r.pass ? 'PASS' : 'FAIL'} **${r.id}** — ${r.reason || ''}`);
      }
      reportLines.push('');
    } catch (err) {
      console.error(`  FAIL judge: ${err.message}`);
      allQualitativePass = false;
      reportLines.push(`### Qualitative`, `Judge failed: ${err.message}`, '');
    }
  }
}

const mechanicalVerdict = allMechanicalPass ? 'PASS' : 'FAIL';
const qualitativeVerdict = skipJudge ? 'SKIPPED' : (allQualitativePass ? 'PASS' : 'FAIL');

reportLines.push('---', '', `**Mechanical verdict:** ${mechanicalVerdict}`, `**Qualitative verdict:** ${qualitativeVerdict}`, '');

mkdirSync(REPORTS_DIR, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const reportPath = join(REPORTS_DIR, `REPORT-${stamp}.md`);
const existing = existsSync(reportPath) ? readFileSync(reportPath, 'utf8') + '\n\n---\n\n' : '';
writeFileSync(reportPath, existing + reportLines.join('\n'), 'utf8');

console.log(`\nMechanical: ${mechanicalVerdict}`);
console.log(`Qualitative: ${qualitativeVerdict}`);
console.log(`Report appended: ${reportPath}\n`);

process.exit(allMechanicalPass && (skipJudge || allQualitativePass) ? 0 : 1);

function loadEnvFiles() {
  for (const name of ['.env.local', '.env']) {
    const path = join(ROOT, name);
    if (!existsSync(path)) continue;
    const lines = readFileSync(path, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}
