import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import AppProviders from '../../app/AppProviders';
import { C, applyActiveTheme } from '../../constants/onboarding-theme';
import { getUiPreferences, setUiPreferences } from '../uiPreferences';
import { hideWebBootLoader } from '../bootLoader';
import { createGluestackConfig } from '../../gluestack-ui.config';
import ThemeSettleTransition from './ThemeSettleTransition';

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
 * Subscribes to theme and renders the app shell so every toggle re-renders the tree.
 */
function ThemeShell({ mode, targetMode, onApplyMode }) {
  useTheme();
  return (
    <ThemeSettleTransition
      targetMode={targetMode}
      appliedMode={mode}
      onApplyMode={onApplyMode}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      <AppProviders />
    </ThemeSettleTransition>
  );
}

/**
 * Root theme provider — persists colorScheme, mutates active C, re-renders tree.
 */
export function ThemeProvider() {
  const [mode, setModeState] = useState('light');
  const [targetMode, setTargetMode] = useState('light');
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
        setTargetMode(initial);
        setReady(true);
        hideWebBootLoader();
      } catch (err) {
        console.error('Error loading UI preferences:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const applyMode = useCallback(async (scheme) => {
    applyActiveTheme(scheme);
    setModeState(scheme);
    setTargetMode(scheme);
    await setUiPreferences({ colorScheme: scheme });
  }, []);

  const setMode = useCallback((next) => {
    const scheme = next === 'dark' ? 'dark' : 'light';
    if (scheme === mode) return;
    setTargetMode(scheme);
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo(() => ({
    mode,
    targetMode,
    colors: C,
    isDark: targetMode === 'dark',
    setMode,
    toggleMode,
    ready,
  }), [mode, targetMode, setMode, toggleMode, ready]);

  const gluestackConfig = useMemo(() => createGluestackConfig(C), [mode]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }} />
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      <GluestackUIProvider config={gluestackConfig}>
        <ThemeShell mode={mode} targetMode={targetMode} onApplyMode={applyMode} />
      </GluestackUIProvider>
    </ThemeContext.Provider>
  );
}
