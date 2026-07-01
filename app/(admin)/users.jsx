import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useI18n } from '../../lib/i18n';
import { invokeAdminApi } from '../../lib/admin/adminApi';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { C, S, T } from '../../constants/onboarding-theme';

export default function AdminUsersScreen() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await invokeAdminApi('users.list', { search });
    if (result.ok) setUsers(result.data?.users ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const toggleRole = async (user) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    const result = await invokeAdminApi('users.setRole', { userId: user.id, role: nextRole });
    if (!result.ok) {
      Alert.alert(t('admin.users.roleFailed'), result.error);
      return;
    }
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const result = await invokeAdminApi('users.delete', { userId: deleteTarget.id });
    setDeleteTarget(null);
    if (!result.ok) {
      Alert.alert(t('admin.users.deleteFailed'), result.error);
      return;
    }
    load();
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: S.pagePadH, paddingVertical: S.pagePadV }}>
      <Text style={{ ...T.pageTitle, color: C.text, marginBottom: 16 }}>{t('admin.users.title')}</Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={t('admin.users.searchPlaceholder')}
        placeholderTextColor={C.textMuted}
        style={{
          borderWidth: 1,
          borderColor: C.border,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: Platform.OS === 'web' ? 10 : 8,
          color: C.text,
          marginBottom: 16,
          backgroundColor: C.surface,
        }}
      />

      {loading ? (
        <ActivityIndicator color={C.accent} />
      ) : (
        users.map((user) => (
          <View
            key={user.id}
            style={{
              borderWidth: 1,
              borderColor: C.border,
              borderRadius: 10,
              padding: 14,
              marginBottom: 10,
              backgroundColor: C.surface,
            }}
          >
            <Text style={{ color: C.text, fontWeight: '600' }}>{user.username || user.email || user.id}</Text>
            <Text style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>{user.email}</Text>
            <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>
              {t('admin.users.meta', {
                role: user.role,
                locale: user.locale,
                household: user.hasHousehold ? t('common.yes') : t('common.no'),
              })}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
              <Pressable
                onPress={() => toggleRole(user)}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: C.accentSoft }}
              >
                <Text style={{ color: C.accent, fontSize: 13 }}>
                  {user.role === 'admin' ? t('admin.users.demote') : t('admin.users.promote')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setDeleteTarget(user)}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FEE2E2' }}
              >
                <Text style={{ color: C.danger, fontSize: 13 }}>{t('admin.users.delete')}</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title={t('admin.users.deleteConfirmTitle')}
        message={t('admin.users.deleteConfirmMessage')}
        confirmLabel={t('admin.users.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </ScrollView>
  );
}
