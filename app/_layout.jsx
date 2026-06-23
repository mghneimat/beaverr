import '../global.css';
import React from 'react';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { I18nProvider } from '../lib/i18n';
import AppLoadingScreen from '../components/app/AppLoadingScreen';
import { ThemeProvider } from '../lib/theme';
import { useFonts } from 'expo-font';
import { generalSansFontAssets } from '../lib/fonts';

SplashScreen.preventAutoHideAsync();

function AppNavigation() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1 } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(generalSansFontAssets);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <AppLoadingScreen />;
  }

  return (
    <ThemeProvider>
      <I18nProvider>
        <AppNavigation />
      </I18nProvider>
    </ThemeProvider>
  );
}
