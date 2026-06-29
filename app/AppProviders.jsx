import { Stack } from 'expo-router';
import { View } from 'react-native';
import { I18nProvider } from '../lib/i18n';
import { AuthProvider } from '../lib/auth/AuthProvider';
import { useTheme } from '../lib/theme';
import { C } from '../constants/onboarding-theme';
import PillSnackbar from '../components/dashboard/PillSnackbar';

function AppNavigation() {
  useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1, backgroundColor: C.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

/** Auth + i18n + router — mounted inside ThemeProvider so theme toggles re-render the tree. */
export default function AppProviders() {
  return (
    <I18nProvider>
      <AuthProvider>
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <AppNavigation />
          </View>
          <PillSnackbar />
        </View>
      </AuthProvider>
    </I18nProvider>
  );
}
