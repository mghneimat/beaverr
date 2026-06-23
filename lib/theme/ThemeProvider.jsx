import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { C, applyActiveTheme } from '../../constants/onboarding-theme';
import { getUiPreferences, setUiPreferences } from '../uiPreferences';
import { hideWebBootLoader } from '../bootLoader';
import { createGluestackConfig } from '../../gluestack-ui.config';

/** @typedef {'light' | 'dark'} ColorScheme */

const ThemeContext = createContext({
  mode: 'light',
  colors: C,
  isDark: false,
  setMode: /** @type {(mode: ColorScheme) => void} */ () => {},
  toggleMode: () => {},
  ready: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors() {
  return useContext(ThemeContext).colors;
}

/**
 * Root theme provider — persists colorScheme, mutates active C, re-renders tree.
 */
export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const prefs = await getUiPreferences();
        if (!mounted) return;
        const initial = prefs.colorScheme === 'dark' ? 'dark' : 'light';
        applyActiveTheme(initial);
        setModeState(initial);
        setReady(true);
        hideWebBootLoader();
      } catch (err) {
        console.error('Error loading UI preferences:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setMode = useCallback(async (next) => {
    const scheme = next === 'dark' ? 'dark' : 'light';
    applyActiveTheme(scheme);
    setModeState(scheme);
    await setUiPreferences({ colorScheme: scheme });
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo(() => ({
    mode,
    colors: C,
    isDark: mode === 'dark',
    setMode,
    toggleMode,
    ready,
  }), [mode, setMode, toggleMode, ready]);

  const gluestackConfig = useMemo(() => createGluestackConfig(C), [mode]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }} />
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      <GluestackUIProvider key={mode} config={gluestackConfig}>
        <View key={mode} style={{ flex: 1, backgroundColor: C.bg }}>
          {children}
        </View>
      </GluestackUIProvider>
    </ThemeContext.Provider>
  );
}
