import { getData, setData } from './storage';
import { notifyDashboardRefresh } from './dashboardRefresh';
import { parseAmount } from './sectionEditStorage';
import { loadGoals, saveGoals } from './goals/goalStorage';
import { findDebtGoal, finalizeGoalStates } from './goals/goalSync';
import { recalculateDebtGoalFromBalance } from './goals/goalProgress';
import { applyGoalPace } from './goals/goalPace';
import { resolveDebtId } from './goals/goalIds';
import {
  mergePaymentDates,
  mergePrefixedPaymentDates,
  normalizePaymentDates,
} from './expenseDateFields';

async function persist(key, next) {
  await setData(key, next);
  notifyDashboardRefresh();
}

async function patchHousing(mutator) {
  const housing = { ...((await getData('beaverr_housing')) || {}) };
  await persist('beaverr_housing', mutator(housing));
}

async function patchTransport(mutator) {
  const transport = { ...((await getData('beaverr_transport')) || {}) };
  await persist('beaverr_transport', mutator(transport));
}

async function patchHealth(mutator) {
  const health = { ...((await getData('beaverr_health')) || {}) };
  await persist('beaverr_health', mutator(health));
}

function paymentDatesFromFields(fields) {
  return normalizePaymentDates(fields.paymentDates || {});
}

/**
 * @param {number} index
 * @param {{ cost: string, frequency: string, renewalDate?: string|null, autoRenews?: boolean, paymentDates?: object }} fields
 */
export async function patchSubscription(index, { cost, frequency, renewalDate, autoRenews, paymentDates }) {
  const dates = paymentDatesFromFields({ paymentDates });
  const subs = [...((await getData('beaverr_subscriptions')) || [])];
  if (!subs[index]) return;
  subs[index] = mergePaymentDates({
    ...subs[index],
    cost: parseAmount(cost),
    frequency: frequency || 'monthly',
    ...(renewalDate !== undefined ? { renewalDate: renewalDate || dates.endDate || null } : {}),
    ...(autoRenews !== undefined ? { autoRenews } : {}),
  }, dates);
  await persist('beaverr_subscriptions', subs);
}

/**
 * @param {number} index
 * @param {{ minPayment: string, frequency?: string, promoEndDate?: string|null, paymentDates?: object, balance?: string, apr?: string, paymentDueDay?: string }} fields
 * @returns {Promise<'debt_read_only'|void>}
 */
export async function patchDebtMinPayment(index, {
  minPayment,
  frequency,
  promoEndDate,
  balance,
  apr,
  paymentDueDay,
  paymentDates,
}) {
  const dates = paymentDatesFromFields({ paymentDates });
  if (promoEndDate !== undefined && !dates.endDate) {
    dates.endDate = promoEndDate || null;
  }
  if (paymentDueDay !== undefined && paymentDueDay !== '' && dates.chargeDay == null) {
    dates.chargeDay = parseInt(paymentDueDay, 10) || null;
  }
  const debts = [...((await getData('beaverr_debts')) || [])];
  if (!debts[index]) return;
  if (debts[index].readOnly) {
    return 'debt_read_only';
  }

  const debtId = resolveDebtId(debts[index], index);
  const previousBalance = balance !== undefined
    ? Number(debts[index].balance) || 0
    : null;

  debts[index] = mergePaymentDates({
    ...debts[index],
    id: debtId,
    minPayment: parseAmount(minPayment),
    ...(balance !== undefined ? { balance: parseAmount(balance) } : {}),
    ...(apr !== undefined ? { apr: parseFloat(apr) || 0 } : {}),
    ...(frequency ? { frequency } : {}),
    promoEndDate: dates.endDate,
    paymentDueDay: dates.chargeDay,
  }, dates);

  let goals = await loadGoals();
  const linkedGoal = findDebtGoal(goals, debtId);
  if (linkedGoal && linkedGoal.lifecycleStatus === 'active' && balance !== undefined) {
    const newBalance = Number(debts[index].balance) || 0;
    const updated = recalculateDebtGoalFromBalance(
      linkedGoal,
      newBalance,
      previousBalance,
    );
    goals = goals.map((g) => (
      g.id === linkedGoal.id ? applyGoalPace(updated, newBalance) : g
    ));
    const finalized = finalizeGoalStates(goals, debts);
    goals = finalized.goals;
    if (finalized.debts !== debts) {
      await setData('beaverr_debts', finalized.debts);
      await saveGoals(goals);
      notifyDashboardRefresh();
      return;
    }
    await saveGoals(goals);
  }

  await persist('beaverr_debts', debts);
}

