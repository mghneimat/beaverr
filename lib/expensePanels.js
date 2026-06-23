import { toMonthly } from './finance';
import { resolveCategorySectionId } from './sectionEditPaths';
import { getHealthMemberLabel, isActiveHealthMemberKey } from './healthMembers';
import { getHealthMemberBudgetLine, getHealthMemberMonthlyAmount, getVehicleInsuranceBudgetLine } from './healthInsuranceBudget';
import { utilityDisplayName } from './housingUtilities';
import { childCostDisplayName } from './childrenCostsCatalog';
import { subscriptionDisplayName } from './subscriptionCatalog';
import { resolveRowPaymentDates, inferDateTypeFromPaymentDates } from './expenseDateFields';

export const OVERVIEW_TAB_KEY = '__overview__';

/** @deprecated Use OVERVIEW_TAB_KEY */
export const OVERALL_TAB_KEY = OVERVIEW_TAB_KEY;

/** @typedef {'fixed'|'recurring'} ExpensePanelMode */

/**
 * @typedef {Object} ExpenseLineItem
 * @property {string} id
 * @property {string} subcategory
 * @property {number} monthlyAmount
 * @property {number|string} rawAmount
 * @property {string} frequency
 * @property {string|null} [renewalDate]
 * @property {string|null} [dueDate]
 * @property {string|null} [endDate]
 * @property {string} editKind
 * @property {object|null} [editRef]
 * @property {'renewal'|'due'|'end'|null} [dateType]
 * @property {boolean} [supportsFrequency]
 * @property {string} [sectionId]
 * @property {unknown} [source]
 */

/**
 * @typedef {Object} ExpensePanel
 * @property {string} key
 * @property {string} label
 * @property {number} total
 * @property {ExpenseLineItem[]} lineItems
 * @property {string} sectionId
 */

export const FIXED_EXPENSE_TAB_KEYS = [
  'rent',
  'utilities',
  'health_insurance',
  'waste_tax',
  'tv_licence',
  'radio_licence',
];

export const RECURRING_EXPENSE_TAB_KEYS = [
  'subscriptions',
  'internet',
  'pets',
  'mortgage',
  'transport',
  'children',
  'debts',
  'housing_other',
  'family_contribution',
  'other',
  'custom_taxes',
];

const SUBTAB_SECTION = {
  rent: 'housing',
  utilities: 'housing',
  health_insurance: 'health',
  waste_tax: 'housing',
  tv_licence: 'housing',
  radio_licence: 'housing',
  subscriptions: 'subscriptions',
  internet: 'housing',
  pets: 'pets',
  mortgage: 'housing',
  transport: 'transport',
  children: 'children',
  debts: 'debts',
  housing_other: 'housing',
  family_contribution: 'housing',
  other: 'other',
  custom_taxes: 'housing',
};

function subtabLabel(key, t) {
  const path = `dashboard.expensesScreen.subtabs.${key}`;
  const translated = t(path);
  return translated !== path ? translated : key;
}

function lineItemDates(editKind, editRef, source, dateTypeOverride) {
  const dates = resolveRowPaymentDates({ editKind, editRef, source });
  return {
    ...dates,
    dateType: dateTypeOverride ?? inferDateTypeFromPaymentDates(dates),
  };
}

function lineItem(id, subcategory, amount, frequency, extra = {}) {
  const num = Number(amount);
  const computed = extra.editKind
    ? lineItemDates(extra.editKind, extra.editRef ?? null, extra.source ?? extra, extra.dateType)
    : {
      endDate: null,
      dueDate: null,
      chargeDay: null,
      dateType: extra.dateType ?? null,
    };
  return {
    id,
    subcategory,
    monthlyAmount: toMonthly(num, frequency),
    rawAmount: num,
    frequency: frequency || 'monthly',
    renewalDate: null,
    dueDate: null,
    endDate: null,
    editKind: extra.editKind || 'housing_rent',
    editRef: extra.editRef ?? null,
    dateType: null,
    supportsFrequency: extra.supportsFrequency !== false,
    sectionId: extra.sectionId || 'other',
    source: extra.source ?? null,
    ...computed,
    ...extra,
  };
}

function subscriptionLabel(sub, t) {
  return subscriptionDisplayName(sub, t);
}

