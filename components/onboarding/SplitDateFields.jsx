import { useState, useEffect, useMemo, useCallback, useRef, useContext } from 'react';
import { View, Platform } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { S } from '../../constants/onboarding-theme';
import DatePartDropdown from './DatePartDropdown';
import FieldError from './FieldError';
import { DropdownElevateContext } from './InputGroup';
import { useClearOnboardingValidation } from '../../lib/onboardingValidationClear';
import {
  parseStoredDate,
  buildStoredDateFromParts,
  daysInMonth,
  getMonthLabel,
  getMonthOptions,
  buildTargetYearOptions,
} from '../../lib/datePicker';
import { isMobileWebTouch } from '../../lib/isMobileWebTouch';

function clampDay(dayStr, monthStr, yearStr) {
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  if (!day || !month || !year) return dayStr;
  const max = daysInMonth(month, year);
  return day > max ? String(max) : dayStr;
}

/**
 * Day / month / year dropdowns — stores DD/MM/YYYY or MM/YYYY when showDay is false.
 */
export default function SplitDateFields({
  value,
  onChange,
  yearEnd,
  yearPast = 5,
  inGroup = false,
  errorText,
  showDay = true,
  onElevatedChange,
  minSelectableDate,
}) {
  const { t } = useI18n();
  const setElevated = useContext(DropdownElevateContext);
  const clearValidation = useClearOnboardingValidation();
  const [focusedCount, setFocusedCount] = useState(0);
  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  const { options: yearOptions, yearStart: startYear, yearEnd: endYear, currentYear } = useMemo(
    () => buildTargetYearOptions({ yearEnd, pastYears: yearPast }),
    [yearEnd, yearPast],
  );

  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    const parsed = parseStoredDate(value, showDay);
    setDay(parsed.day ? String(parsed.day) : '');
    setMonth(parsed.month ? String(parsed.month) : '');
    setYear(parsed.year ? String(parsed.year) : '');
  }, [value, showDay]);

  const monthOptions = useMemo(() => getMonthOptions(t), [t]);

  const dayOptions = useMemo(() => {
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    const maxDay = monthNum && yearNum ? daysInMonth(monthNum, yearNum) : 31;
    let minDay = 1;
    if (minSelectableDate && monthNum && yearNum) {
      const minYear = minSelectableDate.getFullYear();
      const minMonth = minSelectableDate.getMonth() + 1;
      if (yearNum < minYear || (yearNum === minYear && monthNum < minMonth)) {
        return [];
      }
      if (yearNum === minYear && monthNum === minMonth) {
        minDay = minSelectableDate.getDate();
      }
    }
    return Array.from({ length: maxDay }, (_, i) => {
      const d = String(i + 1);
      if (parseInt(d, 10) < minDay) return null;
      return { value: d, label: d };
    }).filter(Boolean);
  }, [month, year, minSelectableDate]);

  const handlePartFocusChange = useCallback((focused) => {
    const apply = () => {
      setFocusedCount((count) => Math.max(0, count + (focused ? 1 : -1)));
    };
    if (Platform.OS === 'web' && isMobileWebTouch() && focused) {
      requestAnimationFrame(apply);
      return;
    }
    apply();
  }, []);

  useEffect(() => {
    const skipElevate = Platform.OS === 'web';
    setElevated?.(focusedCount > 0);
    if (!skipElevate) {
      onElevatedChange?.(focusedCount > 0);
    }
    return () => {
      setElevated?.(false);
      if (!skipElevate) {
        onElevatedChange?.(false);
      }
    };
  }, [focusedCount, setElevated, onElevatedChange]);

  const mobileWeb = isMobileWebTouch();
  const dayFlex = mobileWeb && showDay ? 0.75 : 1;
  const monthFlex = mobileWeb ? 1.35 : 1;
  const yearFlex = mobileWeb ? 0.9 : 1;

  const emit = (d, m, y) => {
    if (errorText) {
      clearValidation?.();
    }
    const stored = buildStoredDateFromParts(d, m, y, {
      yearStart: startYear,
      yearEnd: endYear,
      showDay,
    });
    onChange(stored ?? '');
  };

  const handleDay = (next) => {
    setDay(next);
    emit(next, month, year);
  };

  const handleMonth = (next) => {
    setMonth(next);
    if (showDay) {
      const clampedDay = clampDay(day, next, year);
      if (clampedDay !== day) setDay(clampedDay);
      emit(clampedDay, next, year);
      return;
    }
    emit('', next, year);
  };

  const handleYear = (next) => {
    setYear(next);
    if (showDay) {
      const clampedDay = clampDay(day, month, next);
      if (clampedDay !== day) setDay(clampedDay);
      emit(clampedDay, month, next);
      return;
    }
    emit('', month, next);
  };

  const monthDisplay = month ? getMonthLabel(parseInt(month, 10), t) : '';
  const invalid = Boolean(errorText);
  const showError = invalid && focusedCount === 0;
  const dropdownOpen = focusedCount > 0;
  const elevateRow = dropdownOpen && Platform.OS !== 'web';

  return (
    <View style={{ marginBottom: inGroup ? 0 : S.fieldGap, overflow: 'visible' }}>
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          overflow: 'visible',
          zIndex: elevateRow ? 200 : 1,
          ...(elevateRow && Platform.OS === 'web' ? { position: 'relative' } : null),
        }}
      >
        {showDay ? (
          <DatePartDropdown
            ref={dayRef}
            focusNextRef={monthRef}
            label={t('common.datePicker.day')}
            value={day}
            placeholder={t('common.datePicker.placeholderDay')}
            options={dayOptions}
            onSelect={handleDay}
            onFocusChange={handlePartFocusChange}
            partKind="day"
            numeric
            maxLength={2}
            flex={dayFlex}
            inGroup={inGroup}
            invalid={invalid}
            accessibilityLabel={t('common.datePicker.day')}
          />
        ) : null}
        <DatePartDropdown
          ref={monthRef}
          focusPrevRef={showDay ? dayRef : undefined}
          focusNextRef={yearRef}
          label={t('common.datePicker.month')}
          value={month}
          displayValue={monthDisplay}
          placeholder={t('common.datePicker.placeholderMonth')}
          options={monthOptions}
          onSelect={handleMonth}
          onFocusChange={handlePartFocusChange}
          partKind="month"
          flex={monthFlex}
          inGroup={inGroup}
          invalid={invalid}
          accessibilityLabel={t('common.datePicker.month')}
        />
        <DatePartDropdown
          ref={yearRef}
          focusPrevRef={monthRef}
          label={t('common.datePicker.year')}
          value={year}
          placeholder={t('common.datePicker.placeholderYear')}
          options={yearOptions}
          onSelect={handleYear}
          onFocusChange={handlePartFocusChange}
          partKind="year"
          numeric
          numericMin={startYear}
          numericMax={endYear}
          highlightDefaultValue={currentYear}
          maxLength={4}
          flex={yearFlex}
          inGroup={inGroup}
          invalid={invalid}
          accessibilityLabel={t('common.datePicker.year')}
        />
      </View>
      {showError ? <FieldError message={errorText} style={{ marginTop: 8 }} /> : null}
    </View>
  );
}
