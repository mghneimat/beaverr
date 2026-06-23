import { getData } from './storage';
import { toMonthly, totalMonthlyCosts, availableBudget, parseMoneyAmount } from './finance';
import { childCostDisplayName } from './childrenCostsCatalog';
import { EDIT_SECTION_ROUTES } from './sectionEditPaths';
import { computeTotalMonthlyIncome } from './householdCosts';
import { getHealthMemberLabel, isActiveHealthMemberKey } from './healthMembers';
import { getHealthMemberBudgetLine, getHealthMemberMonthlyAmount, getVehicleInsuranceBudgetLine, getVehicleInsuranceMonthlyAmount } from './healthInsuranceBudget';
import { collectHouseholdRisks } from './householdRisks';
import { splitFlexibleBudget, resolveBudgetSpendingRatio } from './budgetSplit';
import { utilityDisplayName } from './housingUtilities';
import { subscriptionDisplayName } from './subscriptionCatalog';

/**
 * @typedef {Object} CostLineItem
 * @property {string} label
 * @property {number} amount
 * @property {string} frequency
 */

/**
 * @typedef {Object} CostCategory
 * @property {string} category
 * @property {string} label
 * @property {CostLineItem[]} items
 */

/**
 * @typedef {Object} RawSections
 * @property {object} housing
 * @property {object} transport
 * @property {object} health
 * @property {object} childrenCosts
 * @property {object[]} pets
 * @property {object[]} subs
 * @property {object[]} otherCosts
 */

/**
 * @typedef {Object} RecurringCommitment
 * @property {string} id
 * @property {'subscription'|'health_insurance'|'vehicle_insurance'|'debt_payment'} kind
 * @property {string} label
 * @property {number} amount
 * @property {string} frequency
 * @property {number} monthlyAmount
 * @property {number} annualAmount
 * @property {string|null} renewalDate
 * @property {string} editRoute
 * @property {string} category
 */

/**
 * @typedef {Object} HouseholdFinancials
 * @property {object|null} income
 * @property {object[]} debts
 * @property {string} currencyCode
 * @property {CostLineItem[]} allCosts
 * @property {CostCategory[]} byCategory
 * @property {number} totalIncome
 * @property {number} fixedCosts
 * @property {number} debtPayments
 * @property {number} availableBudget
 * @property {object|null} budget
 * @property {number} monthlyFlexible
 * @property {number} [effectiveMonthlyFlexible] - Spending budget after optional savings goal deduction
 * @property {number} [savingsGoalDeduction] - Amount reserved for savings goal when deduction enabled
 * @property {boolean} [deductSavingsGoal] - User preference to reserve goal savings from spending
 * @property {number} [budgetSpendingRatio] - Share of available flexible budget kept for spending (0–1)
 * @property {number} [budgetSavingsShift] - Monthly amount shifted from spending to voluntary savings
 * @property {'daily'|'weekly'|'monthly'} budgetDisplayFrequency
 * @property {RawSections} sections
 * @property {RecurringCommitment[]} recurringCommitments
 * @property {import('./householdRisks').FinancialRisk[]} financialRisks
 */

/**
 * Aggregate fixed costs from per-section storage payloads.
 * @param {Object} sections
 * @param {(key: string) => string} t
 * @returns {{ allCosts: CostLineItem[], byCategory: CostCategory[] }}
 */
