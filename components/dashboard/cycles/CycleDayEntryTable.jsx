import { useEffect, useMemo, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { formatCurrency } from '../../../lib/finance';
import { ledgerColumnMinWidth, useBreakdownTableColumns } from '../../../lib/dashboardLayout';
import {
  buildCycleDayLedgerSummary,
  buildCycleDayRows,
  formatWeekRangeLabel,
  groupCycleDayRowsByWeek,
} from '../../../lib/cycleDayLedger';
import { C, R, T, tabularNums } from '../../../constants/onboarding-theme';
import { BreakdownCell, BreakdownRow, LedgerCardRow } from '../BreakdownTablePrimitives';
import AnimatedResize from '../AnimatedResize';

function formatTableDate(isoDate, locale, isToday, t) {
  if (isToday) return t('dashboard.cycles.calendar.legend.today');
  const [y, m, d] = isoDate.split('-').map(Number);
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return new Date(y, m - 1, d).toLocaleDateString(tag, {
    day: 'numeric',
    month: 'short',
  });
}

function pillRowColors({ index, pressed, hovered }) {
  const striped = index % 2 === 1;
  let bg = striped ? C.breakdownStripeBg : 'transparent';
  if (pressed || hovered) bg = C.breakdownRowHover;
  return { bg, label: C.text };
}

function CycleDayPillRow({ row, index, locale, currency, onPress, t, amountColMinW }) {
  const dateLabel = formatTableDate(row.isoDate, locale, row.isToday, t);
  const unset = row.status !== 'confirmed';
  const amountLabel = unset
    ? t('dashboard.cycles.calendar.entryTable.emptyAmount')
    : formatCurrency(row.spent ?? 0, currency);

  return (
    <Pressable
      onPress={() => onPress(row.isoDate)}
      accessibilityRole="button"
      accessibilityLabel={t('dashboard.cycles.calendar.entryTable.openA11y', { date: dateLabel })}
      style={({ pressed, hovered }) => {
        const colors = pillRowColors({
          index,
          pressed,
          hovered: Platform.OS === 'web' && hovered,
        });
        return {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 10,
          paddingHorizontal: 14,
          minHeight: 52,
          borderRadius: R.pill,
          backgroundColor: colors.bg,
          width: '100%',
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
          opacity: pressed ? 0.92 : 1,
        };
      }}
    >
      {({ pressed, hovered }) => {
        const colors = pillRowColors({
          index,
          pressed,
          hovered: Platform.OS === 'web' && hovered,
        });
        return (
          <>
            <BreakdownCell flex={1}>
              <Text style={{
                fontSize: 15,
                fontWeight: row.isToday ? '700' : '600',
                color: colors.label,
              }}
              numberOfLines={1}
              >
                {dateLabel}
              </Text>
            </BreakdownCell>
            <BreakdownCell minWidth={amountColMinW} align="right">
              {unset ? (
                <Text style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: C.cycleWarning,
                  textAlign: 'right',
                  ...tabularNums,
                }}
                >
                  {amountLabel}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: C.primary,
                    textAlign: 'right',
                    ...tabularNums,
                  }}
                >
                  {formatCurrency(row.spent ?? 0, currency)}
                </Text>
              )}
            </BreakdownCell>
          </>
        );
      }}
    </Pressable>
  );
}