function otherCostLabel(cost, t) {
  const transKey = `onboarding.otherCosts.costSelection.costs.${cost.name}`;
  const translated = t(transKey);
  return translated !== transKey ? translated : (cost.name || 'Other expense');
}

function childFieldLabel(fieldKey, field, t) {
  return childCostDisplayName(fieldKey, field?.customLabel, t);
}

/**
 * @param {import('./householdBudget').RawSections} sections
 * @param {object|null} household
 * @param {(key: string, params?: object) => string} t
 * @returns {Record<string, ExpenseLineItem[]>}
 */
function collectFixedLineItems(sections, household, t) {
  const housing = sections.housing || {};
  const health = sections.health || {};
  const buckets = Object.fromEntries(FIXED_EXPENSE_TAB_KEYS.map((k) => [k, []]));

  if (housing.type === 'renting' && housing.rent) {
    buckets.rent.push(lineItem('fixed-rent', t('sectionEdit.housing.rent'), housing.rent, 'monthly', {
      editKind: 'housing_rent',
      supportsFrequency: false,
      sectionId: 'housing',
      source: housing,
    }));
  }

  if (housing.utilitiesMode === 'itemized' && housing.utilityItems?.length) {
    housing.utilityItems.forEach((item, idx) => {
      if (!item.amount) return;
      buckets.utilities.push(lineItem(
        `fixed-util-${idx}`,
        utilityDisplayName(item, t),
        item.amount,
        item.frequency || 'monthly',
        {
          editKind: 'housing_utilities',
          sectionId: 'housing',
          source: { item, housing },
        },
      ));
    });
  } else if (housing.utilities) {
    buckets.utilities.push(lineItem(
      'fixed-utilities',
      t('sectionEdit.housing.utilities'),
      housing.utilities,
      housing.utilitiesFrequency || 'monthly',
      {
        editKind: 'housing_utilities',
        sectionId: 'housing',
        source: housing,
      },
    ));
  }

  Object.entries(health).forEach(([key, member]) => {
    if (!isActiveHealthMemberKey(key, household)) return;
    if (!member?.confirmed || member.coverage === 'employer' || !member.premium) return;
    const budgetLine = getHealthMemberBudgetLine(member);
    if (!budgetLine?.amount || budgetLine.amount <= 0) return;
    buckets.health_insurance.push(lineItem(
      `fixed-health-${key}`,
      getHealthMemberLabel(key, household, t),
      budgetLine.amount,
      budgetLine.frequency,
      {
        editKind: 'health_member',
        editRef: { memberKey: key },
        dateType: 'end',
        sectionId: 'health',
        endDate: member.endDate || null,
        source: { member },
      },
    ));
  });

  const gt = housing.govtTaxes || {};
  if (gt.wasteTax && gt.wasteTaxAmount) {
    buckets.waste_tax.push(lineItem(
      'fixed-waste-tax',
      t('onboarding.housing.govtTaxes.wasteTax'),
      gt.wasteTaxAmount,
      'annual',
      {
        editKind: 'housing_govt_tax',
        editRef: { amountField: 'wasteTaxAmount', flagField: 'wasteTax' },
        supportsFrequency: false,
        sectionId: 'housing',
      },
    ));
  }
  if (gt.tvLicence && gt.tvLicenceAmount) {
    buckets.tv_licence.push(lineItem(
      'fixed-tv-licence',
      t('onboarding.housing.govtTaxes.tvLicence'),
      gt.tvLicenceAmount,
      'annual',
      {
        editKind: 'housing_govt_tax',
        editRef: { amountField: 'tvLicenceAmount', flagField: 'tvLicence' },
        supportsFrequency: false,
        sectionId: 'housing',
      },
    ));
  }
  if (gt.radioLicence && gt.radioLicenceAmount) {
    buckets.radio_licence.push(lineItem(
      'fixed-radio-licence',
      t('onboarding.housing.govtTaxes.radioLicence'),
      gt.radioLicenceAmount,
      'annual',
      {
        editKind: 'housing_govt_tax',
        editRef: { amountField: 'radioLicenceAmount', flagField: 'radioLicence' },
        supportsFrequency: false,
        sectionId: 'housing',
      },
    ));
  }

  return buckets;
}

/**
 * @param {import('./householdBudget').RawSections} sections
 * @param {object[]} debts
 * @param {object|null} household
 * @param {(key: string, params?: object) => string} t
 * @returns {Record<string, ExpenseLineItem[]>}
 */
