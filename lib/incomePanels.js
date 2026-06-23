import { toMonthly } from './finance';

export const INCOME_OVERVIEW_KEY = '__overview__';
export const INCOME_PRIMARY_KEY = 'primary';
export const INCOME_OTHER_KEY = 'other';

/**
 * @typedef {Object} IncomeLineItem
 * @property {string} id
 * @property {string} subcategory
 * @property {number} monthlyAmount
 * @property {number|string} rawAmount
 * @property {string} frequency
 * @property {'user'|'partner'|'other'} editKind
 * @property {number} [otherIndex]
 * @property {boolean} [showLabelField]
 */

/**
 * @typedef {Object} IncomePanel
 * @property {string} key
 * @property {string} label
 * @property {number} total
 * @property {IncomeLineItem[]} lineItems
 */

function lineItem(id, subcategory, amount, frequency, extra = {}) {
  const num = Number(amount) || 0;
  return {
    id,
    subcategory,
    monthlyAmount: toMonthly(num, frequency || 'monthly'),
    rawAmount: num,
    frequency: frequency || 'monthly',
    editKind: extra.editKind || 'user',
    otherIndex: extra.otherIndex,
    showLabelField: extra.showLabelField === true,
  };
}

function userLabel(household, t) {
  if (household?.displayName) {
    return t('dashboard.incomeScreen.namedIncome', { name: household.displayName });
  }
  return t('sectionEdit.income.yourIncome');
}

/**
 * @param {object|null} inc
 * @param {object|null} household
 * @param {(key: string, params?: object) => string} t
 * @returns {IncomePanel[]}
 */
export function buildPrimaryIncomePanels(inc, household, t) {
  const panels = [];
  const hasPartner = household?.type === 'partner' || household?.type === 'single_parent';

  panels.push({
    key: 'user',
    label: userLabel(household, t),
    total: toMonthly(inc?.amount || 0, inc?.frequency || 'monthly'),
    lineItems: [
      lineItem('user', userLabel(household, t), inc?.amount || 0, inc?.frequency || 'monthly', {
        editKind: 'user',
      }),
    ],
  });

  if (hasPartner) {
    panels.push({
      key: 'partner',
      label: t('sectionEdit.income.partnerIncome'),
      total: toMonthly(inc?.partnerAmount || 0, inc?.partnerFrequency || 'monthly'),
      lineItems: [
        lineItem('partner', t('sectionEdit.income.partnerIncome'), inc?.partnerAmount || 0, inc?.partnerFrequency || 'monthly', {
          editKind: 'partner',
        }),
      ],
    });
  }

  return panels;
}

/**
 * @param {object|null} inc
 * @param {(key: string, params?: object) => string} t
 * @returns {IncomePanel[]}
 */
export function buildOtherIncomePanels(inc, t) {
  const rows = inc?.otherIncomeRows || [];
  return rows.map((row, index) => {
    const label = row.label?.trim()
      || t('dashboard.incomeScreen.otherSource', { n: index + 1 });
    return {
      key: `other_${index}`,
      label,
      total: toMonthly(row.amount || 0, row.frequency || 'monthly'),
      lineItems: [
        lineItem(`other_${index}`, label, row.amount || 0, row.frequency || 'monthly', {
          editKind: 'other',
          otherIndex: index,
          showLabelField: true,
        }),
      ],
    };
  });
}

/** All income streams for overview chart and breakdown. */
export function buildOverviewIncomePanels(inc, household, t) {
  return [
    ...buildPrimaryIncomePanels(inc, household, t),
    ...buildOtherIncomePanels(inc, t),
  ];
}

/** Donut chart segments — one slice per stream with income. */
export function buildIncomeChartSections(panels) {
  return panels
    .filter((panel) => panel.total > 0)
    .map((panel) => ({
      key: panel.key,
      label: panel.label,
      value: panel.total,
    }))
    .sort((a, b) => b.value - a.value);
}

const PRIMARY_PANEL_KEYS = new Set(['user', 'partner']);

function panelLineItems(panel) {
  return panel.lineItems
    .filter((item) => item.monthlyAmount > 0)
    .map((item) => ({
      id: item.id,
      label: item.subcategory,
      monthlyAmount: item.monthlyAmount,
    }))
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount);
}

/**
 * Group income streams for the overview breakdown (Main income / Other sources).
 * @param {IncomePanel[]} panels
 * @param {(key: string, params?: object) => string} t
 */
export function buildIncomeSectionGroups(panels, t) {
  const primaryPanels = panels.filter((p) => PRIMARY_PANEL_KEYS.has(p.key) && p.total > 0);
  const otherPanels = panels.filter((p) => p.key.startsWith('other_') && p.total > 0);

  /** @type {{ key: string, label: string, total: number, items: { id: string, label: string, monthlyAmount: number }[] }[]} */
  const sections = [];

  if (primaryPanels.length > 0) {
    const items = primaryPanels.flatMap(panelLineItems);
    sections.push({
      key: 'primary',
      label: t('dashboard.incomeScreen.tabs.primary'),
      total: items.reduce((sum, item) => sum + item.monthlyAmount, 0),
      items,
    });
  }

  if (otherPanels.length > 0) {
    const items = otherPanels.flatMap(panelLineItems);
    sections.push({
      key: 'other',
      label: t('dashboard.incomeScreen.tabs.other'),
      total: items.reduce((sum, item) => sum + item.monthlyAmount, 0),
      items,
    });
  }

  return sections.sort((a, b) => b.total - a.total);
}

/**
 * Resolve primary + secondary tab for an income breakdown section row.
 * @param {string} sectionKey
 * @param {IncomePanel[]} panels
 * @returns {{ primaryTab: string, secondaryTab: string }|null}
 */
export function resolveIncomeSectionNavigation(sectionKey, panels) {
  if (sectionKey === 'primary') {
    const primaryPanels = panels
      .filter((p) => PRIMARY_PANEL_KEYS.has(p.key) && p.total > 0)
      .sort((a, b) => b.total - a.total);
    if (!primaryPanels.length) return null;
    return { primaryTab: INCOME_PRIMARY_KEY, secondaryTab: primaryPanels[0].key };
  }
  if (sectionKey === 'other') {
    const otherPanels = panels
      .filter((p) => p.key.startsWith('other_') && p.total > 0)
      .sort((a, b) => b.total - a.total);
    if (!otherPanels.length) return null;
    return { primaryTab: INCOME_OTHER_KEY, secondaryTab: otherPanels[0].key };
  }
  return null;
}

/**
 * Find one income sub-tab panel by tab + panel key.
 * @param {object|null} inc
 * @param {object|null} household
 * @param {(key: string, params?: object) => string} t
 * @param {'primary'|'other'} primaryTab
 * @param {string} subKey
 * @returns {IncomePanel|null}
 */
export function findIncomePanelByKey(inc, household, t, primaryTab, subKey) {
  const panels = primaryTab === 'other'
    ? buildOtherIncomePanels(inc, t)
    : buildPrimaryIncomePanels(inc, household, t);
  return panels.find((panel) => panel.key === subKey) || panels[0] || null;
}

export function getOtherIncomeAddTemplate() {
  return {
    id: '__add_other_income__',
    subcategory: '',
    rawAmount: '',
    frequency: 'monthly',
    monthlyAmount: 0,
    editKind: 'other',
    otherIndex: -1,
    showLabelField: true,
    isAdd: true,
  };
}
