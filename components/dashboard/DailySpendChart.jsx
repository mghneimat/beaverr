import { useCallback, useMemo, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Svg, { Line, Path } from 'react-native-svg';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { maxDailySpendChartHeight, getDailySpendChartColors, formatDailySpendTooltipDate } from '../../lib/dailySpendChart';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import { elevationShadow } from '../../lib/shadow';
import DashboardSectionEmptyMessage from './DashboardSectionEmptyMessage';

const CHART_H = 260;
const LABEL_ROW_H = 32;
const PAD_LEFT_MIN = 64;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 8;
const AXIS_FONT = 10;
const AXIS_CHAR_W = 6.4;
const SLOT_GAP = 4;
const PILL_RATIO = 0.68;
const TOOLTIP_W = 168;
const TOOLTIP_GAP = 10;

/** Compact Y-axis labels — whole amounts, no decimals (saves horizontal space). */
function formatChartAxisCurrency(amount, currency) {
  if (!Number.isFinite(amount)) return '—';
  const intPart = String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return currency ? `${intPart} ${currency}` : intPart;
}

function measureAxisGutter(labels) {
  const widest = labels.reduce((max, label) => Math.max(max, label.length), 0);
  return Math.max(PAD_LEFT_MIN, Math.ceil(widest * AXIS_CHAR_W) + 12);
}

/** Horizontal grid spans that skip column pill widths. */
function buildGridGapSpans(slots, padLeft, plotW) {
  if (!slots.length) return [[0, plotW]];

  const blocked = slots
    .map((slot) => {
      const left = slot.pillX - padLeft;
      return [left, left + slot.pillW];
    })
    .sort((a, b) => a[0] - b[0]);

  /** @type {[number, number][]} */
  const spans = [];
  let cursor = 0;

  blocked.forEach(([left, right]) => {
    if (left > cursor) spans.push([cursor, left]);
    cursor = Math.max(cursor, right);
  });

  if (cursor < plotW) spans.push([cursor, plotW]);

  return spans.filter(([start, end]) => end - start > 0.5);
}

/**
 * Flat-bottom column segment; optional rounded top (reference-style stacked pill).
 * @param {number} left
 * @param {number} top
 * @param {number} width
 * @param {number} height
 * @param {boolean} [roundTop=false]
 */
function columnSegmentPath(left, top, width, height, roundTop = false) {
  const w = Math.max(width, 0);
  const h = Math.max(height, 0);
  if (h <= 0 || w <= 0) return null;

  const r = roundTop ? Math.min(w / 2, 5) : 0;
  const right = left + w;
  const bottom = top + h;

  if (!roundTop || r <= 0) {
    return `M ${left} ${top} H ${right} V ${bottom} H ${left} Z`;
  }

  return [
    `M ${left} ${bottom}`,
    `L ${right} ${bottom}`,
    `L ${right} ${top + r}`,
    `A ${r} ${r} 0 0 0 ${right - r} ${top}`,
    `L ${left + r} ${top}`,
    `A ${r} ${r} 0 0 0 ${left} ${top + r}`,
    'Z',
  ].join(' ');
}

/**
 * @param {import('../../lib/dailySpendChart').DailySpendChartDay} day
 * @param {number} spentH
 * @param {number} cushionH
 * @param {number} deficitH
 * @param {number} futureH
 */
function buildColumnSegments(day, spentH, cushionH, deficitH, futureH, skeletonH) {
  /** @type {{ key: string, height: number, fill: string, kind: string }[]} */
  const segments = [];

  if (day.isSkeletonColumn) {
    if (skeletonH > 0) {
      segments.push({ key: 'skeleton', height: skeletonH, fill: 'skeleton', kind: 'skeleton' });
    }
    return segments;
  }

  if (day.isFuture) {
    if (futureH > 0) {
      segments.push({ key: 'future', height: futureH, fill: 'future', kind: 'future' });
    }
    return segments;
  }

  if (day.deficit > 0) {
    if (spentH > 0) {
      segments.push({ key: 'spent', height: spentH, fill: 'spent', kind: 'spent' });
    }
    if (deficitH > 0) {
      segments.push({ key: 'deficit', height: deficitH, fill: 'deficit', kind: 'deficit' });
    }
    return segments;
  }

  if (spentH > 0) {
    segments.push({ key: 'spent', height: spentH, fill: 'spent', kind: 'spent' });
  }
  if (cushionH > 0) {
    segments.push({
      key: 'cushion',
      height: cushionH,
      fill: day.cushionType === 'remaining' ? 'remaining' : 'saved',
      kind: day.cushionType === 'remaining' ? 'remaining' : 'saved',
    });
  }

  return segments;
}

function segmentFill(kind, isActive) {
  const colors = getDailySpendChartColors();
  switch (kind) {
    case 'spent':
      return colors.spent;
    case 'saved':
      return colors.saved;
    case 'remaining':
      return colors.remaining;
    case 'deficit':
      return colors.deficit;
    case 'future':
      return C.surface;
    case 'skeleton':
      return C.surface;
    default:
      return colors.skeleton;
  }
}

function segmentStroke(kind) {
  const colors = getDailySpendChartColors();
  if (kind === 'future' || kind === 'skeleton') return colors.skeleton;
  return 'transparent';
}

function segmentOpacity(kind, isActive, hasFocus) {
  if (kind === 'future' || kind === 'skeleton') {
    if (hasFocus && !isActive) return 0.45;
    return 1;
  }
  if (hasFocus && !isActive) return kind === 'deficit' ? 0.45 : 0.42;
  if (isActive) return 1;
  if (kind === 'saved') return 0.88;
  if (kind === 'remaining') return 0.75;
  return 0.82;
}

/**
 * @param {import('../../lib/dailySpendChart').DailySpendChartDay[]} days
 * @param {string} currency
 */
export default function DailySpendChart({ days, currency }) {
  const { t, locale } = useI18n();
  const [width, setWidth] = useState(320);
  const [activeIndex, setActiveIndex] = useState(null);

  const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;
  const maxHeight = useMemo(() => maxDailySpendChartHeight(days), [days]);

  const yTicks = useMemo(() => [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    label: formatChartAxisCurrency(maxHeight * ratio, currency),
  })), [maxHeight, currency]);

  const padLeft = useMemo(
    () => measureAxisGutter(yTicks.map((tick) => tick.label)),
    [yTicks],
  );

  const plotW = Math.max(1, width - padLeft - PAD_RIGHT);
  const colCount = days.length || 1;
  const slotW = Math.max(4, (plotW - SLOT_GAP * (colCount - 1)) / colCount);
  const pillW = Math.max(3, slotW * PILL_RATIO);

  const scaleY = useCallback((amount) => {
    if (maxHeight <= 0) return 0;
    return (amount / maxHeight) * plotH;
  }, [maxHeight, plotH]);

  const baselineY = PAD_TOP + plotH;

  const slots = useMemo(() => days.map((day, index) => {
    const x = padLeft + index * (slotW + SLOT_GAP);
    const pillX = x + (slotW - pillW) / 2;
    const spentH = scaleY(Math.min(day.spent, day.allowance));
    const cushionH = scaleY(day.cushion);
    const deficitH = scaleY(day.deficit);
    const futureH = day.isFuture ? scaleY(day.allowance) : 0;
    const skeletonH = day.isSkeletonColumn ? scaleY(day.allowance) : 0;
    const segments = buildColumnSegments(day, spentH, cushionH, deficitH, futureH, skeletonH);
    const columnHeight = segments.reduce((sum, seg) => sum + seg.height, 0);

    return {
      day,
      index,
      x,
      pillX,
      pillW,
      baselineY,
      segments,
      columnHeight,
      columnTop: baselineY - columnHeight,
    };
  }), [days, slotW, pillW, baselineY, scaleY, padLeft]);

  if (!days.length) {
    return <DashboardSectionEmptyMessage message={t('dashboard.summaryScreen.dailySpend.empty')} />;
  }

  const active = activeIndex != null ? slots[activeIndex] : null;
  const hasFocus = activeIndex != null;

  const tooltipTop = active
    ? Math.max(PAD_TOP, active.columnTop - TOOLTIP_GAP - 96)
    : 0;

  const gridGapSpans = useMemo(
    () => buildGridGapSpans(slots, padLeft, plotW),
    [slots, padLeft, plotW],
  );

  const toggleSlot = useCallback((index) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  }, []);

  const hoverSlot = useCallback((index) => {
    if (Platform.OS === 'web') setActiveIndex(index);
  }, []);

  const unhoverSlot = useCallback(() => {
    if (Platform.OS === 'web') setActiveIndex(null);
  }, []);

  return (
    <View
      onLayout={(e) => {
        const next = e.nativeEvent.layout.width;
        if (next > 0 && Math.abs(next - width) > 1) setWidth(next);
      }}
    >
      <View style={{ height: CHART_H, position: 'relative', flexDirection: 'row' }}>
        <View style={{ width: padLeft, height: CHART_H, position: 'relative' }}>
          {yTicks.map(({ ratio, label }) => {
            const y = PAD_TOP + plotH * (1 - ratio);
            return (
              <Text
                key={ratio}
                style={{
                  position: 'absolute',
                  top: y - AXIS_FONT / 2,
                  right: 8,
                  left: 0,
                  fontSize: AXIS_FONT,
                  lineHeight: AXIS_FONT + 4,
                  color: C.muted,
                  textAlign: 'right',
                  ...tabularNums,
                }}
                numberOfLines={1}
              >
                {label}
              </Text>
            );
          })}
        </View>

        <View style={{ flex: 1, height: CHART_H, position: 'relative' }}>
        <Svg width={plotW + PAD_RIGHT} height={CHART_H} pointerEvents="none">
          {yTicks.map(({ ratio }) => {
            const y = PAD_TOP + plotH * (1 - ratio);
            return gridGapSpans.map(([x1, x2], gapIndex) => (
              <Line
                key={`${ratio}-${gapIndex}`}
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={C.tableRowBorder}
                strokeWidth={1}
                opacity={0.65}
              />
            ));
          })}

          {gridGapSpans.map(([x1, x2], gapIndex) => (
            <Line
              key={`baseline-${gapIndex}`}
              x1={x1}
              y1={baselineY}
              x2={x2}
              y2={baselineY}
              stroke={C.border}
              strokeWidth={1}
            />
          ))}

          {slots.map((slot) => {
            const isActive = activeIndex === slot.index;
            let cursorY = slot.baselineY;
            const visibleSegments = slot.segments.filter((seg) => seg.height > 0);
            const plotX = slot.pillX - padLeft;

            return visibleSegments.map((seg, segIndex) => {
              cursorY -= seg.height;
              const isTop = segIndex === visibleSegments.length - 1;
              const d = columnSegmentPath(plotX, cursorY, slot.pillW, seg.height, isTop);
              if (!d) return null;

              const stroke = segmentStroke(seg.kind);
              const strokeWidth = seg.kind === 'future' || seg.kind === 'skeleton' ? 1 : 0;

              return (
                <Path
                  key={`${slot.day.isoDate}-${seg.key}`}
                  d={d}
                  fill={segmentFill(seg.kind, isActive)}
                  opacity={segmentOpacity(seg.kind, isActive, hasFocus)}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
              );
            });
          })}

          {slots.map((slot) => {
            const isFocused = activeIndex === slot.index;
            if (!isFocused && !slot.day.isToday) return null;

            const plotX = slot.pillX - padLeft;
            const outlineH = scaleY(slot.day.allowance);
            if (outlineH <= 0) return null;
            const outlineTop = slot.baselineY - outlineH;
            const outlinePath = columnSegmentPath(plotX, outlineTop, slot.pillW, outlineH, true);
            if (!outlinePath) return null;

            const outlineOpacity = isFocused
              ? 0.72
              : hasFocus
                ? 0.38
                : 0.52;

            return (
              <Path
                key={`${slot.day.isoDate}-column-outline`}
                d={outlinePath}
                fill="none"
                stroke={C.accent}
                strokeWidth={1.5}
                opacity={outlineOpacity}
              />
            );
          })}
        </Svg>

        {active ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: Math.max(0, (active.pillX - padLeft) + active.pillW / 2 - TOOLTIP_W / 2),
              top: tooltipTop,
              width: TOOLTIP_W,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: R.input,
              borderWidth: 1,
              borderColor: C.border,
              backgroundColor: C.surface,
              ...elevationShadow({ offsetY: 6, blur: 16, opacity: 0.12 }),
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.text, marginBottom: 8 }}>
              {formatDailySpendTooltipDate(active.day.isoDate, t, locale)}
            </Text>
            <TooltipRow
              label={t('dashboard.summaryScreen.dailySpend.legendSpent')}
              value={formatCurrency(active.day.spent, currency)}
            />
            {active.day.cushion > 0 ? (
              <TooltipRow
                label={active.day.cushionType === 'remaining'
                  ? t('dashboard.summaryScreen.dailySpend.legendRemaining')
                  : t('dashboard.summaryScreen.dailySpend.legendSaved')}
                value={formatCurrency(active.day.cushion, currency)}
              />
            ) : null}
            {active.day.deficit > 0 ? (
              <TooltipRow
                label={t('dashboard.summaryScreen.dailySpend.legendDeficit')}
                value={formatCurrency(active.day.deficit, currency)}
              />
            ) : null}
            <View style={{
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: C.tableRowBorder,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            >
              <Text style={{ ...T.caption, color: C.muted, fontWeight: '600' }}>
                {t('dashboard.budget')}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, ...tabularNums }}>
                {formatCurrency(active.day.allowance, currency)}
              </Text>
            </View>
          </View>
        ) : null}

        {slots.map((slot) => (
          <Pressable
            key={`${slot.day.isoDate}-column-hit`}
            onPress={() => toggleSlot(slot.index)}
            onHoverIn={Platform.OS === 'web' ? () => hoverSlot(slot.index) : undefined}
            onHoverOut={Platform.OS === 'web' ? unhoverSlot : undefined}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.summaryScreen.dailySpend.dayA11y', {
              day: String(slot.day.dayOfMonth),
              spent: formatCurrency(slot.day.spent, currency),
            })}
            style={{
              position: 'absolute',
              left: slot.x - padLeft,
              top: 0,
              width: slotW,
              height: CHART_H,
              backgroundColor: 'transparent',
              ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
            }}
          />
        ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <View style={{ width: padLeft }} />
        <View style={{ flex: 1, height: LABEL_ROW_H, position: 'relative' }}>
          {slots.map((slot) => {
            const isActive = activeIndex === slot.index;
            const isToday = slot.day.isToday;
            const dimmed = hasFocus && !isActive;

            return (
              <Pressable
                key={`${slot.day.isoDate}-label-hit`}
                onPress={() => toggleSlot(slot.index)}
                onHoverIn={Platform.OS === 'web' ? () => hoverSlot(slot.index) : undefined}
                onHoverOut={Platform.OS === 'web' ? unhoverSlot : undefined}
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.summaryScreen.dailySpend.dayA11y', {
                  day: String(slot.day.dayOfMonth),
                  spent: formatCurrency(slot.day.spent, currency),
                })}
                style={({ pressed }) => ({
                  position: 'absolute',
                  left: slot.x - padLeft,
                  width: slotW,
                  height: LABEL_ROW_H,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: R.input,
                  backgroundColor: pressed ? C.breakdownRowHover : 'transparent',
                  opacity: dimmed ? 0.45 : 1,
                  ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
                })}
              >
                <Text
                  style={{
                    fontSize: isToday ? 12 : 11,
                    fontWeight: isToday || isActive ? '700' : '500',
                    color: isToday || isActive ? C.primary : C.muted,
                    ...tabularNums,
                  }}
                >
                  {String(slot.day.dayOfMonth)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 14, justifyContent: 'center' }}>
        {(() => {
          const colors = getDailySpendChartColors();
          return [
            { color: colors.spent, label: t('dashboard.summaryScreen.dailySpend.legendSpent') },
            { color: colors.saved, label: t('dashboard.summaryScreen.dailySpend.legendSaved') },
            { color: colors.remaining, label: t('dashboard.summaryScreen.dailySpend.legendRemaining'), opacity: 0.75 },
            { color: colors.deficit, label: t('dashboard.summaryScreen.dailySpend.legendDeficit') },
            {
              color: C.surface,
              label: t('dashboard.summaryScreen.dailySpend.legendNotLogged'),
              hollow: true,
            },
          ].map((item) => (
            <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                backgroundColor: item.hollow ? C.surface : item.color,
                opacity: item.opacity ?? 1,
                borderWidth: item.hollow ? 1 : 0,
                borderColor: item.hollow ? colors.skeleton : C.border,
              }}
              />
              <Text style={{ ...T.caption, color: C.muted }}>{item.label}</Text>
            </View>
          ));
        })()}
      </View>
    </View>
  );
}

function TooltipRow({ label, value }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 6,
    }}
    >
      <Text style={{ ...T.caption, color: C.muted, flex: 1, minWidth: 0 }} numberOfLines={1}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: C.text, ...tabularNums }}>{value}</Text>
    </View>
  );
}