function collectRecurringLineItems(sections, debts, household, t) {
  const housing = sections.housing || {};
  const transport = sections.transport || {};
  const childrenCosts = sections.childrenCosts || {};
  const pets = sections.pets || [];
  const subs = sections.subs || [];
  const otherCosts = sections.otherCosts || [];
  const buckets = Object.fromEntries(RECURRING_EXPENSE_TAB_KEYS.map((k) => [k, []]));

  subs.forEach((sub, idx) => {
    if (!sub.cost) return;
    buckets.subscriptions.push(lineItem(
      `rec-sub-${idx}`,
      subscriptionLabel(sub, t),
      parseFloat(sub.cost),
      sub.frequency || 'monthly',
      {
        editKind: 'subscription',
        editRef: { index: idx },
        dateType: 'renewal',
        sectionId: 'subscriptions',
        endDate: sub.endDate || sub.renewalDate || null,
        renewalDate: sub.endDate || sub.renewalDate || null,
        chargeDay: sub.chargeDay || null,
        source: sub,
      },
    ));
  });

  if (housing.internetAmount) {
    buckets.internet.push(lineItem(
      'rec-internet',
      t('sectionEdit.housing.internet'),
      housing.internetAmount,
      housing.internetFrequency || 'monthly',
      {
        editKind: 'housing_internet',
        sectionId: 'housing',
        source: housing,
      },
    ));
  }

  pets.forEach((pet, pi) => {
    const prefix = pet.name ? `${pet.name} ` : `${t('sectionEdit.pets.unnamed', { n: pi + 1 })} `;
    if (pet.foodAmount) {
      buckets.pets.push(lineItem(
        `rec-pet-food-${pi}`,
        `${prefix}${t('sectionEdit.pets.food')}`,
        pet.foodAmount,
        pet.foodFrequency || 'monthly',
        {
          editKind: 'pet',
          editRef: { index: pi, field: 'food' },
          sectionId: 'pets',
          source: { pet },
        },
      ));
    }
    if (pet.vetAmount) {
      buckets.pets.push(lineItem(
        `rec-pet-vet-${pi}`,
        `${prefix}${t('sectionEdit.pets.vet')}`,
        pet.vetAmount,
        pet.vetFrequency || 'monthly',
        {
          editKind: 'pet',
          editRef: { index: pi, field: 'vet' },
          sectionId: 'pets',
          source: { pet },
        },
      ));
    }
  });

  if (housing.mortgageAmount) {
    buckets.mortgage.push(lineItem(
      'rec-mortgage',
      t('sectionEdit.housing.mortgage'),
      housing.mortgageAmount,
      'monthly',
      {
        editKind: 'housing_mortgage',
        supportsFrequency: false,
        sectionId: 'housing',
        source: housing,
      },
    ));
  }

  if (transport.hasVehicle && transport.vehicles) {
    transport.vehicles.forEach((v, vi) => {
      const vehicleLabel = transport.vehicles.length > 1
        ? t('sectionEdit.transport.vehicle', { n: vi + 1 })
        : t('sectionEdit.transport.vehicle', { n: 1 });
      if (v.fuelCost) {
        buckets.transport.push(lineItem(
          `rec-transport-fuel-${vi}`,
          `${vehicleLabel} — ${t('sectionEdit.transport.fuel')}`,
          v.fuelCost,
          'monthly',
          {
            editKind: 'transport_vehicle',
            editRef: { vehicleIndex: vi, field: 'fuel' },
            sectionId: 'transport',
            source: { vehicle: v },
          },
        ));
      }
      if (v.hasInsurance && v.insurancePremium) {
        const budgetLine = getVehicleInsuranceBudgetLine(v);
        if (!budgetLine?.amount || budgetLine.amount <= 0) return;
        buckets.transport.push(lineItem(
          `rec-transport-ins-${vi}`,
          `${vehicleLabel} — ${t('sectionEdit.transport.insurance')}`,
          budgetLine.amount,
          budgetLine.frequency,
          {
            editKind: 'transport_vehicle',
            editRef: { vehicleIndex: vi, field: 'insurance' },
            dateType: 'renewal',
            sectionId: 'transport',
            renewalDate: v.insuranceEndDate || v.insuranceStartDate || v.insuranceRenewalDate || null,
            source: { vehicle: v },
          },
        ));
      }
      if (v.hasParking && v.parkingAmount) {
        buckets.transport.push(lineItem(
          `rec-transport-parking-${vi}`,
          `${vehicleLabel} — ${t('sectionEdit.transport.parking')}`,
          v.parkingAmount,
          v.parkingFrequency || 'annual',
          {
            editKind: 'transport_vehicle',
            editRef: { vehicleIndex: vi, field: 'parking' },
            sectionId: 'transport',
            source: { vehicle: v },
          },
        ));
      }
    });
  }
  if (transport.hasPublicTransport && transport.ptAmount) {
    buckets.transport.push(lineItem(
      'rec-transport-pt',
      t('sectionEdit.transport.publicTransport'),
      transport.ptAmount,
      transport.ptFrequency || 'monthly',
      {
        editKind: 'transport_public',
        sectionId: 'transport',
        source: transport,
      },
    ));
  }

  if ((household?.children?.length || 0) > 0 && Object.keys(childrenCosts).length > 0) {
    Object.entries(childrenCosts).forEach(([childKey, child]) => {
      if (!child || typeof child !== 'object') return;
      Object.entries(child).forEach(([fieldKey, field]) => {
        if (!field?.amount) return;
        buckets.children.push(lineItem(
          `rec-child-${childKey}-${fieldKey}`,
          childFieldLabel(fieldKey, field, t),
          field.amount,
          field.frequency || 'monthly',
          {
            editKind: 'child_cost',
            editRef: { childKey, fieldKey },
            sectionId: 'children',
            source: { field },
          },
        ));
      });
    });
  }

  (debts || []).forEach((debt, idx) => {
    const minPayment = parseFloat(debt.minPayment || 0);
    if (!minPayment) return;
    const typeKey = `onboarding.debts.debtDetails.${debt.type || 'other'}`;
    const translated = t(typeKey);
    const label = translated !== typeKey ? translated : t('dashboard.recurring.debtPayment');
    buckets.debts.push(lineItem(
      `rec-debt-${idx}`,
      label,
      minPayment,
      'monthly',
      {
        editKind: 'debt',
        editRef: { index: idx },
        dateType: 'due',
        sectionId: 'debts',
        dueDate: debt.promoEndDate || null,
        source: debt,
      },
    ));
  });

  if (housing.hasOtherCosts && housing.otherCostRows) {
    housing.otherCostRows.forEach((row, idx) => {
      if (!row.amount) return;
      buckets.housing_other.push(lineItem(
        `rec-housing-other-${idx}`,
        row.label || t('sectionEdit.housing.otherCost', { n: idx + 1 }),
        row.amount,
        'monthly',
        {
          editKind: 'housing_other_row',
          editRef: { index: idx },
          supportsFrequency: false,
          sectionId: 'housing',
          dueDate: row.dueDate || null,
          source: { row },
        },
      ));
    });
  }

  if (housing.type === 'family' && housing.contributesToFamily === true && housing.familyContributionRows) {
    housing.familyContributionRows.forEach((row, idx) => {
      const amount = parseFloat(row.amount);
      if (!amount || amount <= 0) return;
      buckets.family_contribution.push(lineItem(
        `rec-family-${idx}`,
        row.description || row.label || t('sectionEdit.housing.familyContribution', { n: idx + 1 }),
        amount,
        'monthly',
        {
          editKind: 'housing_family_row',
          editRef: { index: idx },
          supportsFrequency: false,
          sectionId: 'housing',
          dueDate: row.dueDate || null,
          source: { row },
        },
      ));
    });
  }

  otherCosts.forEach((cost, idx) => {
    if (!cost.amount) return;
    buckets.other.push(lineItem(
      `rec-other-${idx}`,
      otherCostLabel(cost, t),
      parseFloat(cost.amount),
      cost.frequency || 'monthly',
      {
        editKind: 'other_cost',
        editRef: { index: idx },
        dateType: 'due',
        sectionId: 'other',
        dueDate: cost.dueDate || null,
        source: cost,
      },
    ));
  });

  if (housing.govtTaxes?.customItems) {
    housing.govtTaxes.customItems.forEach((item, idx) => {
      if (!item.amount) return;
      buckets.custom_taxes.push(lineItem(
        `rec-custom-tax-${idx}`,
        item.label || t('onboarding.housing.govtTaxes.customPlaceholder'),
        item.amount,
        item.frequency || 'annual',
        {
          editKind: 'housing_govt_custom',
          editRef: { index: idx },
          sectionId: 'housing',
          source: { item },
        },
      ));
    });
  }

  return buckets;
}

