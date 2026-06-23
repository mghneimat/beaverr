/**
 * Onboarding-aligned field config per expense editKind.
 * Keys reference lib/locales onboarding.* paths.
 */
import { childCostSourceLabelKey, normalizeChildCostSourceKey } from './childrenCostsCatalog';
import {
  appendOptionalPaymentDateFields,
  normalizePaymentDates,
  resolveRowPaymentDates,
} from './expenseDateFields';

/** @typedef {'amount'|'frequency'|'date'|'toggle'|'text'|'number'|'hint'} ExpenseFieldType */

/**
 * @param {string} editKind
 * @param {object|null} editRef
 * @returns {object[]}
 */
export function getExpenseEditFields(editKind, editRef = null) {
  let fields;
  switch (editKind) {
    case 'subscription':
      fields = [
        { type: 'amount', labelKey: 'onboarding.subscriptions.serviceSelection.amountLabel', placeholderKey: 'onboarding.subscriptions.serviceSelection.amountPlaceholder', inGroup: true },
        { type: 'frequency', options: ['monthly', 'quarterly', 'annual'] },
        { type: 'toggle', key: 'autoRenews', labelKey: 'onboarding.subscriptions.serviceSelection.autoRenewLabel' },
        { type: 'number', key: 'chargeDay', labelKey: 'onboarding.subscriptions.serviceSelection.chargeDayLabel', placeholderKey: 'onboarding.subscriptions.serviceSelection.chargeDayPlaceholder', optional: true },
        { type: 'date', key: 'endDate', labelKey: 'onboarding.subscriptions.serviceSelection.endDateOptionalLabel', showDay: true, optional: true },
      ];
      break;
    case 'debt':
      fields = [
        { type: 'amount', key: 'balance', labelKey: 'onboarding.debts.debtDetails.balanceLabel', placeholderKey: 'onboarding.debts.debtDetails.balancePlaceholder', inGroup: true },
        { type: 'amount', key: 'minPayment', labelKey: 'onboarding.debts.debtDetails.minPaymentLabel', placeholderKey: 'onboarding.debts.debtDetails.minPaymentPlaceholder', inGroup: true },
        { type: 'text', key: 'apr', labelKey: 'onboarding.debts.debtDetails.aprLabel', placeholderKey: 'onboarding.debts.debtDetails.aprPlaceholder', numeric: true },
        { type: 'date', key: 'promoEndDate', labelKey: 'onboarding.debts.debtDetails.promoEndLabel', showDay: false, optional: true },
        { type: 'number', key: 'paymentDueDay', labelKey: 'onboarding.debts.debtDetails.dueDayLabel', placeholderKey: 'onboarding.debts.debtDetails.dueDayPlaceholder', optional: true },
      ];
      break;
    case 'health_member':
      fields = [
        { type: 'amount', labelKey: 'onboarding.health.premiumLabel', placeholderKey: 'onboarding.health.premiumPlaceholder', inGroup: true },
        { type: 'frequency', options: ['monthly', 'quarterly', 'annual', 'custom'] },
        { type: 'number', key: 'customFrequencyMonths', labelKey: 'onboarding.health.customFrequencyLabel', showWhen: { field: 'frequency', value: 'custom' } },
        { type: 'date', key: 'endDate', labelKey: 'onboarding.health.endDateLabel', showDay: true, optional: true },
      ];
      break;
    case 'housing_rent':
      fields = [
        { type: 'amount', labelKey: 'onboarding.housing.rentDetails.amountLabel', inGroup: true },
      ];
      break;
    case 'housing_utilities':
      fields = [
        { type: 'amount', labelKey: 'onboarding.housing.rentUtilities.amountLabel', inGroup: true },
      ];
      break;
    case 'housing_internet':
      fields = [
        { type: 'amount', labelKey: 'onboarding.housing.housingUtilities.amountLabel', inGroup: true },
        { type: 'frequency', options: ['monthly', 'annual'] },
      ];
      break;
    case 'housing_mortgage':
      fields = [
        { type: 'amount', labelKey: 'onboarding.housing.mortgageDetails.amountLabel', inGroup: true },
        { type: 'date', key: 'mortgageEndDate', labelKey: 'onboarding.housing.mortgageDetails.endDateLabel', showDay: true, optional: true },
      ];
      break;
    case 'housing_govt_tax':
      fields = [
        { type: 'amount', labelKey: 'onboarding.housing.govtTaxes.customAmountLabel', inGroup: true, annualNote: true },
      ];
      break;
    case 'housing_govt_custom':
      fields = [
        { type: 'text', key: 'label', labelKey: 'onboarding.housing.govtTaxes.customPlaceholder', inGroup: true },
        { type: 'amount', labelKey: 'onboarding.housing.govtTaxes.customAmountLabel', inGroup: true },
        { type: 'frequency', options: ['monthly', 'annual'] },
      ];
      break;
    case 'housing_other_row':
      fields = [
        { type: 'text', key: 'description', labelKey: 'onboarding.housing.ownershipCosts.descriptionPlaceholder', inGroup: true },
        { type: 'amount', labelKey: 'onboarding.housing.ownershipCosts.amountLabel', inGroup: true },
        { type: 'date', key: 'dueDate', labelKey: 'onboarding.housing.ownershipCosts.dueDateLabel', showDay: true, optional: true },
      ];
      break;
    case 'housing_family_row':
      fields = [
        { type: 'text', key: 'description', labelKey: 'onboarding.housing.familyHousing.descriptionLabel', inGroup: true },
        { type: 'amount', labelKey: 'onboarding.housing.familyHousing.amountLabel', inGroup: true },
        { type: 'date', key: 'dueDate', labelKey: 'onboarding.housing.familyHousing.dueDateLabel', showDay: true, optional: true },
      ];
      break;
    case 'pet': {
      const field = editRef?.field || 'food';
      const labelKey = field === 'vet'
        ? 'onboarding.pets.petDetails.vetLabel'
        : 'onboarding.pets.petDetails.foodLabel';
      fields = [
        { type: 'amount', labelKey, inGroup: true },
        { type: 'frequency', options: ['monthly', 'quarterly', 'annual'] },
      ];
      break;
    }
    case 'transport_vehicle': {
      const field = editRef?.field || 'fuel';
      if (field === 'fuel') {
        fields = [
          { type: 'amount', labelKey: 'onboarding.transport.vehicleFuel.costLabel', inGroup: true },
        ];
      } else if (field === 'insurance') {
        fields = [
          { type: 'amount', labelKey: 'onboarding.transport.vehicleInsurance.premiumLabel', inGroup: true },
          { type: 'frequency', options: ['monthly', 'annual'] },
          { type: 'date', key: 'insuranceStartDate', labelKey: 'onboarding.health.startDateLabel', showDay: true, optional: true },
          { type: 'date', key: 'insuranceEndDate', labelKey: 'onboarding.health.endDateLabel', showDay: true, optional: true },
        ];
      } else {
        fields = [
          { type: 'amount', labelKey: 'onboarding.transport.vehicleMaintenance.amountLabel', inGroup: true },
          { type: 'frequency', options: ['monthly', 'annual'] },
        ];
      }
      break;
    }
    case 'transport_public':
      fields = [
        { type: 'amount', labelKey: 'onboarding.transport.publicTransport.amountLabel', inGroup: true },
        { type: 'frequency', options: ['daily', 'weekly', 'monthly', 'annual'] },
        { type: 'date', key: 'ptValidUntil', labelKey: 'onboarding.transport.publicTransport.validUntilLabel', showDay: false, optional: true },
      ];
      break;
    case 'child_cost': {
      const fieldKey = normalizeChildCostSourceKey(editRef?.fieldKey || 'other');
      fields = [
        { type: 'amount', labelKey: childCostSourceLabelKey(fieldKey), placeholderKey: 'onboarding.childrenCosts.childrenCosts.amountPlaceholder', inGroup: true },
        { type: 'frequency', options: ['monthly', 'quarterly', 'annual'] },
      ];
      break;
    }
    case 'other_cost':
      fields = [
        { type: 'amount', labelKey: 'onboarding.otherCosts.costSelection.amountLabel', placeholderKey: 'onboarding.otherCosts.costSelection.amountPlaceholder', inGroup: true },
        { type: 'frequency', options: ['monthly', 'quarterly', 'annual'] },
        { type: 'date', key: 'dueDate', labelKey: 'onboarding.otherCosts.costSelection.dueDateLabel', showDay: true, optional: true },
      ];
      break;
    default:
      fields = [
        { type: 'amount', labelKey: 'dashboard.expensesScreen.edit.amount', inGroup: true },
        { type: 'frequency', options: ['monthly', 'quarterly', 'annual'] },
      ];
  }

  return appendOptionalPaymentDateFields(fields);
}

