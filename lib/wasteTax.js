/** @typedef {'0-2' | '3-5' | '6-15' | '16-18'} AgeGroup */

import { roundMoney } from './finance';

/** Full annual rate per liable adult (Kč) — Prague / common CZ municipal estimate */
export const DEFAULT_WASTE_TAX_FULL_RATE = 1080;

/**
 * Share of the full per-person rate by child age group.
 * Many Czech municipalities exempt infants and reduce fees for children under 15.
 * Users can override the total — this is a starting estimate only.
 * @type {Record<AgeGroup, number>}
 */
export const WASTE_TAX_CHILD_RATE_MULTIPLIERS = {
  '0-2': 0,
  '3-5': 0.5,
  '6-15': 0.5,
  '16-18': 1,
};

/**
 * @param {object|null|undefined} household
 * @returns {{ adultCount: number, children: Array<{ ageGroup: AgeGroup, multiplier: number }> }}
 */
export function getHouseholdWasteTaxMembers(household) {
  let adultCount = 1;
  if (household?.type === 'partner' && household?.partnerName) {
    adultCount = 2;
  }

  const children = (household?.children || []).map((child) => {
    const ageGroup = child?.ageGroup || '6-15';
    const multiplier = WASTE_TAX_CHILD_RATE_MULTIPLIERS[ageGroup] ?? 1;
    return { ageGroup, multiplier };
  });

  return { adultCount, children };
}

/**
 * @param {object|null|undefined} household
 * @param {{ fullRate?: number }} [options]
 * @returns {number}
 */
export function estimateAnnualWasteTax(household, options = {}) {
  const fullRate = options.fullRate ?? DEFAULT_WASTE_TAX_FULL_RATE;
  const { adultCount, children } = getHouseholdWasteTaxMembers(household);
  const adultTotal = adultCount * fullRate;
  const childTotal = children.reduce((sum, child) => sum + fullRate * child.multiplier, 0);
  return roundMoney(adultTotal + childTotal);
}

/**
 * Human-readable breakdown for UI helper text.
 * @param {object|null|undefined} household
 * @param {(key: string, params?: object) => string} t
 * @returns {string}
 */
export function buildWasteTaxMemberSummary(household, t) {
  const { adultCount, children } = getHouseholdWasteTaxMembers(household);
  const parts = [];

  if (adultCount === 1) {
    parts.push(t('onboarding.housing.govtTaxes.wasteTaxSummaryOneAdult'));
  } else {
    parts.push(t('onboarding.housing.govtTaxes.wasteTaxSummaryAdults', { count: adultCount }));
  }

  const fullChildren = children.filter((c) => c.multiplier === 1).length;
  const reducedChildren = children.filter((c) => c.multiplier > 0 && c.multiplier < 1).length;
  const exemptChildren = children.filter((c) => c.multiplier === 0).length;

  if (fullChildren === 1) {
    parts.push(t('onboarding.housing.govtTaxes.wasteTaxSummaryChildFull'));
  } else if (fullChildren > 1) {
    parts.push(t('onboarding.housing.govtTaxes.wasteTaxSummaryChildrenFull', { count: fullChildren }));
  }
  if (reducedChildren === 1) {
    parts.push(t('onboarding.housing.govtTaxes.wasteTaxSummaryChildReduced'));
  } else if (reducedChildren > 1) {
    parts.push(t('onboarding.housing.govtTaxes.wasteTaxSummaryChildrenReduced', { count: reducedChildren }));
  }
  if (exemptChildren === 1) {
    parts.push(t('onboarding.housing.govtTaxes.wasteTaxSummaryChildExempt'));
  } else if (exemptChildren > 1) {
    parts.push(t('onboarding.housing.govtTaxes.wasteTaxSummaryChildrenExempt', { count: exemptChildren }));
  }

  return parts.join(', ');
}

/**
 * @param {object|null|undefined} location
 * @returns {boolean}
 */
export function shouldEstimateCzechWasteTax(location) {
  if (!location) return false;
  if (location.currency === 'CZK') return true;
  if (location.country === 'CZ') return true;
  const country = String(location.country || '').toLowerCase();
  return country.includes('czech') || country.includes('česk');
}
