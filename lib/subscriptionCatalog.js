import { PRE_ALPHA_COUNTRY_CODE } from './locationConstants';

/**
 * Subscription categories and suggested services for onboarding.
 * Global base catalog + per-country service additions.
 */

/** @typedef {string} SubscriptionCategoryId */

/** @type {SubscriptionCategoryId[]} */
export const GLOBAL_SUBSCRIPTION_CATEGORY_ORDER = [
  'onlineShopping',
  'education',
  'itTech',
  'entertainmentStreaming',
  'productivity',
  'banking',
  'healthWellbeing',
  'newsReading',
  'foodDelivery',
  'travelTransport',
  'familyKids',
  'telecomsUtilities',
  'homeGarden',
  'legalItems',
];

/**
 * @type {Record<SubscriptionCategoryId, string[]>}
 * Service keys map to onboarding.subscriptions.serviceSelection.services.* i18n
 */
export const GLOBAL_SUBSCRIPTION_CATALOG = {
  onlineShopping: ['amazonPrime', 'alzaPlus', 'other'],
  education: ['coursera', 'udemy', 'duolingo', 'linkedinLearning', 'other'],
  itTech: ['icloudPlus', 'googleOne', 'microsoft365', 'adobeCC', 'dropbox', 'github', 'aiAssistant', 'other'],
  entertainmentStreaming: [
    'netflix', 'primeVideo', 'disneyPlus', 'appleTvPlus', 'hboMax',
    'spotify', 'appleMusic', 'youtubePremium', 'deezer',
    'playstationPlus', 'xboxGamePass', 'other',
  ],
  productivity: ['notion', 'todoist', 'trello', '1password', 'other'],
  banking: ['revolut', 'wise', 'other'],
  healthWellbeing: ['gym', 'lifeInsurance', 'meditationApp', 'other'],
  newsReading: ['nytimes', 'theEconomist', 'medium', 'other'],
  foodDelivery: ['mealKit', 'foodDeliveryApp', 'other'],
  travelTransport: ['transitPass', 'parkingPass', 'other'],
  familyKids: ['kidsStreaming', 'other'],
  telecomsUtilities: ['mobilePhone', 'other'],
  homeGarden: ['homeSecurity', 'other'],
  legalItems: ['osvcSocial', 'osvcHealth', 'homeInsurance', 'pension', 'tradeLicense', 'accountant', 'other'],
};

/**
 * Per-country service keys merged onto the global catalog (deduped, `other` stays last).
 * @type {Record<string, Partial<Record<SubscriptionCategoryId, string[]>>>}
 */
export const COUNTRY_SERVICE_ADDITIONS = {
  CZ: {
    entertainmentStreaming: ['oneplay'],
    education: ['seduo', 'skillmea'],
    newsReading: ['denikN', 'respekt', 'idnesPremium', 'hn', 'echoPrime'],
    healthWellbeing: ['multisport'],
    foodDelivery: ['rohlikXtra'],
    travelTransport: ['pidLitacka'],
    telecomsUtilities: ['o2', 'tMobile', 'vodafone', 'tescoMobile'],
    banking: ['rbPremium', 'kbPackage', 'mbankPremium'],
    homeGarden: ['jablotronMonitoring'],
    legalItems: ['dataMailboxOrEsig'],
  },
};

/** Categories where country additions replace generic global keys (CZ only). */
const COUNTRY_SERVICE_REPLACEMENTS = {
  CZ: {
    telecomsUtilities: ['mobilePhone'],
  },
};

/** @deprecated Use getSubscriptionCategoryOrder(countryCode) */
export const SUBSCRIPTION_CATEGORY_ORDER = GLOBAL_SUBSCRIPTION_CATEGORY_ORDER;

/** @deprecated Use getSubscriptionCatalog(countryCode) */
export const SUBSCRIPTION_CATALOG = GLOBAL_SUBSCRIPTION_CATALOG;

/**
 * @param {string[]} services
 * @returns {string[]}
 */
function normalizeServiceList(services) {
  const withoutOther = services.filter((key) => key !== 'other');
  const deduped = [...new Set(withoutOther)];
  return [...deduped, 'other'];
}