/**
 * Build initial form values from a dashboard expense row + stored source.
 * @param {object} row
 */
export function buildExpenseFormState(row) {
  const source = row.source || {};
  const amountKey = row.editKind === 'debt' ? 'minPayment' : 'amount';
  const baseAmount = row.editKind === 'subscription'
    ? source.cost
    : row.editKind === 'debt'
      ? source.minPayment
      : row.editKind === 'health_member'
        ? source.premium ?? source.member?.premium
        : row.rawAmount;

  const paymentDates = resolveRowPaymentDates(row);

  const state = {
    amount: baseAmount != null ? String(baseAmount) : '',
    frequency: row.frequency || source.frequency || 'monthly',
    renewalDate: row.renewalDate || source.renewalDate || '',
    dueDate: paymentDates.dueDate || row.dueDate || source.dueDate || '',
    endDate: paymentDates.endDate || row.endDate || source.endDate || source.member?.endDate || '',
    chargeDay: paymentDates.chargeDay != null ? String(paymentDates.chargeDay) : '',
    autoRenews: source.autoRenews !== false,
    balance: source.balance != null ? String(source.balance) : '',
    minPayment: source.minPayment != null ? String(source.minPayment) : String(row.rawAmount || ''),
    apr: source.apr != null ? String(source.apr) : '',
    promoEndDate: source.promoEndDate || row.dueDate || '',
    paymentDueDay: source.paymentDueDay != null ? String(source.paymentDueDay) : '',
    customFrequencyMonths: source.customFrequencyMonths != null ? String(source.customFrequencyMonths) : '',
    mortgageEndDate: source.mortgageEndDate || paymentDates.endDate || '',
    insuranceStartDate: source.insuranceStartDate || source.insuranceRenewalDate || row.renewalDate || '',
    insuranceEndDate: source.insuranceEndDate || '',
    insuranceRenewalDate: source.insuranceRenewalDate || row.renewalDate || '',
    ptValidUntil: source.ptValidUntil || source.ptEndDate || '',
    description: source.description || source.row?.description || source.row?.label || '',
    label: source.label || source.item?.label || '',
  };

  if (row.editKind === 'housing_rent' && source.rent != null) {
    state.amount = String(source.rent);
  }
  if (row.editKind === 'housing_utilities' && source.utilities != null) {
    state.amount = String(source.utilities);
  }
  if (row.editKind === 'housing_internet') {
    if (source.internetAmount != null) state.amount = String(source.internetAmount);
    state.frequency = source.internetFrequency || state.frequency;
  }
  if (row.editKind === 'housing_mortgage') {
    if (source.mortgageAmount != null) state.amount = String(source.mortgageAmount);
    state.mortgageEndDate = source.mortgageEndDate || state.endDate || '';
    state.endDate = state.mortgageEndDate;
  }

  if (row.editKind === 'housing_other_row' || row.editKind === 'housing_family_row') {
    const rowData = source.row || source;
    state.amount = rowData.amount != null ? String(rowData.amount) : state.amount;
    state.dueDate = rowData.dueDate || state.dueDate;
    state.endDate = rowData.endDate || state.endDate;
    state.chargeDay = rowData.chargeDay != null ? String(rowData.chargeDay) : state.chargeDay;
    state.description = rowData.description || rowData.label || state.description;
  }

  if (row.editKind === 'housing_govt_custom') {
    state.amount = source.item?.amount != null ? String(source.item.amount) : state.amount;
    state.label = source.item?.label || state.label;
    state.frequency = source.item?.frequency || state.frequency;
    state.endDate = source.item?.endDate || state.endDate;
    state.dueDate = source.item?.dueDate || state.dueDate;
    state.chargeDay = source.item?.chargeDay != null ? String(source.item.chargeDay) : state.chargeDay;
  }

  if (row.editKind === 'pet') {
    const field = row.editRef?.field;
    if (field === 'food') {
      state.amount = source.pet?.foodAmount != null ? String(source.pet.foodAmount) : state.amount;
      state.frequency = source.pet?.foodFrequency || state.frequency;
    } else if (field === 'vet') {
      state.amount = source.pet?.vetAmount != null ? String(source.pet.vetAmount) : state.amount;
      state.frequency = source.pet?.vetFrequency || state.frequency;
    }
  }

  if (row.editKind === 'transport_vehicle') {
    const v = source.vehicle || {};
    const field = row.editRef?.field;
    if (field === 'fuel') state.amount = v.fuelCost != null ? String(v.fuelCost) : state.amount;
    if (field === 'insurance') {
      state.amount = v.insurancePremium != null ? String(v.insurancePremium) : state.amount;
      state.frequency = v.insuranceFrequency || state.frequency;
      state.insuranceStartDate = v.insuranceStartDate || v.insuranceRenewalDate || '';
      state.insuranceEndDate = v.insuranceEndDate || '';
      state.insuranceRenewalDate = v.insuranceRenewalDate || '';
      state.endDate = v.insuranceEndDate || state.endDate;
      state.dueDate = v.insuranceDueDate || state.dueDate;
      state.chargeDay = v.insuranceChargeDay != null ? String(v.insuranceChargeDay) : state.chargeDay;
    }
    if (field === 'parking') {
      state.amount = v.parkingAmount != null ? String(v.parkingAmount) : state.amount;
      state.frequency = v.parkingFrequency || state.frequency;
    }
  }

  if (row.editKind === 'child_cost') {
    state.amount = source.field?.amount != null ? String(source.field.amount) : state.amount;
    state.frequency = source.field?.frequency || state.frequency;
    state.endDate = source.field?.endDate || state.endDate;
    state.dueDate = source.field?.dueDate || state.dueDate;
    state.chargeDay = source.field?.chargeDay != null ? String(source.field.chargeDay) : state.chargeDay;
  }

  if (row.editKind === 'health_member') {
    const member = source.member || source;
    if (member.premium != null) state.amount = String(member.premium);
    state.frequency = member.frequency || state.frequency;
    state.endDate = member.endDate || state.endDate;
    state.dueDate = member.dueDate || state.dueDate;
    state.chargeDay = member.chargeDay != null ? String(member.chargeDay) : state.chargeDay;
    state.customFrequencyMonths = member.customFrequencyMonths != null
      ? String(member.customFrequencyMonths)
      : state.customFrequencyMonths;
  }

  if (row.editKind === 'transport_public') {
    if (source.ptAmount != null) state.amount = String(source.ptAmount);
    state.frequency = source.ptFrequency || state.frequency;
    state.ptValidUntil = source.ptValidUntil || '';
    state.endDate = source.ptEndDate || source.ptValidUntil || state.endDate;
    state.dueDate = source.ptDueDate || state.dueDate;
    state.chargeDay = source.ptChargeDay != null ? String(source.ptChargeDay) : state.chargeDay;
  }

  if (row.editKind === 'subscription') {
    state.chargeDay = source.chargeDay != null ? String(source.chargeDay) : state.chargeDay;
    state.endDate = source.endDate || source.renewalDate || state.endDate;
    state.dueDate = source.dueDate || state.dueDate;
  }

  if (row.editKind === 'debt') {
    state.endDate = source.promoEndDate || state.endDate;
    state.dueDate = source.dueDate || state.dueDate;
    state.chargeDay = source.paymentDueDay != null ? String(source.paymentDueDay) : state.chargeDay;
  }

  if (row.editKind === 'other_cost') {
    state.endDate = source.endDate || state.endDate;
    state.dueDate = source.dueDate || state.dueDate;
    state.chargeDay = source.chargeDay != null ? String(source.chargeDay) : state.chargeDay;
  }

  return state;
}

/**
 * Extract normalized payment dates from form for persistence.
 * @param {object} form
 */
export function paymentDatesFromForm(form) {
  const endDate = form.endDate || form.mortgageEndDate || form.promoEndDate
    || form.insuranceEndDate || form.ptValidUntil || '';
  return normalizePaymentDates({
    endDate: endDate || null,
    dueDate: form.dueDate || null,
    chargeDay: form.chargeDay || form.paymentDueDay || null,
  });
}

/**
 * Map form state to patchExpenseRow / addExpenseForCategory fields.
 * @param {object} row
 * @param {object} form
 */
export function formStateToPatchFields(row, form) {
  const primaryAmount = row.editKind === 'debt' ? form.minPayment : form.amount;
  const dates = paymentDatesFromForm(form);
  const legacyDate = dates.endDate || dates.dueDate || form.renewalDate
    || form.promoEndDate || form.insuranceEndDate || form.insuranceStartDate
    || form.insuranceRenewalDate || form.ptValidUntil || form.mortgageEndDate || '';

  return {
    amount: primaryAmount,
    frequency: form.frequency,
    date: legacyDate,
    paymentDates: dates,
    extra: form,
  };
}
