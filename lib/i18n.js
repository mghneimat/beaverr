/**
 * i18n system - React provider + hook
 * Pure translate lives in translateCore.js (no component imports).
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { getData, setData } from './storage';
import { translate } from './translateCore';
import AppLoadingScreen from '../components/app/AppLoadingScreen';

export { translate, t } from './translateCore';

const I18nContext = createContext(null);

/**
 * I18n Provider Component
 */
export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLocale() {
      try {
        const settings = await getData('beaverr_settings');
        if (settings?.language) {
          setLocaleState(settings.language);
        }
      } catch (error) {
        console.error('Error loading locale:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadLocale();
  }, []);

  const setLocale = async (newLocale) => {
    try {
      setLocaleState(newLocale);
      const settings = await getData('beaverr_settings') || {};
      await setData('beaverr_settings', { ...settings, language: newLocale });
    } catch (error) {
      console.error('Error saving locale:', error);
    }
  };

  const t = (key, params) => translate(locale, key, params);

  if (isLoading) {
    return <AppLoadingScreen label={translate(locale, 'common.loading')} />;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to use i18n in components
 * @returns {{ locale: string, setLocale: (locale: string) => void, t: (key: string, params?: Object) => string }}
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