function finalizePanels(tabKeys, buckets, t) {
  return tabKeys.map((key) => {
    const lineItems = (buckets[key] || []).filter((row) => row.monthlyAmount > 0);
    const total = lineItems.reduce((sum, row) => sum + row.monthlyAmount, 0);
    return {
      key,
      label: subtabLabel(key, t),
      total,
      lineItems,
      sectionId: SUBTAB_SECTION[key] || resolveCategorySectionId(key),
    };
  });
}

/**
 * @param {import('./householdBudget').RawSections} sections
 * @param {object|null} household
 * @param {(key: string, params?: object) => string} t
 * @returns {ExpensePanel[]}
 */
export function buildFixedExpensePanels(sections, household, t) {
  const buckets = collectFixedLineItems(sections, household, t);
  return finalizePanels(FIXED_EXPENSE_TAB_KEYS, buckets, t);
}

/**
 * @param {import('./householdBudget').RawSections} sections
 * @param {object[]} debts
 * @param {object|null} household
 * @param {(key: string, params?: object) => string} t
 * @returns {ExpensePanel[]}
 */
export function buildRecurringExpensePanels(sections, debts, household, t) {
  const buckets = collectRecurringLineItems(sections, debts, household, t);
  return finalizePanels(RECURRING_EXPENSE_TAB_KEYS, buckets, t);
}