/**
 * @param {string} memberKey
 * @param {{ premium: string, frequency: string, endDate?: string|null, paymentDates?: object }} fields
 */
export async function patchHealthMember(memberKey, { premium, frequency, endDate, customFrequencyMonths, paymentDates }) {
  const dates = paymentDatesFromFields({ paymentDates });
  if (endDate !== undefined && !dates.endDate) dates.endDate = endDate || null;
  await patchHealth((health) => ({
    ...health,
    [memberKey]: mergePaymentDates({
      ...(health[memberKey] || {}),
      premium: parseAmount(premium),
      frequency: frequency || 'monthly',
      confirmed: true,
      ...(customFrequencyMonths !== undefined && customFrequencyMonths !== ''
        ? { customFrequencyMonths: parseInt(customFrequencyMonths, 10) || null }
        : {}),
    }, dates),
  }));
}

/**
 * @param {number} index
 * @param {'food'|'vet'} field
 * @param {{ amount: string, frequency: string, paymentDates?: object }} fields
 */
export async function patchPetCost(index, field, { amount, frequency, paymentDates }) {
  const prefix = field === 'vet' ? 'vet' : 'food';
  const dates = paymentDatesFromFields({ paymentDates });
  const pets = [...((await getData('beaverr_pets')) || [])];
  if (!pets[index]) return;
  const pet = { ...pets[index] };
  if (field === 'food') {
    pet.foodAmount = parseAmount(amount);
    pet.foodFrequency = frequency || 'monthly';
  } else {
    pet.vetAmount = parseAmount(amount);
    pet.vetFrequency = frequency || 'monthly';
  }
  pets[index] = mergePrefixedPaymentDates(pet, prefix, dates);
  await persist('beaverr_pets', pets);
}

/**
 * @param {number} index
 * @param {{ amount: string, frequency: string, dueDate?: string|null, paymentDates?: object }} fields
 */
export async function patchOtherCost(index, { amount, frequency, dueDate, paymentDates }) {
  const dates = paymentDatesFromFields({ paymentDates });
  if (dueDate !== undefined && !dates.dueDate) dates.dueDate = dueDate || null;
  const costs = [...((await getData('beaverr_other_costs')) || [])];
  if (!costs[index]) return;
  costs[index] = mergePaymentDates({
    ...costs[index],
    amount: parseAmount(amount),
    frequency: frequency || 'monthly',
  }, dates);
  await persist('beaverr_other_costs', costs);
}

/**
 * @param {string} childKey
 * @param {string} fieldKey
 * @param {{ amount: string, frequency: string, paymentDates?: object }} fields
 */
export async function patchChildCost(childKey, fieldKey, { amount, frequency, paymentDates }) {
  const dates = paymentDatesFromFields({ paymentDates });
  const costs = { ...((await getData('beaverr_children_costs')) || {}) };
  costs[childKey] = {
    ...(costs[childKey] || {}),
    [fieldKey]: mergePaymentDates({
      ...(costs[childKey]?.[fieldKey] || {}),
      amount: parseAmount(amount),
      frequency: frequency || 'monthly',
    }, dates),
  };
  await persist('beaverr_children_costs', costs);
}

/**
 * @param {{ editKind: string, editRef?: object, editIndex?: number }} row
 * @param {{ amount: string, frequency?: string, date?: string|null }} fields
 */