export function aggregateHouseholdCosts(sections, t) {
  const {
    housing = {},
    transport = {},
    health = {},
    childrenCosts = {},
    pets = [],
    subs = [],
    otherCosts = [],
    household = null,
  } = sections;

  const allCosts = [];
  const byCategory = [];

  const housingItems = [];
  if (housing.type === 'renting') {
    if (housing.rent) housingItems.push({ label: 'Rent', amount: housing.rent, frequency: 'monthly' });
    if (housing.utilitiesMode === 'itemized' && housing.utilityItems?.length) {
      housing.utilityItems.forEach((item) => {
        if (!item.amount) return;
        housingItems.push({
          label: utilityDisplayName(item, t),
          amount: item.amount,
          frequency: item.frequency || 'monthly',
        });
      });
    } else if (housing.utilities) {
      housingItems.push({
        label: 'Utilities',
        amount: housing.utilities,
        frequency: housing.utilitiesFrequency || 'monthly',
      });
    }
  }
  if (housing.internetAmount) {
    housingItems.push({ label: 'Internet', amount: housing.internetAmount, frequency: housing.internetFrequency || 'monthly' });
  }
  if (housing.mortgageAmount) housingItems.push({ label: 'Mortgage', amount: housing.mortgageAmount, frequency: 'monthly' });
  if (housing.hasOtherCosts && housing.otherCostRows) {
    housing.otherCostRows.forEach((r, idx) => {
      if (r.amount) housingItems.push({ label: r.label || `Other cost ${idx + 1}`, amount: r.amount, frequency: 'monthly' });
    });
  }
  if (housing.type === 'family' && housing.contributesToFamily === true && housing.familyContributionRows) {
    housing.familyContributionRows.forEach((r, idx) => {
      const amount = parseFloat(r.amount);
      if (!amount || amount <= 0) return;
      housingItems.push({
        label: r.description || r.label || t('onboarding.budget.familyContribution', { n: idx + 1 }),
        amount,
        frequency: 'monthly',
      });
    });
  }
  if (housing.govtTaxes) {
    const gt = housing.govtTaxes;
    if (gt.wasteTax && gt.wasteTaxAmount) housingItems.push({ label: 'Waste tax', amount: gt.wasteTaxAmount, frequency: 'annual' });
    if (gt.tvLicence && gt.tvLicenceAmount) housingItems.push({ label: 'TV licence', amount: gt.tvLicenceAmount, frequency: 'annual' });
    if (gt.radioLicence && gt.radioLicenceAmount) housingItems.push({ label: 'Radio licence', amount: gt.radioLicenceAmount, frequency: 'annual' });
    if (gt.customItems) {
      gt.customItems.forEach((item, idx) => {
        if (item.amount) housingItems.push({ label: item.label || `Tax ${idx + 1}`, amount: item.amount, frequency: item.frequency || 'annual' });
      });
    }
  }
  if (housingItems.length > 0) {
    byCategory.push({ category: 'housing', label: t('onboarding.budget.budgetSplit.cat.housing'), items: housingItems });
    allCosts.push(...housingItems);
  }

  const transportItems = [];
  if (transport.hasVehicle && transport.vehicles) {
    transport.vehicles.forEach((v, vi) => {
      const prefix = transport.vehicles.length > 1 ? `Vehicle ${vi + 1} ` : '';
      if (v.fuelCost) transportItems.push({ label: `${prefix}Fuel`, amount: v.fuelCost, frequency: 'monthly' });
      if (v.hasInsurance && v.insurancePremium) {
        const budgetLine = getVehicleInsuranceBudgetLine(v);
        if (budgetLine?.amount > 0) {
          transportItems.push({
            label: `${prefix}Insurance`,
            amount: budgetLine.amount,
            frequency: budgetLine.frequency,
          });
        }
      }
      if (v.hasParking && v.parkingAmount) {
        transportItems.push({ label: `${prefix}Parking`, amount: v.parkingAmount, frequency: v.parkingFrequency || 'annual' });
      }
    });
  }
  if (transport.hasPublicTransport && transport.ptAmount) {
    transportItems.push({ label: 'Public transport', amount: transport.ptAmount, frequency: transport.ptFrequency || 'monthly' });
  }
  if (transportItems.length > 0) {
    byCategory.push({ category: 'transport', label: t('onboarding.budget.budgetSplit.cat.transport'), items: transportItems });
    allCosts.push(...transportItems);
  }

  const healthItems = [];
  if (health) {
    Object.entries(health).forEach(([key, member]) => {
      if (!isActiveHealthMemberKey(key, household)) return;
      if (!member?.confirmed || member.coverage === 'employer' || !member.premium) return;
      const budgetLine = getHealthMemberBudgetLine(member);
      if (!budgetLine?.amount || budgetLine.amount <= 0) return;
      healthItems.push({
        label: getHealthMemberLabel(key, household, t),
        amount: budgetLine.amount,
        frequency: budgetLine.frequency,
      });
    });
  }
  if (healthItems.length > 0) {
    byCategory.push({ category: 'health', label: t('onboarding.budget.budgetSplit.cat.health'), items: healthItems });
    allCosts.push(...healthItems);
  }

  const childrenItems = [];
  if ((household?.children?.length || 0) > 0 && Object.keys(childrenCosts).length > 0) {
    Object.entries(childrenCosts).forEach(([, child]) => {
      if (child && typeof child === 'object') {
        Object.entries(child).forEach(([fieldKey, field]) => {
          const parsed = parseMoneyAmount(field?.amount);
          if (!parsed || parsed <= 0) return;
          childrenItems.push({
            label: childCostDisplayName(fieldKey, field?.customLabel, t),
            amount: parsed,
            frequency: field.frequency || 'monthly',
          });
        });
      }
    });
  }
  if (childrenItems.length > 0) {
    byCategory.push({ category: 'children', label: t('onboarding.budget.budgetSplit.cat.children'), items: childrenItems });
    allCosts.push(...childrenItems);
  }

  const petItems = [];
  pets.forEach((pet, pi) => {
    const prefix = pet.name ? `${pet.name} ` : `Pet ${pi + 1} `;
    if (pet.foodAmount) petItems.push({ label: `${prefix}Food`, amount: pet.foodAmount, frequency: pet.foodFrequency || 'monthly' });
    if (pet.vetAmount) petItems.push({ label: `${prefix}Vet`, amount: pet.vetAmount, frequency: pet.vetFrequency || 'monthly' });
  });
  if (petItems.length > 0) {
    byCategory.push({ category: 'pets', label: t('onboarding.budget.budgetSplit.cat.pets'), items: petItems });
    allCosts.push(...petItems);
  }

  const subItems = [];
  subs.forEach((sub) => {
    if (sub.cost) {
      const subLabel = subscriptionDisplayName(sub, t);
      subItems.push({ label: subLabel, amount: parseFloat(sub.cost), frequency: sub.frequency || 'monthly' });
    }
  });
  if (subItems.length > 0) {
    byCategory.push({ category: 'subscriptions', label: t('onboarding.budget.budgetSplit.cat.subscriptions'), items: subItems });
    allCosts.push(...subItems);
  }

  const otherItems = [];
  const safeOtherCosts = Array.isArray(otherCosts) ? otherCosts : [];
  safeOtherCosts.forEach((c) => {
    if (c.amount) {
      const transKey = `onboarding.otherCosts.costSelection.costs.${c.name}`;
      const translated = t(transKey);
      const costLabel = translated !== transKey ? translated : (c.name || 'Other cost');
      otherItems.push({ label: costLabel, amount: parseFloat(c.amount), frequency: c.frequency || 'monthly' });
    }
  });
  if (otherItems.length > 0) {
    byCategory.push({ category: 'other', label: t('onboarding.budget.budgetSplit.cat.other'), items: otherItems });
    allCosts.push(...otherItems);
  }

  return { allCosts, byCategory };
}

