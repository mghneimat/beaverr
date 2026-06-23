import {
  forwardRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
} from 'react';
import { View, Pressable, Platform } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { isoDateKey } from '../../../lib/dailyLog';
import { missingDaysInCycle, isCycleBackfillPending } from '../../../lib/budgetCycle';
import { emitDashboardToast } from '../../../lib/dashboardToast';
import {
  WEEKDAY_KEYS,
  buildMonthGrid,
  formatMonthYearLabel,
  shiftCalendarMonth,
  monthIndexFromIso,
} from '../../../lib/cycleCalendarGrid';
import { C, R, T } from '../../../constants/onboarding-theme';
import LucideStrokeIcon from '../../app/LucideStrokeIcon';
import { CIRCLE_ALERT_NODES, CIRCLE_CHECK_NODES } from '../../app/lucidePaths';
import SurfaceCard from '../../ui/SurfaceCard';
import AnimatedCollapse from '../AnimatedCollapse';
import { DASHBOARD_MOTION_DURATION, DASHBOARD_MOTION_EASE } from '../../../lib/dashboardMotion';
import { useReducedMotion } from '../../../lib/useReducedMotion';
import SpendLogSheet from './SpendLogSheet';
import EditCycleStartSheet from './EditCycleStartSheet';
import CycleDayEntryTable from './CycleDayEntryTable';

const CELL_SIZE = 40;
const CYCLE_START_SHIFT_PX = 28;

/** Slides the calendar when the cycle-start row expands or collapses above it. */
function CycleCalendarBody({ showCycleStart, children }) {
  const reduceMotion = useReducedMotion();
  const shiftY = useSharedValue(0);
  const layoutTransition = reduceMotion || Platform.OS === 'web'
    ? undefined
    : LinearTransition.duration(DASHBOARD_MOTION_DURATION);

  useEffect(() => {
    if (reduceMotion) return;
    shiftY.value = showCycleStart ? -CYCLE_START_SHIFT_PX : CYCLE_START_SHIFT_PX;
    shiftY.value = withTiming(0, {
      duration: DASHBOARD_MOTION_DURATION,
      easing: DASHBOARD_MOTION_EASE,
    });
  }, [showCycleStart, reduceMotion, shiftY]);

  const shiftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Platform.OS === 'web' ? shiftY.value : 0 }],
  }));

  if (reduceMotion) {
    return <View>{children}</View>;
  }

  return (
    <Animated.View layout={layoutTransition} style={shiftStyle}>
      {children}
    </Animated.View>
  );
}

