import { useState, useCallback, useEffect } from 'react';
import { View, Modal, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { updateActiveCycleStartDate } from '../../../lib/cycleEdit';
import { storedDateToIso, isoToStoredDate } from '../../../lib/cycleDates';
import { isoDateKey } from '../../../lib/dailyLog';
import { notifyDashboardRefresh } from '../../../lib/dashboardRefresh';
import { emitDashboardToast } from '../../../lib/dashboardToast';
import { C, R, T } from '../../../constants/onboarding-theme';
import SplitDateFields from '../../onboarding/SplitDateFields';
import PrimaryButton from '../../ui/PrimaryButton';

export default function EditCycleStartSheet({
  visible,
  onClose,
  cycle,
  budget,
}) {
  const { t } = useI18n();
  const [startDate, setStartDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  useEffect(() => {
    if (!visible || !cycle?.startedAt) return;
    setStartDate(isoToStoredDate(cycle.startedAt));
    setErrorText('');
  }, [visible, cycle?.startedAt]);

  const handleDateElevatedChange = useCallback((open) => {
    setDateDropdownOpen(open);
  }, []);

  const dateSectionStyle = dateDropdownOpen
    ? {
        zIndex: 200,
        elevation: 12,
        overflow: 'visible',
        ...(Platform.OS === 'web' ? { position: 'relative' } : null),
      }
    : { overflow: 'visible' };

  const footerStyle = dateDropdownOpen
    ? {
        zIndex: 1,
        ...(Platform.OS === 'web' ? { position: 'relative' } : null),
      }
    : undefined;

  const handleSave = async () => {
    const startedAtIso = storedDateToIso(startDate);
    if (!startedAtIso) {
      setErrorText(t('dashboard.cycles.editStart.validationDate'));
      return;
    }
    if (startedAtIso > isoDateKey()) {
      setErrorText(t('dashboard.cycles.editStart.validationFuture'));
      return;
    }

    setSaving(true);
    setErrorText('');
    try {
      await updateActiveCycleStartDate({
        cycleId: cycle.id,
        startedAt: startedAtIso,
        budget: budget || {},
      });
      notifyDashboardRefresh();
      emitDashboardToast('cycleStartUpdated');
      onClose();
    } catch (err) {
      const key = err?.message;
      if (key === 'validationDate') {
        setErrorText(t('dashboard.cycles.editStart.validationDate'));
      } else if (key === 'validationFuture') {
        setErrorText(t('dashboard.cycles.editStart.validationFuture'));
      } else {
        setErrorText(t('dashboard.cycles.editStart.saveError'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (!cycle) return null;

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
          accessibilityLabel={t('dashboard.cycles.editStart.closeA11y')}
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
            overflow: 'visible',
            ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
          }}
        >
          <Text style={{ ...T.cardTitle, marginBottom: 8 }}>
            {t('dashboard.cycles.editStart.title')}
          </Text>
          <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
            {t('dashboard.cycles.editStart.helper')}
          </Text>

          <View style={dateSectionStyle}>
            <SplitDateFields
              value={startDate}
              onChange={setStartDate}
              yearPast={2}
              errorText={errorText}
              onElevatedChange={handleDateElevatedChange}
            />
          </View>

          <View style={footerStyle}>
            <PrimaryButton
              onPress={handleSave}
              disabled={saving}
              accessibilityState={{ busy: saving }}
              style={{ marginTop: 16 }}
            >
              {saving ? t('dashboard.cycles.editStart.saving') : t('common.save')}
            </PrimaryButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}
