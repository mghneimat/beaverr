import { PRE_ALPHA_COUNTRY_CODE } from './locationConstants';
import {
  getSubscriptionCatalog,
  getSubscriptionCategoryOrder,
} from './subscriptionCatalog';

/**
 * @param {object|null|undefined} location
 * @returns {string}
 */
export function getCountryCode(location) {
  return location?.country || PRE_ALPHA_COUNTRY_CODE;
}

/**
 * @param {object|null|undefined} location
 * @returns {import('./subscriptionCatalog').SubscriptionCategoryId[]}
 */
export function getSubscriptionCategoryOrderForLocation(location) {
  return getSubscriptionCategoryOrder(getCountryCode(location));
}

/**
 * @param {object|null|undefined} location
 * @returns {Record<string, string[]>}
 */
export function getSubscriptionsCatalogForLocation(location) {
  return getSubscriptionCatalog(getCountryCode(location));
}