function CycleDayColumnHeaders({ t, amountColMinW }) {
  return (
    <BreakdownRow style={{ paddingHorizontal: 14, marginBottom: 8, gap: 10 }}>
      <BreakdownCell flex={1}>
        <Text style={{
          fontSize: 11,
          fontWeight: '600',
          color: C.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
        >
          {t('dashboard.cycles.calendar.entryTable.columnDay')}
        </Text>
      </BreakdownCell>
      <BreakdownCell minWidth={amountColMinW} align="right">
        <Text style={{
          fontSize: 11,
          fontWeight: '600',
          color: C.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          textAlign: 'right',
        }}
        >
          {t('dashboard.cycles.calendar.entryTable.columnSpent')}
        </Text>
      </BreakdownCell>
    </BreakdownRow>
  );
}

export default function CycleDayEntryTable({
  activeCycle,
  dailyLogs,
  currency,
  unsetCount,
  onRowPress,
}) {
  const { t, locale } = useI18n();
  const { narrow, tableLayout } = useBreakdownTableColumns();
  const cardMode = tableLayout === 'card';
  const [pageIndex, setPageIndex] = useState(0);
  const amountColMinW = ledgerColumnMinWidth('amount', narrow);
  const dayColumns = useMemo(() => ([
    { key: 'name', label: t('dashboard.cycles.calendar.entryTable.columnDay') },
    { key: 'amount', label: t('dashboard.cycles.calendar.entryTable.columnSpent'), align: 'right' },
  ]), [t]);

  const rows = useMemo(
    () => buildCycleDayRows(activeCycle, dailyLogs),
    [activeCycle, dailyLogs],
  );

  const weeks = useMemo(() => groupCycleDayRowsByWeek(rows), [rows]);
  const summary = useMemo(() => buildCycleDayLedgerSummary(rows), [rows]);

  useEffect(() => {
    setPageIndex(0);
  }, [activeCycle?.id]);

  useEffect(() => {
    if (pageIndex >= weeks.length && weeks.length > 0) {
      setPageIndex(weeks.length - 1);
    }
  }, [pageIndex, weeks.length]);

  if (!activeCycle || rows.length === 0) return null;

  const currentWeek = weeks[pageIndex] ?? weeks[0];
  const visibleRows = currentWeek?.rows ?? [];
  const weekRangeLabel = currentWeek
    ? formatWeekRangeLabel(currentWeek.weekStart, currentWeek.weekEnd, locale)
    : '';
  const canGoOlder = pageIndex < weeks.length - 1;
  const canGoNewer = pageIndex > 0;

  return (
    <View style={{
      marginTop: 20,
      borderTopWidth: 1,
      borderTopColor: C.border,
      paddingTop: 16,
    }}
    >
      <Text style={{ ...T.caption, color: C.muted, marginBottom: 10, ...tabularNums }}>
        {t('dashboard.cycles.calendar.entryTable.summary', {
          logged: String(summary.loggedDays),
          total: String(summary.totalDays),
          spent: formatCurrency(summary.spentTotal, currency),
        })}
      </Text>

      <AnimatedResize
        fallbackHeight={visibleRows.length * 60 + 40 + (weeks.length > 1 ? 44 : 0) + (unsetCount > 0 ? 28 : 0)}
      >
        {unsetCount > 0 ? (
          <Text style={{ ...T.caption, color: C.cycleWarning, fontWeight: '600', marginBottom: 8 }}>
            {t('dashboard.cycles.calendar.entryTable.needsLogging', {
              count: String(unsetCount),
            })}
          </Text>
        ) : null}

        <View style={{ gap: 8, width: '100%' }}>
          {!cardMode ? <CycleDayColumnHeaders t={t} amountColMinW={amountColMinW} /> : null}
          {visibleRows.map((row, index) => {
            if (cardMode) {
              const dateLabel = formatTableDate(row.isoDate, locale, row.isToday, t);
              const unset = row.status !== 'confirmed';
              const amountLabel = unset
                ? t('dashboard.cycles.calendar.entryTable.emptyAmount')
                : formatCurrency(row.spent ?? 0, currency);
              return (
                <LedgerCardRow
                  key={row.isoDate}
                  columns={dayColumns}
                  cells={{ name: dateLabel, amount: amountLabel }}
                  index={index}
                  onPress={() => onRowPress(row.isoDate)}
                  accessibilityLabel={t('dashboard.cycles.calendar.entryTable.openA11y', { date: dateLabel })}
                  renderCell={(col) => {
                    if (col.key !== 'amount') return dateLabel;
                    if (unset) {
                      return (
                        <Text style={{
                          fontSize: 14,
                          fontWeight: '700',
                          color: C.cycleWarning,
                          textAlign: 'right',
                          ...tabularNums,
                        }}
                        >
                          {amountLabel}
                        </Text>
                      );
                    }
                    return (
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: C.primary,
                        textAlign: 'right',
                        ...tabularNums,
                      }}
                      >
                        {amountLabel}
                      </Text>
                    );
                  }}
                />
              );
            }
            return (
            <CycleDayPillRow
              key={row.isoDate}
              row={row}
              index={index}
              locale={locale}
              currency={currency}
              onPress={onRowPress}
              t={t}
              amountColMinW={amountColMinW}
            />
            );
          })}
        </View>

        {weeks.length > 1 ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 12,
              gap: 8,
            }}
          >
            <Pressable
              onPress={() => setPageIndex((p) => p + 1)}
              disabled={!canGoOlder}
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.cycles.calendar.entryTable.prevWeekA11y')}
              accessibilityState={{ disabled: !canGoOlder }}
              style={({ pressed }) => ({
                paddingVertical: 6,
                paddingHorizontal: 4,
                opacity: !canGoOlder ? 0.35 : pressed ? 0.65 : 1,
                ...(Platform.OS === 'web' && canGoOlder ? { cursor: 'pointer' } : {}),
              })}
            >
              <Text style={{ ...T.caption, color: C.accent, fontWeight: '600' }}>
                {t('dashboard.cycles.calendar.entryTable.prevWeek')}
              </Text>
            </Pressable>

            <Text
              style={{ ...T.caption, color: C.muted, fontWeight: '600', textAlign: 'center', flex: 1, ...tabularNums }}
              accessibilityLabel={t('dashboard.cycles.calendar.entryTable.weekPageA11y', {
                range: weekRangeLabel,
                current: String(pageIndex + 1),
                total: String(weeks.length),
              })}
            >
              {weekRangeLabel}
            </Text>

            <Pressable
              onPress={() => setPageIndex((p) => p - 1)}
              disabled={!canGoNewer}
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.cycles.calendar.entryTable.nextWeekA11y')}
              accessibilityState={{ disabled: !canGoNewer }}
              style={({ pressed }) => ({
                paddingVertical: 6,
                paddingHorizontal: 4,
                opacity: !canGoNewer ? 0.35 : pressed ? 0.65 : 1,
                ...(Platform.OS === 'web' && canGoNewer ? { cursor: 'pointer' } : {}),
              })}
            >
              <Text style={{ ...T.caption, color: C.accent, fontWeight: '600' }}>
                {t('dashboard.cycles.calendar.entryTable.nextWeek')}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </AnimatedResize>
    </View>
  );
}