/** Combined fixed + recurring panels for the Overview primary tab. */
export function buildOverviewPanels(fixedPanels, recurringPanels) {
  return [...fixedPanels, ...recurringPanels];
}

/**
 * Find one expense sub-tab panel by primary tab + panel key.
 * @param {import('./householdBudget').RawSections} sections
 * @param {object[]} debts
 * @param {object|null} household
 * @param {(key: string, params?: object) => string} t
 * @param {'fixed'|'recurring'} primaryTab
 * @param {string} subKey
 * @returns {ExpensePanel|null}
 */
export function findExpensePanelByKey(sections, debts, household, t, primaryTab, subKey) {
  const panels = primaryTab === 'fixed'
    ? buildFixedExpensePanels(sections, household, t)
    : buildRecurringExpensePanels(sections, debts, household, t);
  return panels.find((panel) => panel.key === subKey) || null;
}

/**
 * Primary tab (fixed vs recurring) for an expense category key.
 * @param {string} categoryKey
 * @returns {'fixed'|'recurring'}
 */
export function resolveExpensePrimaryTab(categoryKey) {
  return FIXED_EXPENSE_TAB_KEYS.includes(categoryKey) ? 'fixed' : 'recurring';
}

/**
 * Resolve primary + secondary tab for an expense breakdown section row.
 * @param {string} sectionKey
 * @param {ExpensePanel[]} panels
 * @returns {{ primaryTab: 'fixed'|'recurring', secondaryTab: string }|null}
 */
export function resolveExpenseSectionNavigation(sectionKey, panels) {
  const matching = panels.filter((panel) => {
    const key = panel.sectionId || SUBTAB_SECTION[panel.key] || 'other';
    return key === sectionKey && panel.total > 0;
  });
  if (!matching.length) return null;
  matching.sort((a, b) => b.total - a.total);
  const panel = matching[0];
  const primaryTab = FIXED_EXPENSE_TAB_KEYS.includes(panel.key) ? 'fixed' : 'recurring';
  return { primaryTab, secondaryTab: panel.key };
}

/** Section id for a panel key (used to highlight active breakdown row). */
export function expensePanelSectionKey(panel) {
  if (!panel) return null;
  return panel.sectionId || SUBTAB_SECTION[panel.key] || 'other';
}

const EXPENSE_SECTION_ORDER = [
  'housing',
  'transport',
  'health',
  'children',
  'pets',
  'subscriptions',
  'other',
  'debts',
];

const EXPENSE_SECTION_LABEL_KEY = {
  housing: 'onboarding.budget.budgetSplit.cat.housing',
  transport: 'onboarding.budget.budgetSplit.cat.transport',
  health: 'onboarding.budget.budgetSplit.cat.health',
  children: 'onboarding.budget.budgetSplit.cat.children',
  pets: 'onboarding.budget.budgetSplit.cat.pets',
  subscriptions: 'onboarding.budget.budgetSplit.cat.subscriptions',
  other: 'onboarding.budget.budgetSplit.cat.other',
  debts: 'onboarding.budget.budgetSplit.debtPayments',
};

