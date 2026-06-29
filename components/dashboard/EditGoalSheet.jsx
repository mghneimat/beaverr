import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, T } from '../../constants/onboarding-theme';
import FormInput from '../ui/FormInput';
import PrimaryButton from '../ui/PrimaryButton';
import OutlineButton from '../ui/OutlineButton';
import GoalDeadlineFields from './GoalDeadlineFields';
import DashboardScrollSheet from './DashboardScrollSheet';
import { saveGoalEdits } from '../../lib/goals/goalCrud';
import { startOfToday } from '../../lib/goals/goalFundingSchedule';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import { parseAmount, amountToString } from '../../lib/sectionEditStorage';

export default function EditGoalSheet({ visible, goal, currency, onClose }) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [deadlineMode, setDeadlineMode] = useState('none');
  const [endDate, setEndDate] = useState('');
  const [targetText, setTargetText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const minSelectableDate = useMemo(() => startOfToday(), []);

  const isDebtGoal = goal?.type === 'debt';
  const canEdit = goal
    && goal.type !== 'reduceCosts'
    && goal.lifecycleStatus !== 'archived';

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

  useEffect(() => {
    if (!visible || !goal) return;
    setName(goal.name || '');
    setDeadlineMode(goal.endDate?.trim() ? 'set' : 'none');
    setEndDate(goal.endDate || '');
    const target = isDebtGoal
      ? (Number(goal.startingPrincipal) || Number(goal.targetAmount) || 0)
      : (Number(goal.targetAmount) || 0);
    setTargetText(amountToString(target));
    setError('');
    setSaving(false);
    setDateDropdownOpen(false);
  }, [visible, goal, isDebtGoal]);

  const handleSave = async () => {
    if (!goal) return;
    const targetAmount = parseAmount(targetText);
    if (!name.trim()) {
      setError(t('dashboard.goalsScreen.create.validationName'));
      return;
    }
    if (!targetAmount || targetAmount <= 0) {
      setError(t('dashboard.goalsScreen.create.validationTarget'));
      return;
    }
    if (deadlineMode === 'set' && !endDate.trim()) {
      setError(t('dashboard.goalsScreen.setDeadline.validationDate'));
      return;
    }

    setSaving(true);
    setError('');
    try {
      const result = await saveGoalEdits(goal.id, {
        name: name.trim(),
        endDate: deadlineMode === 'set' ? endDate.trim() : null,
        targetAmount,
      });
      if (result.error === 'validation_name') {
        setError(t('dashboard.goalsScreen.create.validationName'));
        return;
      }
      if (result.error === 'validation_target') {
        setError(t('dashboard.goalsScreen.create.validationTarget'));
        return;
      }
      if (result.error) {
        setError(t('dashboard.goalsScreen.edit.saveError'));
        return;
      }
      notifyDashboardRefresh();
      onClose();
    } catch {
      setError(t('dashboard.goalsScreen.edit.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) return null;

  return (
    <DashboardScrollSheet
      visible={visible}
      onClose={onClose}
      closeA11yLabel={t('dashboard.goalsScreen.edit.closeA11y')}
      contentContainerStyle={dateDropdownOpen ? { paddingBottom: 240 } : undefined}
    >
      <Text style={{ ...T.cardTitle, marginBottom: 4 }}>
        {t('dashboard.goalsScreen.edit.title')}
      </Text>
      <Text style={{ ...T.caption, color: C.muted, marginBottom: 16 }}>
        {goal.autoCreated
          ? t('dashboard.goalsScreen.edit.autoNameHelper')
          : t('dashboard.goalsScreen.edit.helper')}
      </Text>

      <FormInput
        label={t('dashboard.goalsScreen.create.name')}
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError('');
        }}
        placeholder={t('dashboard.goalsScreen.create.namePlaceholder')}
      />

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

      <FormInput
        label={t(isDebtGoal ? 'dashboard.goalsScreen.totalDebt' : 'dashboard.goalsScreen.create.target')}
        value={targetText}
        onChangeText={(text) => {
          setTargetText(text);
          setError('');
        }}
        placeholder="0"
        numeric
        currency={currency}
      />

      {error && deadlineMode !== 'set' ? (
        <Text style={{ ...T.caption, color: C.danger, marginBottom: 12 }}>{error}</Text>
      ) : null}

      <View style={[footerStyle, { flexDirection: 'row', gap: 12, marginTop: 8 }]}>
        <View style={{ flex: 1 }}>
          <OutlineButton onPress={onClose} disabled={saving} destructive>
            {t('common.cancel')}
          </OutlineButton>
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton onPress={handleSave} disabled={saving}>
            {t('common.save')}
          </PrimaryButton>
        </View>
      </View>
    </DashboardScrollSheet>
  );
}
