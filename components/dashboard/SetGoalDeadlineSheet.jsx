import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { setGoalDeadline } from '../../lib/goals/goalCrud';
import { startOfToday } from '../../lib/goals/goalFundingSchedule';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import { C, T } from '../../constants/onboarding-theme';
import PrimaryButton from '../ui/PrimaryButton';
import OutlineButton from '../ui/OutlineButton';
import GoalDeadlineFields from './GoalDeadlineFields';
import DashboardScrollSheet from './DashboardScrollSheet';

export default function SetGoalDeadlineSheet({ visible, goal, onClose }) {
  const { t } = useI18n();
  const [deadlineMode, setDeadlineMode] = useState('none');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const minSelectableDate = useMemo(() => startOfToday(), []);

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

  const canSet = goal
    && goal.type !== 'reduceCosts'
    && goal.lifecycleStatus !== 'archived'
    && goal.lifecycleStatus !== 'completed';

  useEffect(() => {
    if (!visible || !goal) return;
    setDeadlineMode(goal.endDate?.trim() ? 'set' : 'none');
    setEndDate(goal.endDate || '');
    setError('');
    setSaving(false);
    setDateDropdownOpen(false);
  }, [visible, goal]);

  const handleSave = async () => {
    if (!goal) return;
    if (deadlineMode === 'set' && !endDate.trim()) {
      setError(t('dashboard.goalsScreen.setDeadline.validationDate'));
      return;
    }

    setSaving(true);
    setError('');
    try {
      const result = await setGoalDeadline(
        goal.id,
        deadlineMode === 'set' ? endDate : null,
      );
      if (result.error === 'invalid_date') {
        setError(t('dashboard.goalsScreen.setDeadline.validationDate'));
        return;
      }
      if (result.error) {
        setError(t('dashboard.goalsScreen.setDeadline.saveError'));
        return;
      }
      notifyDashboardRefresh();
      onClose();
    } catch {
      setError(t('dashboard.goalsScreen.setDeadline.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!canSet) return null;

  return (
    <DashboardScrollSheet
      visible={visible}
      onClose={onClose}
      closeA11yLabel={t('dashboard.goalsScreen.setDeadline.closeA11y')}
      contentContainerStyle={dateDropdownOpen ? { paddingBottom: 240 } : undefined}
    >
      <Text style={{ ...T.cardTitle, marginBottom: 4 }}>
        {t('dashboard.goalsScreen.setDeadline.title')}
      </Text>
      <Text style={{ ...T.caption, color: C.muted, marginBottom: 16 }}>
        {t('dashboard.goalsScreen.setDeadline.subtitle', { name: goal.name })}
      </Text>
      <GoalDeadlineFields
        mode={deadlineMode}
        onModeChange={(mode) => {
          setDeadlineMode(mode);
          setError('');
        }}
        endDate={endDate}
        onEndDateChange={(value) => {
          setEndDate(value);
          setError('');
        }}
        minSelectableDate={minSelectableDate}
        onElevatedChange={handleDateElevatedChange}
        errorText={error && deadlineMode === 'set' ? error : undefined}
        sectionStyle={dateSectionStyle}
      />
      <View style={footerStyle}>
        {error && deadlineMode !== 'set' ? (
          <Text style={{ ...T.caption, color: C.danger, marginBottom: 12 }}>{error}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <OutlineButton onPress={onClose} disabled={saving}>
              {t('common.cancel')}
            </OutlineButton>
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton onPress={handleSave} disabled={saving}>
              {t('common.save')}
            </PrimaryButton>
          </View>
        </View>
      </View>
    </DashboardScrollSheet>
  );
}