/**
 * Group expense panels into onboarding-style sections (Housing → Rent, Utilities, …).
 * @param {ExpensePanel[]} panels
 * @param {(key: string) => string} t
 */
export function buildExpenseSectionGroups(panels, t) {
  /** @type {Record<string, { key: string, label: string, items: { id: string, label: string, monthlyAmount: number }[], total: number }>} */
  const map = {};

  panels.filter((p) => p.total > 0).forEach((panel) => {
    const sectionKey = panel.sectionId || SUBTAB_SECTION[panel.key] || 'other';
    if (!map[sectionKey]) {
      const labelKey = EXPENSE_SECTION_LABEL_KEY[sectionKey];
      map[sectionKey] = {
        key: sectionKey,
        label: labelKey ? t(labelKey) : sectionKey,
        items: [],
        total: 0,
      };
    }
    panel.lineItems.forEach((item) => {
      if (!item.monthlyAmount || item.monthlyAmount <= 0) return;
      map[sectionKey].items.push({
        id: item.id,
        label: item.subcategory,
        monthlyAmount: item.monthlyAmount,
      });
      map[sectionKey].total += item.monthlyAmount;
    });
  });

  return EXPENSE_SECTION_ORDER
    .filter((key) => map[key]?.items.length > 0)
    .map((key) => ({
      ...map[key],
      items: map[key].items.sort((a, b) => b.monthlyAmount - a.monthlyAmount),
    }))
    .sort((a, b) => b.total - a.total);
}

/** Section-level segments for the overview donut chart (Housing, Health, Debts, …). */
export function buildExpenseChartSections(panels, t) {
  return buildExpenseSectionGroups(panels, t).map((section) => ({
    key: section.key,
    label: section.label,
    value: section.total,
  }));
}

const EXPENSE_ADD_META = {
  rent: { editKind: 'housing_rent', supportsFrequency: false },
  utilities: { editKind: 'housing_utilities', supportsFrequency: false },
  health_insurance: { editKind: 'health_member', editRef: { memberKey: 'user' }, dateType: 'end' },
  waste_tax: {
    editKind: 'housing_govt_tax',
    editRef: { amountField: 'wasteTaxAmount', flagField: 'wasteTax' },
    supportsFrequency: false,
  },
  tv_licence: {
    editKind: 'housing_govt_tax',
    editRef: { amountField: 'tvLicenceAmount', flagField: 'tvLicence' },
    supportsFrequency: false,
  },
  radio_licence: {
    editKind: 'housing_govt_tax',
    editRef: { amountField: 'radioLicenceAmount', flagField: 'radioLicence' },
    supportsFrequency: false,
  },
  subscriptions: { editKind: 'subscription', dateType: 'renewal' },
  internet: { editKind: 'housing_internet' },
  pets: { editKind: 'pet', editRef: { index: 0, field: 'food' } },
  mortgage: { editKind: 'housing_mortgage', supportsFrequency: false },
  transport: { editKind: 'transport_public' },
  children: { editKind: 'child_cost', editRef: { childKey: 'child_0', fieldKey: 'other' } },
  debts: { editKind: 'debt', dateType: 'due' },
  housing_other: { editKind: 'housing_other_row', supportsFrequency: false },
  family_contribution: { editKind: 'housing_family_row', supportsFrequency: false },
  other: { editKind: 'other_cost', dateType: 'due' },
  custom_taxes: { editKind: 'housing_govt_custom' },
};

/**
 * Template row for inline add form on an empty expense sub-tab.
 * @param {string} categoryKey
 * @param {string} categoryLabel
 */
export function getExpenseAddTemplate(categoryKey, categoryLabel) {
  const meta = EXPENSE_ADD_META[categoryKey] || { editKind: 'housing_rent', supportsFrequency: false };
  return {
    id: `add-${categoryKey}`,
    isAdd: true,
    categoryKey,
    subcategory: categoryLabel,
    rawAmount: 0,
    frequency: categoryKey === 'custom_taxes' ? 'annual' : 'monthly',
    renewalDate: null,
    dueDate: null,
    endDate: null,
    sectionId: SUBTAB_SECTION[categoryKey] || 'other',
    ...meta,
  };
}
