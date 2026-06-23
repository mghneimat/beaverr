#!/usr/bin/env node
/**
 * One-shot migration: onboarding q* i18n keys → semantic camelCase names.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const SECTION_KEY_RENAMES = {
  income: {
    q5: 'yourIncome',
    q5a: 'partnerIncome',
    q5b: 'otherIncome',
    q5c: 'savings',
  },
  housing: {
    q6: 'housingStatus',
    q6a: 'rentDetails',
    q6b: 'rentUtilities',
    q6c: 'housingUtilities',
    q6d: 'mortgageStatus',
    q6e: 'mortgageDetails',
    q6f: 'ownershipCosts',
    q6g: 'govtTaxes',
    q6h: 'familyHousing',
  },
  transport: {
    q7: 'vehicleOwnership',
    q7Count: 'vehicleCounts',
    q7a: 'vehicleFuel',
    q7b: 'vehicleInsurance',
    q7c: 'vehicleMaintenance',
    q7d: 'vehicleService',
    q7bicycle: 'bicycle',
    q7e: 'publicTransport',
  },
  health: { q8: 'healthCoverage' },
  childrenCosts: { q9: 'childrenCosts' },
  pets: { q10: 'hasPets', q10a: 'petDetails' },
  subscriptions: { q11: 'serviceSelection' },
  otherCosts: { q12: 'costSelection' },
  debts: { q13: 'hasDebts', q13a: 'debtDetails' },
  budget: { q14: 'budgetSplit', q14a: 'rollover', q14b: 'spendingStrategy' },
  review: { q15: 'review' },
};

const Q5D_GOAL_INTENTS = [
  'title', 'helper', 'illustrationA11y',
  'intentClarity', 'intentClarityDesc', 'intentSpendLess', 'intentSpendLessDesc',
  'intentBuildMore', 'intentBuildMoreDesc', 'validationType',
];

const Q5D_GOAL_MODE_MAP = {
  saveModeTitle: 'title',
  saveModeHelper: 'helper',
  saveModeIllustrationA11y: 'illustrationA11y',
  saveModeTarget: 'target',
  saveModeTargetDesc: 'targetDesc',
  saveModeOngoing: 'ongoing',
  saveModeOngoingDesc: 'ongoingDesc',
  validationSaveMode: 'validation',
};

const Q5D_GOAL_DETAILS = [
  'targetTitle', 'targetHelper', 'ongoingTitle', 'ongoingHelper',
  'descriptionLabel', 'descriptionPlaceholder', 'amountLabel', 'amountPlaceholder',
  'dateLabel', 'monthlyTargetLabel', 'monthlyTargetPlaceholder',
  'validationTargetAmount', 'validationTargetDate', 'validationOngoingAmount',
];

function splitQ5d(incomeSection, strategySection) {
  const q5d = incomeSection?.q5d;
  if (!q5d || typeof q5d !== 'object') return;

  strategySection.goalIntents = {};
  for (const key of Q5D_GOAL_INTENTS) {
    if (q5d[key] !== undefined) strategySection.goalIntents[key] = q5d[key];
  }

  strategySection.goalMode = {};
  for (const [oldKey, newKey] of Object.entries(Q5D_GOAL_MODE_MAP)) {
    if (q5d[oldKey] !== undefined) strategySection.goalMode[newKey] = q5d[oldKey];
  }

  strategySection.goalDetails = {};
  for (const key of Q5D_GOAL_DETAILS) {
    if (q5d[key] !== undefined) strategySection.goalDetails[key] = q5d[key];
  }

  delete incomeSection.q5d;
}

function renameSectionKeys(onboarding) {
  for (const [section, map] of Object.entries(SECTION_KEY_RENAMES)) {
    const obj = onboarding[section];
    if (!obj) continue;
    for (const [oldKey, newKey] of Object.entries(map)) {
      if (obj[oldKey] !== undefined) {
        obj[newKey] = obj[oldKey];
        delete obj[oldKey];
      }
    }
  }
  splitQ5d(onboarding.income, onboarding.strategy);
}

function parseLocaleJson(raw) {
  // Locale files may contain trailing commas (valid in app bundler, not in strict JSON).
  return JSON.parse(raw.replace(/,\s*([}\]])/g, '$1'));
}

function migrateLocale(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = parseLocaleJson(raw);
  if (data.onboarding) renameSectionKeys(data.onboarding);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

/** @type {Array<[string, string]>} */
const T_REPLACEMENTS = [];