export async function patchExpenseRow(row, fields) {
  const ref = row.editRef || {};
  const extra = fields.extra || {};
  const amount = fields.amount;
  const frequency = fields.frequency;
  const date = fields.date;
  const paymentDates = fields.paymentDates;

  switch (row.editKind) {
    case 'subscription':
      return patchSubscription(ref.index ?? row.editIndex, {
        cost: amount,
        frequency,
        renewalDate: extra.renewalDate ?? date,
        autoRenews: extra.autoRenews,
        paymentDates,
      });
    case 'debt':
      return patchDebtMinPayment(ref.index ?? row.editIndex, {
        minPayment: extra.minPayment ?? amount,
        balance: extra.balance,
        apr: extra.apr,
        paymentDueDay: extra.paymentDueDay,
        frequency,
        promoEndDate: extra.promoEndDate ?? date,
        paymentDates,
      });
    case 'housing_rent':
      return patchHousing((h) => mergePrefixedPaymentDates(
        { ...h, rent: parseAmount(amount) },
        'rent',
        paymentDates,
      ));
    case 'housing_utilities':
      return patchHousing((h) => {
        if (ref.item) {
          const items = [...(h.utilityItems || [])];
          const idx = items.findIndex((item) => item.key === ref.item.key);
          if (idx === -1) return h;
          items[idx] = mergePaymentDates({
            ...items[idx],
            amount: parseAmount(amount),
            frequency: frequency || items[idx].frequency || 'monthly',
          }, paymentDates);
          return { ...h, utilityItems: items };
        }
        return mergePrefixedPaymentDates(
          { ...h, utilities: parseAmount(amount), utilitiesFrequency: frequency || h.utilitiesFrequency || 'monthly' },
          'utilities',
          paymentDates,
        );
      });
    case 'housing_internet':
      return patchHousing((h) => mergePrefixedPaymentDates({
        ...h,
        hasInternet: true,
        internetAmount: parseAmount(amount),
        internetFrequency: frequency || 'monthly',
      }, 'internet', paymentDates));
    case 'housing_mortgage':
      return patchHousing((h) => {
        const dates = paymentDatesFromFields({ paymentDates });
        const endDate = extra.mortgageEndDate ?? dates.endDate ?? null;
        return mergePrefixedPaymentDates({
          ...h,
          hasMortgage: true,
          mortgageAmount: parseAmount(amount),
          mortgageEndDate: endDate,
        }, 'mortgage', { ...dates, endDate });
      });
    case 'housing_govt_tax':
      return patchHousing((h) => {
        const prefixMap = {
          wasteTaxAmount: 'wasteTax',
          tvLicenceAmount: 'tvLicence',
          radioLicenceAmount: 'radioLicence',
        };
        const prefix = prefixMap[ref.amountField] || 'wasteTax';
        const gt = { ...(h.govtTaxes || {}), [ref.amountField]: parseAmount(amount), [ref.flagField]: true };
        return {
          ...h,
          govtTaxes: mergePrefixedPaymentDates(gt, prefix, paymentDates),
        };
      });
    case 'housing_govt_custom':
      return patchHousing((h) => {
        const items = [...(h.govtTaxes?.customItems || [])];
        if (!items[ref.index]) return h;
        items[ref.index] = mergePaymentDates({
          ...items[ref.index],
          label: extra.label ?? items[ref.index].label,
          amount: parseAmount(amount),
          frequency: frequency || 'annual',
        }, paymentDates);
        return { ...h, govtTaxes: { ...(h.govtTaxes || {}), customItems: items } };
      });
    case 'housing_other_row':
      return patchHousing((h) => {
        const rows = [...(h.otherCostRows || [])];
        if (!rows[ref.index]) return h;
        rows[ref.index] = mergePaymentDates({
          ...rows[ref.index],
          amount: parseAmount(amount),
          description: extra.description ?? rows[ref.index].description,
          dueDate: extra.dueDate ?? rows[ref.index].dueDate,
        }, paymentDates);
        return { ...h, hasOtherCosts: true, otherCostRows: rows };
      });
    case 'housing_family_row':
      return patchHousing((h) => {
        const rows = [...(h.familyContributionRows || [])];
        if (!rows[ref.index]) return h;
        rows[ref.index] = mergePaymentDates({
          ...rows[ref.index],
          amount: parseAmount(amount),
          description: extra.description ?? rows[ref.index].description,
          dueDate: extra.dueDate ?? rows[ref.index].dueDate,
        }, paymentDates);
        return { ...h, contributesToFamily: true, familyContributionRows: rows };
      });
    case 'health_member':
      return patchHealthMember(ref.memberKey, {
        premium: amount,
        frequency,
        endDate: extra.endDate ?? date,
        customFrequencyMonths: extra.customFrequencyMonths,
        paymentDates,
      });
    case 'pet':
      return patchPetCost(ref.index, ref.field, { amount, frequency, paymentDates });
    case 'transport_vehicle':
      return patchTransport((t) => {
        const vehicles = [...(t.vehicles || [])];
        if (!vehicles[ref.vehicleIndex]) return t;
        const v = { ...vehicles[ref.vehicleIndex] };
        if (ref.field === 'fuel') {
          vehicles[ref.vehicleIndex] = mergePrefixedPaymentDates({
            ...v,
            fuelCost: parseAmount(amount),
          }, 'fuel', paymentDates);
        } else if (ref.field === 'insurance') {
          const dates = paymentDatesFromFields({ paymentDates });
          vehicles[ref.vehicleIndex] = {
            ...mergePrefixedPaymentDates({
              ...v,
              insurancePremium: parseAmount(amount),
              insuranceFrequency: frequency || 'annual',
              hasInsurance: true,
              insuranceRenewalDate: extra.insuranceRenewalDate ?? date ?? null,
              insuranceEndDate: extra.insuranceEndDate ?? dates.endDate ?? null,
              insuranceDueDate: dates.dueDate,
              insuranceChargeDay: dates.chargeDay,
            }, 'insurance', dates),
          };
        } else if (ref.field === 'parking') {
          vehicles[ref.vehicleIndex] = mergePrefixedPaymentDates({
            ...v,
            parkingAmount: parseAmount(amount),
            parkingFrequency: frequency || 'monthly',
            hasParking: true,
          }, 'parking', paymentDates);
        }
        return { ...t, hasVehicle: true, vehicles };
      });
    case 'transport_public':
      return patchTransport((t) => {
        const dates = paymentDatesFromFields({ paymentDates });
        return {
          ...t,
          hasPublicTransport: true,
          ptAmount: parseAmount(amount),
          ptFrequency: frequency || 'monthly',
          ptValidUntil: extra.ptValidUntil ?? dates.endDate ?? null,
          ptEndDate: dates.endDate,
          ptDueDate: dates.dueDate,
          ptChargeDay: dates.chargeDay,
        };
      });
    case 'child_cost':
      return patchChildCost(ref.childKey, ref.fieldKey, { amount, frequency, paymentDates });
    case 'other_cost':
      return patchOtherCost(ref.index, {
        amount,
        frequency,
        dueDate: extra.dueDate ?? date,
        paymentDates,
      });
    default:
      throw new Error(`Unsupported expense edit kind: ${row.editKind}`);
  }
}