/**
 * Flatten subscriptions, insurance premiums, and debt minimums with metadata.
 * @param {RawSections} sections
 * @param {object[]} debts
 * @param {(key: string) => string} t
 * @returns {RecurringCommitment[]}
 */
export function loadRecurringCommitments(sections, debts, t) {
  const {
    transport = {},
    health = {},
    subs = [],
    household = null,
  } = sections;

  const items = [];

  subs.forEach((sub, idx) => {
    if (!sub.cost) return;
    const label = subscriptionDisplayName(sub, t);
    const monthlyAmount = toMonthly(parseFloat(sub.cost), sub.frequency || 'monthly');
    items.push({
      id: `sub-${idx}`,
      kind: 'subscription',
      label,
      amount: parseFloat(sub.cost),
      frequency: sub.frequency || 'monthly',
      monthlyAmount,
      annualAmount: monthlyAmount * 12,
      renewalDate: sub.renewalDate || null,
      editRoute: EDIT_SECTION_ROUTES.subscriptions,
      category: 'subscriptions',
    });
  });

  if (health) {
    Object.entries(health).forEach(([key, member]) => {
      if (!isActiveHealthMemberKey(key, household)) return;
      if (!member?.confirmed || member.coverage === 'employer' || !member.premium) return;
      const name = getHealthMemberLabel(key, household, t);
      const budgetLine = getHealthMemberBudgetLine(member);
      if (!budgetLine) return;
      const monthlyAmount = getHealthMemberMonthlyAmount(member);
      if (!monthlyAmount || monthlyAmount <= 0) return;
      items.push({
        id: `health-${key}`,
        kind: 'health_insurance',
        label: name,
        amount: budgetLine.amount,
        frequency: budgetLine.frequency,
        monthlyAmount,
        annualAmount: monthlyAmount * 12,
        renewalDate: member.endDate || null,
        editRoute: EDIT_SECTION_ROUTES.health,
        category: 'health',
      });
    });
  }

  if (transport.hasVehicle && transport.vehicles) {
    transport.vehicles.forEach((v, vi) => {
      if (!v.hasInsurance || !v.insurancePremium) return;
      const budgetLine = getVehicleInsuranceBudgetLine(v);
      if (!budgetLine) return;
      const monthlyAmount = getVehicleInsuranceMonthlyAmount(v);
      if (!monthlyAmount || monthlyAmount <= 0) return;
      const prefix = transport.vehicles.length > 1
        ? t('dashboard.recurring.vehicleInsuranceN', { n: vi + 1 })
        : t('dashboard.recurring.vehicleInsurance');
      items.push({
        id: `vehicle-ins-${vi}`,
        kind: 'vehicle_insurance',
        label: prefix,
        amount: budgetLine.amount,
        frequency: budgetLine.frequency,
        monthlyAmount,
        annualAmount: monthlyAmount * 12,
        renewalDate: v.insuranceEndDate || v.insuranceStartDate || v.insuranceRenewalDate || null,
        editRoute: EDIT_SECTION_ROUTES.transport,
        category: 'transport',
      });
    });
  }

  (debts || []).forEach((debt, idx) => {
    const minPayment = parseFloat(debt.minPayment || 0);
    if (!minPayment) return;
    const typeKey = `onboarding.debts.debtDetails.${debt.type || 'other'}`;
    const translated = t(typeKey);
    const label = translated !== typeKey ? translated : t('dashboard.recurring.debtPayment');
    items.push({
      id: `debt-${idx}`,
      kind: 'debt_payment',
      label,
      amount: minPayment,
      frequency: 'monthly',
      monthlyAmount: minPayment,
      annualAmount: minPayment * 12,
      renewalDate: debt.promoEndDate || null,
      editRoute: EDIT_SECTION_ROUTES.debts,
      category: 'debts',
    });
  });

  return items.sort((a, b) => b.monthlyAmount - a.monthlyAmount);
}