/**
 * @param {string} [countryCode]
 * @returns {Record<SubscriptionCategoryId, string[]>}
 */
export function getSubscriptionCatalog(countryCode = PRE_ALPHA_COUNTRY_CODE) {
  const code = countryCode || PRE_ALPHA_COUNTRY_CODE;
  const additions = COUNTRY_SERVICE_ADDITIONS[code] || {};
  const replacements = COUNTRY_SERVICE_REPLACEMENTS[code] || {};
  /** @type {Record<string, string[]>} */
  const catalog = {};

  GLOBAL_SUBSCRIPTION_CATEGORY_ORDER.forEach((categoryId) => {
    let services = [...(GLOBAL_SUBSCRIPTION_CATALOG[categoryId] || [])];
    const replaceKeys = replacements[categoryId] || [];
    if (replaceKeys.length > 0) {
      services = services.filter((key) => !replaceKeys.includes(key));
    }
    const added = additions[categoryId] || [];
    catalog[categoryId] = normalizeServiceList([...services, ...added]);
  });

  return catalog;
}

/**
 * @param {string} [countryCode]
 * @returns {SubscriptionCategoryId[]}
 */
export function getSubscriptionCategoryOrder(countryCode = PRE_ALPHA_COUNTRY_CODE) {
  void countryCode;
  return [...GLOBAL_SUBSCRIPTION_CATEGORY_ORDER];
}

/** Maps legacy subscription service keys to categories */
export const LEGACY_SERVICE_CATEGORY = {
  netflix: 'entertainmentStreaming',
  primeVideo: 'entertainmentStreaming',
  disneyPlus: 'entertainmentStreaming',
  appleTvPlus: 'entertainmentStreaming',
  hboMax: 'entertainmentStreaming',
  spotify: 'entertainmentStreaming',
  appleMusic: 'entertainmentStreaming',
  youtubePremium: 'entertainmentStreaming',
  deezer: 'entertainmentStreaming',
  playstationPlus: 'entertainmentStreaming',
  xboxGamePass: 'entertainmentStreaming',
  oneplay: 'entertainmentStreaming',
  revolut: 'banking',
  wise: 'banking',
  icloudPlus: 'itTech',
  googleOne: 'itTech',
  microsoft365: 'itTech',
  adobeCC: 'itTech',
  dropbox: 'itTech',
  github: 'itTech',
  chatgpt: 'itTech',
  aiAssistant: 'itTech',
  notion: 'productivity',
  nytimes: 'newsReading',
  theEconomist: 'newsReading',
  medium: 'newsReading',
  languageApp: 'education',
  duolingo: 'education',
  groceries: 'foodDelivery',
  hairSalon: 'personalCare',
  personalCare: 'personalCare',
  other: null,
};

/** Maps other-costs chip keys to subscription category (null = user picks on fill) */
export const OTHER_COST_MIGRATION_CATEGORY = {
  mobilePhone: 'telecomsUtilities',
  lifeInsurance: 'healthWellbeing',
  homeInsurance: 'legalItems',
  gym: 'healthWellbeing',
  education: null,
  pension: 'legalItems',
  osvcSocial: 'legalItems',
  osvcHealth: 'legalItems',
  other: null,
};

/**
 * @param {string} categoryId
 * @returns {string}
 */
export function categoryLabelKey(categoryId) {
  return `onboarding.subscriptions.serviceSelection.categories.${categoryId}`;
}

/**
 * @param {string} serviceKey
 * @returns {string}
 */
export function serviceLabelKey(serviceKey) {
  return `onboarding.subscriptions.serviceSelection.services.${serviceKey}`;
}

/**
 * @param {object} sub
 * @param {(key: string) => string} t
 * @returns {string}
 */
export function subscriptionDisplayName(sub, t) {
  if (sub.customName?.trim()) return sub.customName.trim();
  const key = serviceLabelKey(sub.serviceKey || sub.name || 'other');
  const translated = t(key);
  return translated !== key ? translated : (sub.serviceKey || sub.name || t('onboarding.subscriptions.serviceSelection.services.other'));
}