/**
 * Create a new expense line for an empty sub-tab (inline add, same page).
 * @param {string} categoryKey
 * @param {{ amount: string, frequency?: string, date?: string|null }} fields
 */
export async function addExpenseForCategory(categoryKey, fields) {
  const amount = fields.amount;
  const frequency = fields.frequency || 'monthly';
  const date = fields.date;
  const paymentDates = paymentDatesFromFields(fields);

  switch (categoryKey) {
    case 'rent':
      return patchHousing((h) => mergePrefixedPaymentDates({
        ...h,
        type: h.type || 'renting',
        rent: parseAmount(amount),
      }, 'rent', paymentDates));
    case 'utilities':
      return patchHousing((h) => mergePrefixedPaymentDates({
        ...h,
        type: h.type || 'renting',
        utilities: parseAmount(amount),
      }, 'utilities', paymentDates));
    case 'health_insurance':
      return patchHealthMember('user', { premium: amount, frequency, endDate: date, paymentDates });
    case 'waste_tax':
      return patchHousing((h) => ({
        ...h,
        govtTaxes: {
          ...(h.govtTaxes || {}),
          wasteTax: true,
          wasteTaxAmount: parseAmount(amount),
        },
      }));
    case 'tv_licence':
      return patchHousing((h) => ({
        ...h,
        govtTaxes: {
          ...(h.govtTaxes || {}),
          tvLicence: true,
          tvLicenceAmount: parseAmount(amount),
        },
      }));
    case 'radio_licence':
      return patchHousing((h) => ({
        ...h,
        govtTaxes: {
          ...(h.govtTaxes || {}),
          radioLicence: true,
          radioLicenceAmount: parseAmount(amount),
        },
      }));
    case 'subscriptions': {
      const subs = [...((await getData('beaverr_subscriptions')) || [])];
      subs.push(mergePaymentDates({
        name: 'other',
        cost: parseAmount(amount),
        frequency,
        renewalDate: date || paymentDates.endDate || null,
      }, paymentDates));
      return persist('beaverr_subscriptions', subs);
    }
    case 'internet':
      return patchHousing((h) => mergePrefixedPaymentDates({
        ...h,
        hasInternet: true,
        internetAmount: parseAmount(amount),
        internetFrequency: frequency,
      }, 'internet', paymentDates));
    case 'pets': {
      const pets = [...((await getData('beaverr_pets')) || [])];
      if (!pets.length) {
        pets.push(mergePrefixedPaymentDates({
          name: '',
          foodAmount: parseAmount(amount),
          foodFrequency: frequency,
        }, 'food', paymentDates));
      } else {
        pets[0] = mergePrefixedPaymentDates({
          ...pets[0],
          foodAmount: parseAmount(amount),
          foodFrequency: frequency,
        }, 'food', paymentDates);
      }
      return persist('beaverr_pets', pets);
    }
    case 'mortgage':
      return patchHousing((h) => ({
        ...h,
        hasMortgage: true,
        mortgageAmount: parseAmount(amount),
      }));
    case 'transport':
      return patchTransport((t) => ({
        ...t,
        hasPublicTransport: true,
        ptAmount: parseAmount(amount),
        ptFrequency: frequency,
        ptEndDate: paymentDates.endDate,
        ptDueDate: paymentDates.dueDate,
        ptChargeDay: paymentDates.chargeDay,
        ptValidUntil: paymentDates.endDate,
      }));
    case 'children':
      return patchChildCost('child_0', 'other', { amount, frequency, paymentDates });
    case 'debts': {
      const debts = [...((await getData('beaverr_debts')) || [])];
      debts.push({
        type: 'other',
        balance: 0,
        minPayment: parseAmount(amount),
        apr: 0,
        promoEndDate: date || null,
      });
      return persist('beaverr_debts', debts);
    }
    case 'housing_other':
      return patchHousing((h) => {
        const rows = [...(h.otherCostRows || [])];
        rows.push({ amount: parseAmount(amount), label: null, description: null });
        return { ...h, hasOtherCosts: true, otherCostRows: rows };
      });
    case 'family_contribution':
      return patchHousing((h) => {
        const rows = [...(h.familyContributionRows || [])];
        rows.push({ amount: parseAmount(amount), description: null });
        return {
          ...h,
          type: h.type || 'family',
          contributesToFamily: true,
          familyContributionRows: rows,
        };
      });
    case 'other': {
      const costs = [...((await getData('beaverr_other_costs')) || [])];
      costs.push(mergePaymentDates({
        name: 'other',
        amount: parseAmount(amount),
        frequency,
        dueDate: date || paymentDates.dueDate || null,
      }, paymentDates));
      return persist('beaverr_other_costs', costs);
    }
    case 'custom_taxes':
      return patchHousing((h) => {
        const items = [...(h.govtTaxes?.customItems || [])];
        items.push({
          label: null,
          amount: parseAmount(amount),
          frequency: frequency || 'annual',
        });
        return { ...h, govtTaxes: { ...(h.govtTaxes || {}), customItems: items } };
      });
    default:
      throw new Error(`Unsupported expense add category: ${categoryKey}`);
  }
}