function formatCycleStartLabel(isoDate, locale) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return new Date(y, m - 1, d).toLocaleDateString(tag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * @param {import('../../../lib/cycleCalendarGrid').CycleCalendarDayCell} cell
 * @param {boolean} selected
 */
function cellStyles(cell, selected) {
  if (cell.kind === 'empty') {
    return { opacity: 0 };
  }

  if (selected) {
    return {
      backgroundColor: C.primary,
      borderColor: C.primary,
      opacity: 1,
      textColor: '#FFFFFF',
    };
  }

  if (cell.kind === 'locked') {
    return {
      backgroundColor: C.pillUnselectedBg,
      borderColor: C.border,
      opacity: 0.62,
      textColor: C.muted,
    };
  }

  if (cell.kind === 'outside') {
    return {
      backgroundColor: C.pillUnselectedBg,
      borderColor: C.border,
      opacity: 0.55,
      textColor: C.muted,
    };
  }

  if (cell.kind === 'unset') {
    if (cell.isToday && !selected) {
      return {
        backgroundColor: C.surfaceTint,
        borderColor: C.cycleWarning,
        opacity: 1,
        textColor: C.text,
      };
    }
    return {
      backgroundColor: C.heroWarningBg,
      borderColor: C.heroWarningBorder,
      opacity: 1,
      textColor: C.heroWarningValue,
    };
  }

  return {
    backgroundColor: C.heroIncomeBg,
    borderColor: C.heroIncomeBorder,
    opacity: 1,
    textColor: C.positive,
  };
}

/**
 * @param {boolean} locked
 * @param {string[]} unsetInCycle
 * @param {import('../../../lib/cycleCalendarGrid').CycleCalendarDayCell[]} unsetInView
 * @param {(key: string, params?: Record<string, string>) => string} t
 */
function buildLoggingStatus(locked, unsetInCycle, unsetInView, t) {
  if (locked) return null;

  if (unsetInCycle.length === 0) {
    return {
      variant: 'success',
      message: t('dashboard.cycles.calendar.status.allLogged'),
      showJump: false,
    };
  }

  return {
    variant: 'warning',
    message: t('dashboard.cycles.calendar.status.needsLogging', {
      count: String(unsetInCycle.length),
    }),
    showJump: unsetInView.length === 0,
  };
}

const CycleCalendar = forwardRef(function CycleCalendar(
  { activeCycle, dailyLogs, currency, budget },
  ref,
) {
  const { t, locale } = useI18n();
  const today = isoDateKey();
  const locked = !activeCycle;
  const now = new Date();

  const [viewYear, setViewYear] = useState(() => now.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [editStartOpen, setEditStartOpen] = useState(false);

  const unsetInCycle = useMemo(
    () => (activeCycle ? missingDaysInCycle(activeCycle, dailyLogs) : []),
    [activeCycle, dailyLogs],
  );

  const jumpToFirstUnset = useCallback(() => {
    if (unsetInCycle.length === 0) return;
    const { year, monthIndex } = monthIndexFromIso(unsetInCycle[0]);
    setViewYear(year);
    setViewMonth(monthIndex);
  }, [unsetInCycle]);

  const openSpendForDate = useCallback((isoDate) => {
    if (!isoDate || locked) return;
    const { year, monthIndex } = monthIndexFromIso(isoDate);
    setViewYear(year);
    setViewMonth(monthIndex);
    setSelectedDate(isoDate);
  }, [locked]);

  useImperativeHandle(ref, () => ({
    jumpToFirstUnset,
    openSpendForDate,
  }), [jumpToFirstUnset, openSpendForDate]);

  useEffect(() => {
    if (activeCycle?.startedAt) {
      const unset = missingDaysInCycle(activeCycle, dailyLogs);
      const focusIso = unset.length > 0 ? unset[0] : activeCycle.startedAt;
      const { year, monthIndex } = monthIndexFromIso(focusIso);
      setViewYear(year);
      setViewMonth(monthIndex);
    } else {
      const d = new Date();
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
    setSelectedDate(null);
  }, [activeCycle?.id, activeCycle?.startedAt]);

  const cells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth, {
      activeCycle,
      dailyLogs,
      todayIso: today,
    }),
    [viewYear, viewMonth, activeCycle, dailyLogs, today],
  );

  const unsetInView = useMemo(
    () => cells.filter((cell) => cell.kind === 'unset'),
    [cells],
  );

  const loggingStatus = useMemo(
    () => buildLoggingStatus(locked, unsetInCycle, unsetInView, t),
    [locked, unsetInCycle, unsetInView, t],
  );

  const backfillPending = useMemo(
    () => isCycleBackfillPending(activeCycle, dailyLogs),
    [activeCycle, dailyLogs],
  );

  const showCycleStart = Boolean(activeCycle?.startedAt);
  const monthLabel = formatMonthYearLabel(viewYear, viewMonth, locale);

  const handleDayPress = (cell) => {
    if (cell.kind === 'empty' || cell.kind === 'outside') return;

    if (locked || cell.kind === 'locked') {
      emitDashboardToast('cycleCalendarLocked');
      return;
    }

    if (cell.isoDate) {
      setSelectedDate(cell.isoDate);
    }
  };

  const handleShiftMonth = (delta) => {
    const next = shiftCalendarMonth(viewYear, viewMonth, delta);
    setViewYear(next.year);
    setViewMonth(next.monthIndex);
  };

  return (
    <>
      <SurfaceCard>
        <Text style={{ ...T.cardTitle }}>{t('dashboard.cycles.calendar.title')}</Text>
        <Text style={{ ...T.caption, color: C.muted, marginTop: 4, marginBottom: 8 }}>
          {locked
            ? t('dashboard.cycles.calendar.lockedHelper')
            : backfillPending
              ? t('dashboard.cycles.calendar.backfillHelper')
              : t('dashboard.cycles.calendar.helper')}
        </Text>

        <AnimatedCollapse visible={showCycleStart} fallbackHeight={36}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              gap: 12,
            }}
          >
            <Text style={{ ...T.caption, color: C.muted, flex: 1 }}>
              {activeCycle?.startedAt
                ? t('dashboard.cycles.calendar.cycleStartLabel', {
                    date: formatCycleStartLabel(activeCycle.startedAt, locale),
                  })
                : ' '}
            </Text>
            <Pressable
              onPress={() => setEditStartOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.cycles.calendar.editStartA11y')}
              style={({ pressed }) => ({
                paddingVertical: 4,
                paddingHorizontal: 2,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Text style={{ ...T.caption, color: C.accent, fontWeight: '600' }}>
                {t('dashboard.cycles.calendar.editStart')}
              </Text>
            </Pressable>
          </View>
        </AnimatedCollapse>

        <CycleCalendarBody showCycleStart={showCycleStart}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Pressable
            onPress={() => handleShiftMonth(-1)}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.cycles.calendar.prevMonthA11y')}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: C.primary }}>{'‹'}</Text>
          </Pressable>

          <Text style={{ ...T.helper, fontWeight: '600', color: C.text }}>
            {monthLabel}
          </Text>

          <Pressable
            onPress={() => handleShiftMonth(1)}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.cycles.calendar.nextMonthA11y')}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: C.primary }}>{'›'}</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          {WEEKDAY_KEYS.map((key) => (
            <View key={key} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 0.4,
                color: C.muted,
                textTransform: 'uppercase',
              }}
              >
                {t(`dashboard.cycles.calendar.weekdays.${key}`)}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((cell, index) => {
            if (cell.kind === 'empty') {
              return (
                <View
                  key={`empty-${index}`}
                  style={{ width: `${100 / 7}%`, alignItems: 'center', marginBottom: 8 }}
                >
                  <View style={{ width: CELL_SIZE, height: CELL_SIZE }} />
                </View>
              );
            }

            const selected = selectedDate === cell.isoDate;
            const styles = cellStyles(cell, selected);
            const tappable = cell.kind !== 'outside';
            const statusLabel = cell.kind === 'unset'
              ? t('dashboard.cycles.calendar.unset')
              : cell.kind === 'confirmed'
                ? t('dashboard.cycles.calendar.confirmed')
                : cell.kind === 'locked'
                  ? t('dashboard.cycles.calendar.lockedDay')
                  : t('dashboard.cycles.calendar.outside');

            return (
              <View
                key={cell.isoDate}
                style={{ width: `${100 / 7}%`, alignItems: 'center', marginBottom: 8 }}
              >
                <Pressable
                  onPress={() => handleDayPress(cell)}
                  disabled={cell.kind === 'outside'}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected,
                    disabled: cell.kind === 'outside',
                  }}
                  accessibilityLabel={t('dashboard.cycles.calendar.dayA11y', {
                    date: String(cell.dayOfMonth),
                    status: statusLabel,
                  })}
                  style={({ pressed, hovered }) => ({
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    borderRadius: CELL_SIZE / 2,
                    borderWidth: cell.isToday && !selected ? 2 : 1.5,
                    borderColor: cell.isToday && !selected ? C.primary : styles.borderColor,
                    backgroundColor: pressed && tappable
                      ? C.overlayPressed
                      : hovered && tappable
                        ? C.overlayHover
                        : styles.backgroundColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: styles.opacity,
                  })}
                >
                  <Text style={{
                    width: '100%',
                    fontSize: 14,
                    lineHeight: 14,
                    textAlign: 'center',
                    fontWeight: cell.isToday || selected ? '700' : '500',
                    color: styles.textColor,
                    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
                  }}
                  >
                    {cell.dayOfMonth}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {loggingStatus ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 4,
              marginBottom: 16,
            }}
          >
            <LucideStrokeIcon
              nodes={loggingStatus.variant === 'success' ? CIRCLE_CHECK_NODES : CIRCLE_ALERT_NODES}
              color={loggingStatus.variant === 'success' ? C.positive : C.cycleWarning}
              size={16}
              strokeWidth={2}
            />
            <Text style={{
              ...T.caption,
              flex: 1,
              fontWeight: '600',
              color: loggingStatus.variant === 'success' ? C.positive : C.cycleWarning,
            }}
            >
              {loggingStatus.message}
            </Text>
            {loggingStatus.showJump ? (
              <Pressable
                onPress={jumpToFirstUnset}
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.cycles.calendar.jumpToUnsetA11y')}
                style={({ pressed }) => ({
                  paddingVertical: 2,
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <Text style={{ ...T.caption, color: C.accent, fontWeight: '600' }}>
                  {t('dashboard.cycles.calendar.jumpToUnset')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {!locked ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 0 }}>
            {[
              { key: 'unset', color: C.heroWarningBorder, fill: C.heroWarningBg },
              { key: 'confirmed', color: C.heroIncomeBorder, fill: C.heroIncomeBg },
              { key: 'today', color: C.primary },
            ].map((item) => (
              <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  borderWidth: 1.5,
                  borderColor: item.color,
                  backgroundColor: item.fill || 'transparent',
                }}
                />
                <Text style={{ ...T.caption, color: C.muted }}>
                  {t(`dashboard.cycles.calendar.legend.${item.key}`)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        </CycleCalendarBody>

        {!locked && activeCycle ? (
          <AnimatedCollapse visible={Boolean(activeCycle)} fallbackHeight={280}>
            <CycleDayEntryTable
              activeCycle={activeCycle}
              dailyLogs={dailyLogs}
              currency={currency}
              unsetCount={unsetInCycle.length}
              onRowPress={setSelectedDate}
            />
          </AnimatedCollapse>
        ) : null}
      </SurfaceCard>

      <SpendLogSheet
        visible={Boolean(selectedDate) && !locked}
        onClose={() => setSelectedDate(null)}
        isoDate={selectedDate}
        cycleId={activeCycle?.id}
        currency={currency}
      />

      <EditCycleStartSheet
        visible={editStartOpen}
        onClose={() => setEditStartOpen(false)}
        cycle={activeCycle}
        budget={budget}
      />
    </>
  );
});

export default CycleCalendar;
