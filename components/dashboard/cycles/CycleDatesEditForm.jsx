import { useState, useCallback, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { updateClosedCycleDates } from '../../../lib/cycleEdit';
import { storedDateToIso, isoToStoredDate } from '../../../lib/cycleDates';
import { notifyDashboardRefresh } from '../../../lib/dashboardRefresh';
import { emitDashboardToast } from '../../../lib/dashboardToast';
import { C, T } from '../../../constants/onboarding-theme';
import SplitDateFields from '../../onboarding/SplitDateFields';
import PrimaryButton from '../../ui/PrimaryButton';
import { OutlineButton } from '../../ui/OutlineButton';

/**
 * Inline / sheet form for editing closed cycle start and end dates.
 */
export default function CycleDatesEditForm({
  cycle,
  budget,
  dailyLogs = [],
  cycleAdjustments = [],
  onDone,
  onCancel,
  showIntro = false,
}) {
  const { t } = useI18n();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  useEffect(() => {
    if (!cycle) return;
    setStartDate(cycle.startedAt ? isoToStoredDate(cycle.startedAt) : '');
    setEndDate(cycle.closedAt ? isoToStoredDate(cycle.closedAt) : '');
    setErrorText('');
  }, [cycle?.id, cycle?.startedAt, cycle?.closedAt, cycle]);

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

  const validationMessage = (key) => {
    switch (key) {
      case 'validationDate':
        return t('dashboard.cycles.editDates.validationStartDate');
      case 'validationFuture':
        return t('dashboard.cycles.editDates.validationStartFuture');
      case 'validationEndDate':
        return t('dashboard.cycles.editDates.validationEndDate');
      case 'validationEndBeforeStart':
        return t('dashboard.cycles.editDates.validationEndBeforeStart');
      case 'validationEndFuture':
        return t('dashboard.cycles.editDates.validationEndFuture');
      default:
        return t('dashboard.cycles.editDates.saveError');
    }
  };

  const handleSave = async () => {
    const startedAtIso = storedDateToIso(startDate);
    const closedAtIso = storedDateToIso(endDate);
    if (!startedAtIso || !closedAtIso) {
      setErrorText(t('dashboard.cycles.editDates.validationEndDate'));
      return;
    }

    setSaving(true);
    setErrorText('');
    try {
      await updateClosedCycleDates({
        cycleId: cycle.id,
        startedAt: startedAtIso,
        closedAt: closedAtIso,
        dailyLogs,
        budget: budget || {},
        cycleAdjustments,
      });
      notifyDashboardRefresh();
      emitDashboardToast('cycleDatesUpdated');
      onDone?.();
    } catch (err) {
      setErrorText(validationMessage(err?.message));
    } finally {
      setSaving(false);
    }
  };

  if (!cycle) return null;

  return (
    <View style={dateDropdownOpen ? { paddingBottom: 120 } : undefined}>
      {showIntro ? (
        <>
          <Text style={{ ...T.cardTitle, marginBottom: 8 }}>
            {t('dashboard.cycles.editDates.title')}
          </Text>
          <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
            {t('dashboard.cycles.editDates.helper')}
          </Text>
        </>
      ) : (
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
          {t('dashboard.cycles.editDates.helper')}
        </Text>
      )}

      <View style={dateSectionStyle}>
        <Text style={{ ...T.caption, color: C.muted, fontWeight: '600', marginBottom: 8 }}>
          {t('dashboard.cycles.editDates.startLabel')}
        </Text>
        <SplitDateFields
          value={startDate}
          onChange={(next) => {
            setStartDate(next);
            setErrorText('');
          }}
          yearPast={3}
          onElevatedChange={handleDateElevatedChange}
        />
      </View>

      <View style={[dateSectionStyle, { marginTop: 16 }]}>
        <Text style={{ ...T.caption, color: C.muted, fontWeight: '600', marginBottom: 8 }}>
          {t('dashboard.cycles.editDates.endLabel')}
        </Text>
        <SplitDateFields
          value={endDate}
          onChange={(next) => {
            setEndDate(next);
            setErrorText('');
          }}
          yearPast={3}
          onElevatedChange={handleDateElevatedChange}
        />
      </View>

      {errorText ? (
        <Text style={{ ...T.caption, color: C.danger, marginTop: 12 }}>{errorText}</Text>
      ) : null}

      <View style={{
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        justifyContent: 'flex-end',
      }}
      >
        {onCancel ? (
          <OutlineButton onPress={onCancel} disabled={saving}>
            {t('common.cancel')}
          </OutlineButton>
        ) : null}
        <PrimaryButton
          onPress={handleSave}
          disabled={saving}
          accessibilityState={{ busy: saving }}
        >
          {saving ? t('dashboard.cycles.editDates.saving') : t('common.save')}
        </PrimaryButton>
      </View>
    </View>
  );
}