const DELETABLE_EXPENSE_KINDS = new Set([
  'subscription',
  'debt',
  'other_cost',
  'housing_other_row',
  'housing_family_row',
  'housing_govt_custom',
]);

/** @param {{ editKind: string }} row */
export function canDeleteExpenseRow(row) {
  return DELETABLE_EXPENSE_KINDS.has(row.editKind);
}

/**
 * Remove a deletable expense line item from storage.
 * @param {{ editKind: string, editRef?: object, editIndex?: number }} row
 */
export async function deleteExpenseRow(row) {
  if (!canDeleteExpenseRow(row)) {
    throw new Error(`Cannot delete expense kind: ${row.editKind}`);
  }

  const ref = row.editRef || {};
  const idx = ref.index ?? row.editIndex;

  switch (row.editKind) {
    case 'subscription': {
      const subs = [...((await getData('beaverr_subscriptions')) || [])];
      subs.splice(idx, 1);
      return persist('beaverr_subscriptions', subs);
    }
    case 'debt': {
      const debts = [...((await getData('beaverr_debts')) || [])];
      debts.splice(idx, 1);
      return persist('beaverr_debts', debts);
    }
    case 'other_cost': {
      const costs = [...((await getData('beaverr_other_costs')) || [])];
      costs.splice(idx, 1);
      return persist('beaverr_other_costs', costs);
    }
    case 'housing_other_row':
      return patchHousing((h) => {
        const rows = [...(h.otherCostRows || [])];
        rows.splice(ref.index, 1);
        return { ...h, hasOtherCosts: rows.length > 0, otherCostRows: rows };
      });
    case 'housing_family_row':
      return patchHousing((h) => {
        const rows = [...(h.familyContributionRows || [])];
        rows.splice(ref.index, 1);
        return {
          ...h,
          contributesToFamily: rows.length > 0,
          familyContributionRows: rows,
        };
      });
    case 'housing_govt_custom':
      return patchHousing((h) => {
        const items = [...(h.govtTaxes?.customItems || [])];
        items.splice(ref.index, 1);
        return { ...h, govtTaxes: { ...(h.govtTaxes || {}), customItems: items } };
      });
    default:
      throw new Error(`Cannot delete expense kind: ${row.editKind}`);
  }
}
