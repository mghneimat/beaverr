#!/usr/bin/env node
/** Second pass: kebab-case step ids → camelCase */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const KEBAB_TO_CAMEL = [
  ['flexible-budget', 'rollover'],
  ['spending-strategy', 'spendingStrategy'],
  ['budget-split', 'budgetSplit'],
  ['partner-income', 'partnerIncome'],
  ['other-income', 'otherIncome'],
  ['your-income', 'yourIncome'],
  ['goal-intents', 'goalIntents'],
  ['goal-mode', 'goalMode'],
  ['goal-details', 'goalDetails'],
  ['housing-status', 'housingStatus'],
  ['rent-details', 'rentDetails'],
  ['rent-utilities', 'rentUtilities'],
  ['housing-utilities', 'housingUtilities'],
  ['mortgage-status', 'mortgageStatus'],
  ['mortgage-details', 'mortgageDetails'],
  ['ownership-costs', 'ownershipCosts'],
  ['govt-taxes', 'govtTaxes'],
  ['family-housing', 'familyHousing'],
  ['vehicle-ownership', 'vehicleOwnership'],
  ['vehicle-counts', 'vehicleCounts'],
  ['vehicle-fuel', 'vehicleFuel'],
  ['vehicle-insurance', 'vehicleInsurance'],
  ['vehicle-maintenance', 'vehicleMaintenance'],
  ['vehicle-summary', 'vehicleService'],
  ['public-transport', 'publicTransport'],
  ['health-coverage', 'healthCoverage'],
  ['has-pets', 'hasPets'],
  ['pet-details', 'petDetails'],
  ['has-debts', 'hasDebts'],
  ['debt-details', 'debtDetails'],
  ['children-costs', 'childrenCosts'],
  ['q5b-select', 'otherIncome-select'],
];

const SKIP = new Set(['node_modules', '.git', '.tmp-boot-loader-test', '.tmp-bundle-check', '.tmp-error-check']);

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(ent.name) || ent.name.startsWith('.tmp-')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, files);
    else if (/\.(js|jsx|md)$/.test(ent.name) && !ent.name.includes('migrate-q-i18n')) files.push(full);
  }
  return files;
}

function migrate(content) {
  let out = content;
  for (const [from, to] of KEBAB_TO_CAMEL) {
    out = out.split(`'${from}'`).join(`'${to}'`);
    out = out.split(`"${from}"`).join(`"${to}"`);
    out = out.split(`\`${from}\``).join(`\`${to}\``);
    out = out.split(`?step=${from}`).join(`?step=${to}`);
    out = out.split(`step=${from}`).join(`step=${to}`);
  }
  // Comments
  out = out.replace(/\/\/ your-income \| q5a \| q5b \| q5c/g, '// yourIncome | partnerIncome | otherIncome | savings');
  out = out.replace(/q5d-style/g, 'goalIntents-style');
  out = out.replace(/renderQ10a\(\)/g, 'renderPetDetails()');
  out = out.replace(/renderQ10\(\)/g, 'renderHasPets()');
  out = out.replace(/renderQ13a\(\)/g, 'renderDebtDetails()');
  out = out.replace(/renderQ13\(\)/g, 'renderHasDebts()');
  out = out.replace(/function renderQ10a/g, 'function renderPetDetails');
  out = out.replace(/function renderQ10/g, 'function renderHasPets');
  out = out.replace(/function renderQ13a/g, 'function renderDebtDetails');
  out = out.replace(/function renderQ13/g, 'function renderHasDebts');
  out = out.replace(/\/\/ ── Q5:/g, '// ── yourIncome:');
  out = out.replace(/\/\/ ── Q5a:/g, '// ── partnerIncome:');
  out = out.replace(/\/\/ ── Q5b:/g, '// ── otherIncome:');
  out = out.replace(/\/\/ ── Q5c:/g, '// ── savings:');
  return out;
}

// Update onboardingStepAliases values
const aliasesPath = path.join(root, 'lib/onboardingStepAliases.js');
let aliases = fs.readFileSync(aliasesPath, 'utf8');
for (const [from, to] of KEBAB_TO_CAMEL) {
  aliases = aliases.split(`'${from}'`).join(`'${to}'`);
}
aliases = aliases.replace(/budget q14a/g, 'budget rollover step');
fs.writeFileSync(aliasesPath, aliases);

const dirs = ['app', 'components', 'lib', '__tests__'];
let n = 0;
for (const d of dirs) {
  const base = path.join(root, d);
  if (!fs.existsSync(base)) continue;
  for (const f of walk(base)) {
    const orig = fs.readFileSync(f, 'utf8');
    const next = migrate(orig);
    if (next !== orig) {
      fs.writeFileSync(f, next);
      n += 1;
    }
  }
}

console.log(`Kebab→camel: ${n} files updated`);
