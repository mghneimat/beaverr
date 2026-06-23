/**
 * Optional payment date fields shared across expenses (onboarding, dashboard edit, tables).
 * - endDate: commitment / contract end
 * - dueDate: explicit next payment date
 * - chargeDay: day of month (1–31) for recurring next-payment computation
 */

/** @typedef {{ endDate?: string|null, dueDate?: string|null, chargeDay?: number|string|null }} PaymentDates */

/**
 * @param {string|number|null|undefined} value
 * @returns {number|null}
 */
export function parseChargeDay(value) {
  if (value == null || value === '') return null;
  const day = parseInt(String(value), 10);
  if (Number.isNaN(day) || day < 1 || day > 31) return null;
  return day;
}

/**
 * @param {PaymentDates|null|undefined} dates
 * @returns {PaymentDates}
 */
export function normalizePaymentDates(dates = {}) {
  return {
    endDate: dates.endDate?.trim?.() ? dates.endDate.trim() : dates.endDate || null,
    dueDate: dates.dueDate?.trim?.() ? dates.dueDate.trim() : dates.dueDate || null,
    chargeDay: parseChargeDay(dates.chargeDay),
  };
}

/**
 * @param {object|null|undefined} obj
 * @returns {PaymentDates}
 */
export function pickPaymentDates(obj) {
  if (!obj || typeof obj !== 'object') {
    return { endDate: null, dueDate: null, chargeDay: null };
  }
  return normalizePaymentDates({
    endDate: obj.endDate ?? null,
    dueDate: obj.dueDate ?? null,
    chargeDay: obj.chargeDay ?? null,
  });
}

/**
 * @param {object|null|undefined} obj
 * @param {string} prefix e.g. 'food', 'rent'
 * @returns {PaymentDates}
 */
export function pickPrefixedPaymentDates(obj, prefix) {
  if (!obj || typeof obj !== 'object') {
    return { endDate: null, dueDate: null, chargeDay: null };
  }
  const direct = pickPaymentDates(obj);
  const prefixed = normalizePaymentDates({
    endDate: obj[`${prefix}EndDate`] ?? null,
    dueDate: obj[`${prefix}DueDate`] ?? null,
    chargeDay: obj[`${prefix}ChargeDay`] ?? null,
  });
  return {
    endDate: prefixed.endDate || direct.endDate,
    dueDate: prefixed.dueDate || direct.dueDate,
    chargeDay: prefixed.chargeDay ?? direct.chargeDay,
  };
}

/**
 * @param {object} target
 * @param {PaymentDates|null|undefined} dates
 * @returns {object}
 */
export function mergePaymentDates(target, dates) {
  if (!dates) return target;
  const normalized = normalizePaymentDates(dates);
  return {
    ...target,
    endDate: normalized.endDate,
    dueDate: normalized.dueDate,
    chargeDay: normalized.chargeDay,
  };
}

/**
 * @param {object} target
 * @param {string} prefix
 * @param {PaymentDates|null|undefined} dates
 */
export function mergePrefixedPaymentDates(target, prefix, dates) {
  if (!dates) return target;
  const normalized = normalizePaymentDates(dates);
  return {
    ...target,
    [`${prefix}EndDate`]: normalized.endDate,
    [`${prefix}DueDate`]: normalized.dueDate,
    [`${prefix}ChargeDay`]: normalized.chargeDay,
  };
}

/** Standard optional date fields for inline expense edit forms. */
export const OPTIONAL_PAYMENT_DATE_EDIT_FIELDS = [
  {
    type: 'date',
    key: 'endDate',
    labelKey: 'dashboard.expensesScreen.dates.endDate',
    showDay: true,
    optional: true,
  },
  {
    type: 'number',
    key: 'chargeDay',
    labelKey: 'dashboard.expensesScreen.dates.paymentDay',
    placeholderKey: 'dashboard.expensesScreen.dates.paymentDayPlaceholder',
    optional: true,
  },
  {
    type: 'date',
    key: 'dueDate',
    labelKey: 'dashboard.expensesScreen.dates.nextPaymentDate',
    showDay: true,
    optional: true,
  },
];

/**
 * Append optional payment date fields not already present in a field list.
 * @param {object[]} fields
 * @returns {object[]}
 */
