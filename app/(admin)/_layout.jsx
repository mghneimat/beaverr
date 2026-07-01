import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth/AuthProvider';
import { checkAdminAccess } from '../../lib/admin/adminApi';
import { useI18n } from '../../lib/i18n';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { C, S, T } from '../../constants/onboarding-theme';

export default function AdminLayout() {
  const { session, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [gate, setGate] = useState('loading');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setGate('native');
      return;
    }
    if (authLoading) return;
    if (!session) {
      setGate('unauthenticated');
      return;
    }

    let active = true;
    checkAdminAccess().then((result) => {
      if (!active) return;
      if (result.ok && result.isAdmin) setGate('allowed');
      else setGate('forbidden');
    });
    return () => {
      active = false;
    };
  }, [authLoading, session]);

  if (Platform.OS !== 'web' || gate === 'native') {
    return <Redirect href="/(app)/dashboard" />;
  }

  if (authLoading || gate === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (gate === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  if (gate === 'forbidden') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, padding: S.pagePadH }}>
        <Text style={{ ...T.pageTitle, color: C.text, marginBottom: 8 }}>{t('admin.forbiddenTitle')}</Text>
        <Text style={{ color: C.textMuted, textAlign: 'center' }}>{t('admin.forbiddenBody')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.bg }}>
      <AdminSidebar />
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1, backgroundColor: C.bg } }} />
      </View>
    </View>
  );
}
