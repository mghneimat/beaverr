import { useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { C, R } from '../../constants/onboarding-theme';

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/**
 * Generate an array of numbers from `start` to `end` inclusive.
 */
function range(start, end) {
  const arr = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}

/**
 * Get the number of days in a given month/year.
 */
function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

/**
 * A dropdown selector with a chevron indicator.
 * Opens a Modal-based overlay list positioned near the trigger.
 */
function Dropdown({ label, value, options, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const triggerRef = useRef(null);
  const [triggerLayout, setTriggerLayout] = useState(null);

  const displayValue = value != null ? String(value) : '';

  const handleOpen = () => {
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        setTriggerLayout({ x, y, width, height });
        setOpen(true);
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        ref={triggerRef}
        onPress={handleOpen}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: hovered ? C.bg : pressed ? C.addPressed : C.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 44,
        }}
      >
        <Text style={{
          fontSize: 14,
          color: displayValue ? C.text : C.placeholder,
          fontWeight: displayValue ? '500' : '400',
        }}>
          {displayValue || placeholder}
        </Text>
        <Text style={{ fontSize: 10, color: C.muted, marginLeft: 4 }}>▼</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        {/* Full-screen backdrop */}
        <Pressable
          style={{ flex: 1 }}
          onPress={() => setOpen(false)}
        >
          {/* Dropdown list positioned near the trigger */}
          {triggerLayout && (
            <View
              style={{
                position: 'absolute',
                top: triggerLayout.y + triggerLayout.height + 2,
                left: triggerLayout.x,
                width: triggerLayout.width,
                backgroundColor: C.surface,
                borderRadius: 12,
                maxHeight: 200,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: C.border,
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              }}
            >
              <ScrollView
                style={{ maxHeight: 200 }}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                {options.map((opt) => {
                  const isSelected = opt === value;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => { onSelect(opt); setOpen(false); }}
                      style={({ pressed: btnPressed }) => ({
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: isSelected
                          ? C.chipSelectedBg
                          : btnPressed
                            ? C.bg
                            : 'transparent',
                        borderBottomWidth: 1,
                        borderBottomColor: C.border,
                      })}
                    >
                      <Text style={{
                        fontSize: 14,
                        color: isSelected ? C.primary : C.text,
                        fontWeight: isSelected ? '600' : '400',
                      }}>
                        {label ? label(opt) : String(opt)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

/**
 * Reusable DatePicker with three dropdowns: Day, Month (full name), Year.
 *
 * @param {Object} props
 * @param {string} props.value - Current date value in "DD/MM/YYYY" or "MM/YYYY" format (or empty string)
 * @param {Function} props.onChange - Called with the new date string
 * @param {boolean} [props.showDay=true] - Whether to show the day dropdown (false for month/year only)
 * @param {number} [props.yearStart] - Start year for the year dropdown (default: current year - 10)
 * @param {number} [props.yearEnd] - End year for the year dropdown (default: current year + 10)
 */
export default function DatePicker({
  value,
  onChange,
  showDay = true,
  yearStart,
  yearEnd,
}) {
  const { t } = useI18n();

  const now = new Date();
  const currentYear = now.getFullYear();
  const startYear = yearStart ?? currentYear - 10;
  const endYear = yearEnd ?? currentYear + 10;

  // Parse current value
  let day = null;
  let month = null;
  let year = null;

  if (value) {
    const parts = value.split('/');
    if (showDay && parts.length === 3) {
      day = parseInt(parts[0], 10) || null;
      month = parseInt(parts[1], 10) || null;
      year = parseInt(parts[2], 10) || null;
    } else if (parts.length === 2) {
      month = parseInt(parts[0], 10) || null;
      year = parseInt(parts[1], 10) || null;
    }
  }

  const days = range(1, 31);
  const years = range(startYear, endYear);

  // Month options with full name labels
  const monthOptions = MONTHS.map((m, idx) => ({
    value: idx + 1,
    label: t(`common.months.${m}`),
  }));

  const handleDaySelect = (d) => {
    const maxDay = month && year ? daysInMonth(month, year) : 31;
    const clampedDay = Math.min(d, maxDay);
    const dayStr = String(clampedDay).padStart(2, '0');
    const monthStr = month ? String(month).padStart(2, '0') : '';
    const yearStr = year ? String(year) : '';
    if (showDay) {
      onChange(`${dayStr}/${monthStr}/${yearStr}`);
    } else {
      onChange(`${monthStr}/${yearStr}`);
    }
  };

  const handleMonthSelect = (m) => {
    const monthStr = String(m).padStart(2, '0');
    const yearStr = year ? String(year) : '';
    // Clamp day if needed
    const maxDay = daysInMonth(m, year || currentYear);
    const clampedDay = day ? Math.min(day, maxDay) : null;
    const dayStr = clampedDay ? String(clampedDay).padStart(2, '0') : '';
    if (showDay) {
      onChange(`${dayStr}/${monthStr}/${yearStr}`);
    } else {
      onChange(`${monthStr}/${yearStr}`);
    }
  };

  const handleYearSelect = (y) => {
    const yearStr = String(y);
    const monthStr = month ? String(month).padStart(2, '0') : '';
    // Clamp day for Feb in leap years etc.
    const maxDay = month ? daysInMonth(month, y) : 31;
    const clampedDay = day ? Math.min(day, maxDay) : null;
    const dayStr = clampedDay ? String(clampedDay).padStart(2, '0') : '';
    if (showDay) {
      onChange(`${dayStr}/${monthStr}/${yearStr}`);
    } else {
      onChange(`${monthStr}/${yearStr}`);
    }
  };

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {showDay && (
        <Dropdown
          value={day}
          options={days}
          onSelect={handleDaySelect}
          placeholder={t('common.datePicker.day')}
        />
      )}
      <Dropdown
        value={month}
        options={monthOptions.map(m => m.value)}
        label={(v) => t(`common.months.${MONTHS[v - 1]}`)}
        onSelect={handleMonthSelect}
        placeholder={t('common.datePicker.month')}
      />
      <Dropdown
        value={year}
        options={years}
        onSelect={handleYearSelect}
        placeholder={t('common.datePicker.year')}
      />
    </View>
  );
}
