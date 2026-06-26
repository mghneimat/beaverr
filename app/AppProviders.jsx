import { Stack } from 'expo-router';
import { I18nProvider } from '../lib/i18n';
import { AuthProvider } from '../lib/auth/AuthProvider';

function AppNavigation() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1 } }}>
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
        <AppNavigation />
      </AuthProvider>
    </I18nProvider>
  );
}