for (const [section, map] of Object.entries(SECTION_KEY_RENAMES)) {
  for (const [oldKey, newKey] of Object.entries(map)) {
    T_REPLACEMENTS.push([`onboarding.${section}.${oldKey}.`, `onboarding.${section}.${newKey}.`]);
    T_REPLACEMENTS.push([`onboarding.${section}.${oldKey}'`, `onboarding.${section}.${newKey}'`]);
    T_REPLACEMENTS.push([`onboarding.${section}.${oldKey}"`, `onboarding.${section}.${newKey}"`]);
    T_REPLACEMENTS.push([`onboarding.${section}.${oldKey}\``, `onboarding.${section}.${newKey}\``]);
  }
}

for (const key of Q5D_GOAL_INTENTS) {
  T_REPLACEMENTS.push([`onboarding.income.q5d.${key}`, `onboarding.strategy.goalIntents.${key}`]);
}
for (const [oldKey, newKey] of Object.entries(Q5D_GOAL_MODE_MAP)) {
  T_REPLACEMENTS.push([`onboarding.income.q5d.${oldKey}`, `onboarding.strategy.goalMode.${newKey}`]);
}
for (const key of Q5D_GOAL_DETAILS) {
  T_REPLACEMENTS.push([`onboarding.income.q5d.${key}`, `onboarding.strategy.goalDetails.${key}`]);
}

T_REPLACEMENTS.sort((a, b) => b[0].length - a[0].length);

/** Step id replacements — longest first */
const STEP_REPLACEMENTS = [
  ['q5d-details', 'goalDetails'],
  ['q5d-mode', 'goalMode'],
  ['q7bicycle', 'bicycle'],
  ['q7Count', 'vehicleCounts'],
  ['q14a', 'rollover'],
  ['q14b', 'spendingStrategy'],
  ['q5a', 'partnerIncome'],
  ['q5b', 'otherIncome'],
  ['q5c', 'savings'],
  ['q10a', 'petDetails'],
  ['q13a', 'debtDetails'],
  ['q6a', 'rentDetails'],
  ['q6b', 'rentUtilities'],
  ['q6c', 'housingUtilities'],
  ['q6d', 'mortgageStatus'],
  ['q6e', 'mortgageDetails'],
  ['q6f', 'ownershipCosts'],
  ['q6g', 'govtTaxes'],
  ['q6h', 'familyHousing'],
  ['q7a', 'vehicleFuel'],
  ['q7b', 'vehicleInsurance'],
  ['q7c', 'vehicleMaintenance'],
  ['q7d', 'vehicleService'],
  ['q7e', 'publicTransport'],
  ['q5d', 'goalIntents'],
  ['q5', 'yourIncome'],
  ['q6', 'housingStatus'],
  ['q7', 'vehicleOwnership'],
  ['q8', 'healthCoverage'],
  ['q9', 'childrenCosts'],
  ['q10', 'hasPets'],
  ['q11', 'serviceSelection'],
  ['q12', 'costSelection'],
  ['q13', 'hasDebts'],
  ['q14', 'budgetSplit'],
  ['q15', 'review'],
];

const SKIP_DIRS = new Set(['node_modules', '.git', '.tmp-boot-loader-test', '.tmp-bundle-check', '.tmp-error-check', 'dist', 'build']);

function walk(dir, exts, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, exts, files);
    else if (exts.some((e) => ent.name.endsWith(e))) files.push(full);
  }
  return files;
}

function applyReplacements(content) {
  let out = content;
  for (const [from, to] of T_REPLACEMENTS) {
    out = out.split(from).join(to);
  }
  return out;
}