/**
 * Load household financial summary from local storage.
 * @param {(key: string) => string} t
 * @returns {Promise<HouseholdFinancials>}
 */
export async function loadHouseholdFinancials(t) {
  const [
    inc,
    debts,
    loc,
    household,
    housing,
    transport,
    health,
    childrenCosts,
    pets,
    subs,
    otherCosts,
    budget,
  ] = await Promise.all([
    getData('beaverr_income'),
    getData('beaverr_debts'),
    getData('beaverr_location'),
    getData('beaverr_household'),
    getData('beaverr_housing'),
    getData('beaverr_transport'),
    getData('beaverr_health'),
    getData('beaverr_children_costs'),
    getData('beaverr_pets'),
    getData('beaverr_subscriptions'),
    getData('beaverr_other_costs'),
    getData('beaverr_budget'),
  ]);

  const { allCosts, byCategory } = aggregateHouseholdCosts({
    housing: housing || {},
    transport: transport || {},
    health: health || {},
    childrenCosts: childrenCosts || {},
    pets: pets || [],
    subs: subs || [],
    otherCosts: otherCosts || [],
    household: household || null,
  }, t);

  const totalIncome = computeTotalMonthlyIncome(inc);
  const fixedCosts = totalMonthlyCosts(allCosts);
  const debtPayments = (debts || []).reduce((sum, debt) => sum + parseFloat(debt.minPayment || 0), 0);
  const avail = availableBudget(totalIncome, fixedCosts, debtPayments);

  const budgetSpendingRatio = resolveBudgetSpendingRatio(budget, avail);
  const { spendingMonthly, savingsShift } = splitFlexibleBudget(avail, budgetSpendingRatio);
  const monthlyFlexible = spendingMonthly;

  const sections = {
    housing: housing || {},
    transport: transport || {},
    health: health || {},
    childrenCosts: childrenCosts || {},
    pets: pets || [],
    subs: subs || [],
    otherCosts: otherCosts || [],
    household: household || null,
    location: loc || {},
  };

  const recurringCommitments = loadRecurringCommitments(sections, debts || [], t);
  const financialRisks = collectHouseholdRisks(sections, t);

  return {
    income: inc,
    debts: debts || [],
    currencyCode: loc?.currency || 'CZK',
    allCosts,
    byCategory,
    totalIncome,
    fixedCosts,
    debtPayments,
    availableBudget: avail,
    budget,
    monthlyFlexible,
    budgetSpendingRatio,
    budgetSavingsShift: budget?.budgetSavingsShift != null
      ? Number(budget.budgetSavingsShift)
      : savingsShift,
    budgetDisplayFrequency: budget?.budgetDisplayFrequency || 'daily',
    sections,
    recurringCommitments,
    financialRisks,
  };
}

export {
  EDIT_SECTION_ROUTES,
  resolveCategorySectionId,
} from './sectionEditPaths';

export {
  STREAMING_SERVICES,
  computeTotalMonthlyIncome,
  categoryMonthlyTotal,
  topCostCategories,
} from './householdCosts';