const PAYMENT_DATE_FIELD_ALIASES = {
  endDate: ['promoEndDate', 'mortgageEndDate', 'insuranceEndDate', 'ptValidUntil'],
  chargeDay: ['paymentDueDay'],
  dueDate: [],
};

export function appendOptionalPaymentDateFields(fields) {
  const existing = new Set(fields.map((f) => f.key).filter(Boolean));
  Object.entries(PAYMENT_DATE_FIELD_ALIASES).forEach(([canonical, aliases]) => {
    if (existing.has(canonical)) return;
    if (aliases.some((alias) => existing.has(alias))) existing.add(canonical);
  });
  const appended = OPTIONAL_PAYMENT_DATE_EDIT_FIELDS.filter((f) => !existing.has(f.key));
  if (!appended.length) return fields;
  return [
    ...fields,
    ...appended,
    {
      type: 'hint',
      key: '_paymentDatesHint',
      labelKey: 'dashboard.expensesScreen.dates.optionalHint',
    },
  ];
}

/**
 * Resolve payment dates for a dashboard expense row from its stored source.
 * @param {{ editKind?: string, editRef?: object, source?: object }} row
 * @returns {PaymentDates}
 */
export function resolveRowPaymentDates(row) {
  const kind = row.editKind;
  const ref = row.editRef || {};
  const source = row.source || {};

  switch (kind) {
    case 'child_cost':
      return pickPaymentDates(source.field || source);
    case 'pet': {
      const pet = source.pet || source;
      const prefix = ref.field === 'vet' ? 'vet' : 'food';
      return pickPrefixedPaymentDates(pet, prefix);
    }
    case 'housing_rent':
      return pickPrefixedPaymentDates(source, 'rent');
    case 'housing_utilities':
      if (source.item) return pickPaymentDates(source.item);
      return pickPrefixedPaymentDates(source, 'utilities');
    case 'housing_internet':
      return pickPrefixedPaymentDates(source, 'internet');
    case 'housing_mortgage':
      return normalizePaymentDates({
        endDate: source.mortgageEndDate || source.endDate || null,
        dueDate: source.mortgageDueDate || source.dueDate || null,
        chargeDay: source.mortgageChargeDay ?? source.chargeDay ?? null,
      });
    case 'housing_govt_tax': {
      const gt = source.govtTaxes || source;
      const map = {
        wasteTaxAmount: 'wasteTax',
        tvLicenceAmount: 'tvLicence',
        radioLicenceAmount: 'radioLicence',
      };
      const prefix = map[ref.amountField] || 'wasteTax';
      return pickPrefixedPaymentDates(gt, prefix);
    }
    case 'housing_govt_custom':
      return pickPaymentDates(source.item || source);
    case 'housing_other_row':
    case 'housing_family_row':
      return pickPaymentDates(source.row || source);
    case 'other_cost':
      return pickPaymentDates(source);
    case 'subscription':
      return normalizePaymentDates({
        endDate: source.endDate || source.renewalDate || null,
        dueDate: source.dueDate || null,
        chargeDay: source.chargeDay ?? null,
      });
    case 'debt':
      return normalizePaymentDates({
        endDate: source.promoEndDate || null,
        dueDate: source.dueDate || null,
        chargeDay: source.paymentDueDay ?? null,
      });
    case 'health_member':
      return pickPaymentDates(source.member || source);
    case 'transport_public':
      return normalizePaymentDates({
        endDate: source.ptEndDate || source.ptValidUntil || null,
        dueDate: source.ptDueDate || null,
        chargeDay: source.ptChargeDay ?? null,
      });
    case 'transport_vehicle': {
      const v = source.vehicle || source;
      if (ref.field === 'insurance') {
        return normalizePaymentDates({
          endDate: v.insuranceEndDate || null,
          dueDate: v.insuranceDueDate || null,
          chargeDay: v.insuranceChargeDay ?? null,
        });
      }
      const prefix = ref.field === 'parking' ? 'parking' : 'fuel';
      return pickPrefixedPaymentDates(v, prefix);
    }
    default:
      return pickPaymentDates(source);
  }
}

/**
 * @param {PaymentDates} dates
 * @returns {'renewal'|'due'|'end'|null}
 */
export function inferDateTypeFromPaymentDates(dates) {
  if (dates.dueDate || dates.chargeDay) return 'due';
  if (dates.endDate) return 'end';
  return null;
}
