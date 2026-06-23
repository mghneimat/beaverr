import { useState, useCallback } from 'react';
import { View, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, S, T } from '../../constants/onboarding-theme';
import InputGroup from './InputGroup';
import SplitDateFields from './SplitDateFields';
import LabeledInput from './LabeledInput';

function resolveKeys(prefix) {
  if (!prefix) {
    return { endDate: 'endDate', dueDate: 'dueDate', chargeDay: 'chargeDay' };
  }
  return {
    endDate: `${prefix}EndDate`,
    dueDate: `${prefix}DueDate`,
    chargeDay: `${prefix}ChargeDay`,
  };
}

function elevatedSectionStyle(open) {
  if (!open) return { overflow: 'visible' };
  return {
    zIndex: 200,
    elevation: 12,
    overflow: 'visible',
    ...(Platform.OS === 'web' ? { position: 'relative' } : null),
  };
}

function loweredSectionStyle(activeAbove) {
  if (!activeAbove) return undefined;
  return {
    zIndex: 1,
    ...(Platform.OS === 'web' ? { position: 'relative' } : null),
  };
}

/**
 * Optional end date, payment day, and next payment date — shared across onboarding and section edit.
 */
export default function OptionalPaymentDatesFields({
  values = {},
  onChange,
  prefix,
  compact = false,
  style,
}) {
  const { t } = useI18n();
  const keys = resolveKeys(prefix);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  const handleEndElevatedChange = useCallback((open) => {
    setEndDateOpen(open);
  }, []);

  const handleDueElevatedChange = useCallback((open) => {
    setDueDateOpen(open);
  }, []);

  const update = (key, value) => onChange?.({ [key]: value });

  const sectionGap = compact ? 12 : S.fieldGap;

  return (
    <View style={[{ marginTop: compact ? 0 : 4, marginBottom: compact ? 12 : 16, overflow: 'visible' }, style]}>
      {!compact ? (
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
          {t('dashboard.expensesScreen.dates.optionalHint')}
        </Text>
      ) : null}

      <InputGroup
        label={t('dashboard.expensesScreen.dates.endDate')}
        optional
        style={{
          marginBottom: sectionGap,
          ...elevatedSectionStyle(endDateOpen),
        }}
      >
        <SplitDateFields
          value={values[keys.endDate] || ''}
          onChange={(v) => update(keys.endDate, v)}
          showDay
          inGroup
          onElevatedChange={handleEndElevatedChange}
        />
      </InputGroup>

      <InputGroup
        label={t('dashboard.expensesScreen.dates.paymentDay')}
        optional
        style={{
          marginBottom: sectionGap,
          ...loweredSectionStyle(endDateOpen || dueDateOpen),
        }}
      >
        <LabeledInput
          value={values[keys.chargeDay] != null ? String(values[keys.chargeDay]) : ''}
          onChangeText={(v) => update(keys.chargeDay, v.replace(/[^0-9]/g, ''))}
          numeric
          placeholder={t('dashboard.expensesScreen.dates.paymentDayPlaceholder')}
          large
          inGroup
        />
      </InputGroup>

      <InputGroup
        label={t('dashboard.expensesScreen.dates.nextPaymentDate')}
        optional
        style={{
          marginBottom: compact ? 0 : sectionGap,
          ...elevatedSectionStyle(dueDateOpen),
          ...loweredSectionStyle(endDateOpen && !dueDateOpen),
        }}
      >
        <SplitDateFields
          value={values[keys.dueDate] || ''}
          onChange={(v) => update(keys.dueDate, v)}
          showDay
          inGroup
          onElevatedChange={handleDueElevatedChange}
        />
      </InputGroup>
    </View>
  );
}
