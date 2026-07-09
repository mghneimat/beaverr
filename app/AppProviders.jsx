import { Stack } from 'expo-router';
import { View, Platform } from 'react-native';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nProvider } from '../lib/i18n';
import { AuthProvider } from '../lib/auth/AuthProvider';
import { useTheme } from '../lib/theme';
import { C } from '../constants/onboarding-theme';
import PillSnackbar from '../components/dashboard/PillSnackbar';
import { reportClientError } from '../lib/admin/reportError.js';

function AppNavigation() {
  useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1, backgroundColor: C.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

/** Auth + i18n + router — mounted inside ThemeProvider so theme toggles re-render the tree. */
export default function AppProviders() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onWindowError = (event) => {
      reportClientError({
        severity: 'blocker',
        category: 'ui',
        message: event.message || 'window_error',
        stack: event.error?.stack,
        context: { source: 'window.onerror', filename: event.filename, lineno: event.lineno },
      });
    };

    const onUnhandledRejection = (event) => {
      const reason = event.reason;
      reportClientError({
        severity: 'error',
        category: 'ui',
        message: reason instanceof Error ? reason.message : String(reason ?? 'unhandled_rejection'),
        stack: reason instanceof Error ? reason.stack : undefined,
        context: { source: 'unhandledrejection' },
      });
    };

    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
