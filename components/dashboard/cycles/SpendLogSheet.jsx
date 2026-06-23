import { useEffect, useState } from 'react';
import { View, Modal, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import {
  loadDailyLogs,
  saveDailyLogs,
  upsertDailyLog,
  getLogForDate,
} from '../../../lib/dailyLog';
import { parseAmount, amountToString } from '../../../lib/sectionEditStorage';
import { notifyDashboardRefresh } from '../../../lib/dashboardRefresh';
import { emitDashboardToast } from '../../../lib/dashboardToast';
import { C, R, T } from '../../../constants/onboarding-theme';
import FormInput from '../../ui/FormInput';
import PrimaryButton from '../../ui/PrimaryButton';

function formatDayHeading(isoDate, locale) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return dt.toLocaleDateString(tag, { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function SpendLogSheet({
  visible,
  onClose,
  isoDate,
  cycleId,
  currency,
}) {
  const { t, locale } = useI18n();
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (!visible || !isoDate) return;
    loadDailyLogs().then((logs) => {
      const entry = getLogForDate(logs, isoDate);
      if (entry?.status === 'confirmed') {
        setInputValue(amountToString(Number(entry.spent) || 0));
      } else {
        setInputValue('');
      }
      setErrorText('');
    });
  }, [visible, isoDate]);

  const handleSave = async (confirmZero = false) => {
    const amount = confirmZero ? 0 : parseAmount(inputValue);
    if (!confirmZero && (amount == null || amount < 0)) {
      setErrorText(t('dashboard.cycles.spendLog.validation'));
      return;
    }

    setSaving(true);
    setErrorText('');
    try {
      const logs = await loadDailyLogs();
      const next = upsertDailyLog(logs, isoDate, amount ?? 0, {
        cycleId,
        confirmZero: confirmZero || (amount ?? 0) > 0,
      });
      await saveDailyLogs(next);
      notifyDashboardRefresh();
      emitDashboardToast('spendingSaved');
      onClose();
    } catch {
      setErrorText(t('dashboard.cycles.spendLog.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!isoDate) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(30,58,95,0.35)',
          }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.cycles.spendLog.closeA11y')}
        />
        <View
          style={{
            width: '100%',
            maxWidth: 440,
            backgroundColor: C.surface,
            borderRadius: R.card,
            borderWidth: 1,
            borderColor: C.border,
            padding: 20,
            ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
          }}
        >
          <Text style={{ ...T.cardTitle, marginBottom: 4 }}>
            {t('dashboard.cycles.spendLog.title')}
          </Text>
          <Text style={{ ...T.caption, color: C.muted, marginBottom: 16 }}>
            {formatDayHeading(isoDate, locale)}
          </Text>

          <FormInput
            label={t('dashboard.cycles.spendLog.inputLabel')}
            value={inputValue}
            onChangeText={(text) => {
              setInputValue(text);
              setErrorText('');
            }}
            placeholder={t('dashboard.cycles.spendLog.placeholder')}
            numeric
            large
            currency={currency}
            errorText={errorText}
            disabled={saving}
            accessibilityLabel={t('dashboard.cycles.spendLog.a11y')}
            containerStyle={{ marginBottom: 16 }}
          />

          <PrimaryButton
            onPress={() => handleSave(false)}
            disabled={saving}
            accessibilityState={{ busy: saving }}
          >
            {saving ? t('dashboard.cycles.spendLog.saving') : t('dashboard.cycles.spendLog.save')}
          </PrimaryButton>

          <Pressable
            onPress={() => handleSave(true)}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.cycles.spendLog.confirmZeroA11y')}
            style={({ pressed }) => ({
              marginTop: 12,
              alignSelf: 'center',
              opacity: pressed ? 0.7 : 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
            })}
          >
            <Text style={{ ...T.caption, color: C.muted, fontWeight: '600' }}>
              {t('dashboard.cycles.spendLog.confirmZero')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
