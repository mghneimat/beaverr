import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import {
  setReminderPref,
  DEFAULT_REMINDER_PREF,
  resolveReminderSaveToastKind,
} from '../../lib/reminderPreferences';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import { emitDashboardToast } from '../../lib/dashboardToast';
import { C, R, T } from '../../constants/onboarding-theme';
import PrimaryButton from '../ui/PrimaryButton';
import { OutlineButton } from '../ui/OutlineButton';

const LEAD_OPTIONS = [1, 3, 7, 14, 30];

export default function ReminderAlertEditPanel({ row, onDone, onCancel }) {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState(row.pref?.enabled !== false);
  const [leadDays, setLeadDays] = useState(row.pref?.leadDays ?? DEFAULT_REMINDER_PREF.leadDays);
  const [saving, setSaving] = useState(false);

  const hasDate = Boolean(row.dateValue);

  const handleSave = async () => {
    setSaving(true);
    const beforePref = row.pref;
    const nextEnabled = hasDate && enabled;
    const afterPref = { ...beforePref, enabled: nextEnabled, leadDays };
    try {
      await setReminderPref(row.reminderId, { enabled: nextEnabled, leadDays });
      const toastKind = resolveReminderSaveToastKind(beforePref, afterPref, {
        hasNextPayment: hasDate,
      });
      if (toastKind) {
        emitDashboardToast(toastKind);
      }
      notifyDashboardRefresh();
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: 16 }}>
      <Text style={{ ...T.fieldLabel }}>{t('dashboard.remindersScreen.alertSettingsTitle')}</Text>

      {!hasDate ? (
        <Text style={{ ...T.helper, color: C.muted }}>
          {t('dashboard.remindersScreen.addDateHint')}
        </Text>
      ) : (
        <>
          <Pressable
            onPress={() => setEnabled((v) => !v)}
            accessibilityRole="switch"
            accessibilityState={{ checked: enabled }}
            accessibilityLabel={t('dashboard.remindersScreen.enableAlert')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 10,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ ...T.body, color: C.text }}>{t('dashboard.remindersScreen.enableAlert')}</Text>
            <View style={{
              width: 44,
              height: 26,
              borderRadius: 13,
              backgroundColor: enabled ? C.accent : C.border,
              padding: 2,
              justifyContent: 'center',
              alignItems: enabled ? 'flex-end' : 'flex-start',
            }}>
              <View style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: C.surface,
              }} />
            </View>
          </Pressable>

          <View style={{ gap: 8 }}>
            <Text style={{ ...T.helper, color: C.muted }}>
              {t('dashboard.remindersScreen.leadDaysLabel')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LEAD_OPTIONS.map((days) => {
                const selected = leadDays === days;
                return (
                  <Pressable
                    key={days}
                    onPress={() => setLeadDays(days)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t('dashboard.remindersScreen.leadDaysOption', { days })}
                    style={({ pressed, hovered }) => ({
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: R.pill,
                      borderWidth: 1,
                      borderColor: selected ? C.accent : C.border,
                      backgroundColor: selected
                        ? C.chipSelectedBg
                        : pressed || hovered
                          ? C.overlayHover
                          : C.surface,
                    })}
                  >
                    <Text style={{
                      fontSize: 13,
                      fontWeight: selected ? '600' : '500',
                      color: selected ? C.primary : C.muted,
                    }}>
                      {t('dashboard.remindersScreen.leadDaysOption', { days })}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      )}

      <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
        <OutlineButton onPress={onCancel} disabled={saving}>
          {t('common.cancel')}
        </OutlineButton>
        <PrimaryButton onPress={handleSave} disabled={saving || !hasDate}>
          {t('common.save')}
        </PrimaryButton>
      </View>
    </View>
  );
}
