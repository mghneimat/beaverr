/**
 * Subscription categories and suggested services for onboarding Step 1.
 * Text-only pills — no icons.
 */

/** @typedef {string} SubscriptionCategoryId */

/** @type {SubscriptionCategoryId[]} */
export const SUBSCRIPTION_CATEGORY_ORDER = [
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
  'personalCare',
  'telecomsUtilities',
  'homeGarden',
  'legalItems',
];

/**
 * @type {Record<SubscriptionCategoryId, string[]>}
 * Service keys map to onboarding.subscriptions.serviceSelection.services.* or categories.* i18n
 */
export const SUBSCRIPTION_CATALOG = {
  onlineShopping: ['amazonPrime', 'alzaPlus', 'other'],
  education: ['coursera', 'udemy', 'languageApp', 'other'],
  itTech: ['icloudPlus', 'googleOne', 'microsoft365', 'adobeCC', 'dropbox', 'github', 'chatgpt', 'other'],
  entertainmentStreaming: [
    'netflix', 'primeVideo', 'disneyPlus', 'appleTvPlus', 'hboMax',
    'spotify', 'appleMusic', 'youtubePremium', 'deezer',
    'playstationPlus', 'xboxGamePass', 'other',
  ],
  productivity: ['notion', 'other'],
  banking: ['revolut', 'wise', 'other'],
  healthWellbeing: ['gym', 'lifeInsurance', 'meditationApp', 'other'],
  newsReading: ['nytimes', 'theEconomist', 'medium', 'other'],
  foodDelivery: ['groceries', 'mealKit', 'foodDeliveryApp', 'other'],
  travelTransport: ['transitPass', 'parkingPass', 'other'],
  familyKids: ['kidsStreaming', 'other'],
  personalCare: ['hairSalon', 'other'],
  telecomsUtilities: ['mobilePhone', 'other'],
  homeGarden: ['homeSecurity', 'other'],
  legalItems: ['osvcSocial', 'osvcHealth', 'homeInsurance', 'pension', 'tradeLicense', 'accountant', 'other'],
};

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
  revolut: 'banking',
  wise: 'banking',
  icloudPlus: 'itTech',
  googleOne: 'itTech',
  microsoft365: 'itTech',
  adobeCC: 'itTech',
  dropbox: 'itTech',
  github: 'itTech',
  chatgpt: 'itTech',
  notion: 'productivity',
  nytimes: 'newsReading',
  theEconomist: 'newsReading',
  medium: 'newsReading',
  other: null,
};

/** Maps other-costs chip keys to subscription category (null = user picks on fill) */
export const OTHER_COST_MIGRATION_CATEGORY = {
  groceries: 'foodDelivery',
  mobilePhone: 'telecomsUtilities',
  lifeInsurance: 'healthWellbeing',
  homeInsurance: 'legalItems',
  gym: 'healthWellbeing',
  hairSalon: 'personalCare',
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