function applyStepReplacements(content) {
  let out = content;
  for (const [from, to] of STEP_REPLACEMENTS) {
    const patterns = [
      new RegExp(`'${from}'`, 'g'),
      new RegExp(`"${from}"`, 'g'),
      new RegExp(`\`${from}\``, 'g'),
      new RegExp(`\\?step=${from}\\b`, 'g'),
      new RegExp(`step: '${from}'`, 'g'),
      new RegExp(`step: "${from}"`, 'g'),
      new RegExp(`progressStep={${from}}`, 'g'),
      new RegExp(`progressStep="${from}"`, 'g'),
      new RegExp(`progressStep='${from}'`, 'g'),
      new RegExp(`animationKey="${from}"`, 'g'),
      new RegExp(`animationKey='${from}'`, 'g'),
      new RegExp(`animationKey={\`${from}`, 'g'),
      new RegExp(`=== '${from}'`, 'g'),
      new RegExp(`=== "${from}"`, 'g'),
      new RegExp(`!== '${from}'`, 'g'),
      new RegExp(`!== "${from}"`, 'g'),
      new RegExp(`setStep\\('${from}'\\)`, 'g'),
      new RegExp(`setStep\\("${from}"\\)`, 'g'),
      new RegExp(`\\| '${from}'`, 'g'),
      new RegExp(`return '${from}'`, 'g'),
      new RegExp(`\\b${from}:`, 'g'),
    ];
    for (const re of patterns) {
      out = out.replace(re, (m) => m.replace(from, to));
    }
  }
  // Template literals like `q14a-${rolloverStrategy}`
  out = out.replace(/`rollover-\$\{/g, '`rollover-${');
  out = out.replace(/animationKey=\{rolloverStrategy \? `q14a-/g, 'animationKey={rolloverStrategy ? `rollover-');
  return out;
}

function patchLibComments(content) {
  return content
    .replace(/onboarding q14 \(before rollover step\)/g, 'onboarding budgetSplit (before rollover step)')
    .replace(/Persist monthly rollover choices \(Q14a\)/g, 'Persist monthly rollover choices (rollover step)')
    .replace(/budgetOnboardingStep: 'rollover'/g, "budgetOnboardingStep: 'rollover'")
    .replace(/Service keys map to onboarding\.subscriptions\.q11\./g, 'Service keys map to onboarding.subscriptions.serviceSelection.')
    .replace(/formerly income q5d/g, 'goal intents / mode / details steps');
}

function migrateSourceFile(filePath) {
  if (filePath.includes('migrate-q-i18n-keys.mjs')) return false;
  if (filePath.includes('onboardingStepAliases.js')) return false;
  if (filePath.includes('onboarding-flow-documentation.md')) return false;
  if (filePath.includes('onboarding-extraction.md')) return false;

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  content = applyReplacements(content);
  content = applyStepReplacements(content);
  content = patchLibComments(content);

  if (filePath.includes('onboardingStepRegistry.js')) {
    content = content.replace(/raw === 'q14a'/, "raw === 'rollover'");
    content = content.replace(/raw === 'q14a'/, "raw === 'rollover'");
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function patchSkills() {
  for (const rel of ['.cursor/skills/custom-storage/SKILL.md', '.cursor/skills/custom-finance/SKILL.md']) {
    const fp = path.join(root, rel);
    if (!fs.existsSync(fp)) continue;
    let c = fs.readFileSync(fp, 'utf8');
    c = c.replace(/PocketOS/g, 'Beaverr').replace(/pocketos/g, 'beaverr').replace(/pocket-os/g, 'beaverr');
    fs.writeFileSync(fp, c, 'utf8');
  }
}

// Run
migrateLocale(path.join(root, 'lib/locales/en.json'));
migrateLocale(path.join(root, 'lib/locales/cs.json'));

const sourceFiles = [
  ...walk(path.join(root, 'app'), ['.js', '.jsx']),
  ...walk(path.join(root, 'components'), ['.js', '.jsx']),
  ...walk(path.join(root, 'lib'), ['.js', '.jsx']),
  ...walk(path.join(root, '__tests__'), ['.js', '.jsx']),
];

let changed = 0;
for (const f of sourceFiles) {
  if (migrateSourceFile(f)) changed += 1;
}
patchSkills();

console.log(`Locale files updated. Source files changed: ${changed}`);
