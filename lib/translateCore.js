/**
 * Pure translation helpers — no React imports (safe for lib/ and components/).
 */

import enTranslations from './locales/en.json';
import csTranslations from './locales/cs.json';

const translations = {
  en: enTranslations,
  cs: csTranslations,
};

const warnedKeys = new Set();

function normalizeLocale(locale) {
  if (translations[locale]) return locale;
  if (typeof locale === 'string') {
    if (locale.startsWith('en')) return 'en';
    if (locale.startsWith('cs')) return 'cs';
  }
  return 'en';
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * @param {string} locale
 * @param {string} key
 * @param {Object} [params]
 * @returns {string}
 */
export function translate(locale, key, params = {}) {
  const resolvedLocale = normalizeLocale(locale);
  const translation = getNestedValue(translations[resolvedLocale], key);

  if (!translation) {
    const warnKey = `${resolvedLocale}:${key}`;
    if (!warnedKeys.has(warnKey)) {
      warnedKeys.add(warnKey);
      console.warn(`Translation missing for key: ${key} in locale: ${resolvedLocale}`);
    }
    return key;
  }

  if (typeof translation !== 'string') {
    const warnKey = `${resolvedLocale}:${key}:non-string`;
    if (!warnedKeys.has(warnKey)) {
      warnedKeys.add(warnKey);
      console.warn(`Translation key "${key}" resolved to a non-string in locale: ${resolvedLocale}`);
    }
    return key;
  }

  if (Object.keys(params).length > 0) {
    return translation.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  }

  return translation;
}

/** @param {string} key @param {Object} [params] @returns {string} */
export function t(key, params) {
  return translate('en', key, params);
}
