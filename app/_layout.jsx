import '../global.css';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import AppLoadingScreen from '../components/app/AppLoadingScreen';
import { ThemeProvider } from '../lib/theme';
import { useFonts } from 'expo-font';
import { generalSansFontAssets } from '../lib/fonts';

SplashScreen.preventAutoHideAsync();

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

  return <ThemeProvider />;
}
