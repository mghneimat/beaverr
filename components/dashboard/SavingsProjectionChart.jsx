import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Polyline,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { C, R, SHADOW, T, tabularNums } from '../../constants/onboarding-theme';
import {
  SAVINGS_CHART_MONTH_COUNT,
  resolveSavingsChartMonthWindow,
} from '../../lib/savingsChartHorizon';
import DashboardSectionEmptyMessage from './DashboardSectionEmptyMessage';

const CHART_H = 260;
const PAD_LEFT = 48;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 34;
const TOOLTIP_W = 96;
const TOOLTIP_GAP = 8;
const TOOLTIP_EST_H = 36;
const TOOLTIP_RADIUS = 6;
const MONTH_COLUMN_MIN_W = 24;
const CHART_EDGE = 4;
const POINT_R = 5;
const PILL_WIDTH_RATIO = 0.82;
const PILL_GAP_X = 8;

/**
 * Column with flat bottom on the x-axis and rounded top corners.
 * @param {number} centerX
 * @param {number} top
 * @param {number} width
 * @param {number} height
 */
function monthColumnPath(centerX, top, width, height) {
  const w = Math.max(width, 0);
  const h = Math.max(height, 0);
  const r = Math.min(w / 2, h);
  const left = centerX - w / 2;
  const right = centerX + w / 2;
  const bottom = top + h;
  if (h <= 0 || w <= 0) return '';
  if (r <= 0) {
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
 * Theme-aware pill wash — light tint on dark charts, soft navy on light charts.
 */
function monthPillFill() {
  return C.text;
}

/**
 * Opacity for month column pills — subtle edge fade; current/hover slightly stronger.
 * @param {number} calendarMonth
 * @param {number} monthCount
 * @param {boolean} isNow
 * @param {boolean} isActive
 */
function monthPillOpacity(calendarMonth, monthCount, isNow, isActive) {
  const mid = (monthCount - 1) / 2;
  const edgeFade = 1 - (Math.abs(calendarMonth - mid) / Math.max(mid, 1)) * 0.28;
  if (isNow || isActive) {
    return 0.11 + edgeFade * 0.07;
  }
  return 0.06 + edgeFade * 0.05;
}

/**
 * @param {boolean} isNow
 * @param {boolean} isActive
 */
function monthPillStroke(isNow, isActive) {
  return isNow || isActive ? C.muted : 'transparent';
}

/**
 * @param {number} xPx
 * @param {{ id: string, x: number }[]} slots
 * @param {number} bandWidth
 */
function findMonthSlotAtX(xPx, slots, bandWidth) {
  if (!slots.length) return null;
  const half = bandWidth / 2;
  const direct = slots.find((slot) => xPx >= slot.x - half && xPx <= slot.x + half);
  if (direct) return direct;
  return slots.reduce(
    (best, slot) => {
      const dist = Math.abs(xPx - slot.x);
      return dist < best.dist ? { slot, dist } : best;
    },
    { slot: slots[0], dist: Infinity },
  ).slot;
}

/**
 * @param {number} amount
 * @param {string} currency
 */
function formatAxisAmount(amount, currency) {
  const value = Math.max(0, Number(amount) || 0);
  if (value >= 1000000) {
    return `${Math.round(value / 100000) / 10}M`;
  }
  if (value >= 1000) {
    const k = value / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  return formatCurrency(value, currency).replace(/\s*[^\d,.\s]+$/u, '').trim();
}

/**
 * Three-letter month label (Sep not Sept).
 * @param {Date} date
 * @param {string} locale
 */
function formatMonthShort(date, locale) {
  const month = date.getMonth();
  if (locale === 'cs') {
    const cs = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'];
    return cs[month];
  }
  const en = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return en[month];
}

/**
 * @param {number} min
 * @param {number} max
 * @param {number} [count=4]
 */
function buildYTicks(min, max, count = 4) {
  if (max <= min) return [min];
  const step = (max - min) / (count - 1);
  const ticks = Array.from({ length: count }, (_, i) => roundTick(min + step * i));
  const unique = [...new Set(ticks)];
  if (unique.length >= 2) return unique;
  const ends = [roundTick(min), roundTick(max)];
  return [...new Set(ends)];
}

function roundTick(value) {
  if (value >= 10000) return Math.round(value / 1000) * 1000;
  if (value >= 1000) return Math.round(value / 100) * 100;
  return Math.round(value);
}

function crosshairFadeStops(color, peak = 1) {
  return (
    <>
      <Stop offset="0%" stopColor={color} stopOpacity={0} />
      <Stop offset="6%" stopColor={color} stopOpacity={peak * 0.35} />
      <Stop offset="30%" stopColor={color} stopOpacity={peak} />
      <Stop offset="70%" stopColor={color} stopOpacity={peak} />
      <Stop offset="94%" stopColor={color} stopOpacity={peak * 0.35} />
      <Stop offset="100%" stopColor={color} stopOpacity={0} />
    </>
  );
}

/**
 * @param {number} focus
 * @param {number} lineStart
 * @param {number} lineEnd
 * @param {number} [minSpan=40]
 */
function crosshairFadeHalfSpan(focus, lineStart, lineEnd, minSpan = 40) {
  return Math.max(focus - lineStart, lineEnd - focus, minSpan) * 0.8;
}

/**
 * @param {{ x: number, y: number }[]} coords
 * @param {number} baselineY
 */
function buildLineAreaPath(coords, baselineY) {
  if (coords.length < 2) return '';
  const first = coords[0];
  const last = coords[coords.length - 1];
  return [
    `M ${first.x} ${baselineY}`,
    ...coords.map((c) => `L ${c.x} ${c.y}`),
    `L ${last.x} ${baselineY}`,
    'Z',
  ].join(' ');
}

/**
 * @param {{ x: number, y: number }[]} coords
 * @param {number} baselineY
 */
function buildActualSeriesGeometry(coords, baselineY) {
  if (coords.length < 2) {
    return { line: '', area: '' };
  }
  return {
    line: coords.map((c) => `${c.x},${c.y}`).join(' '),
    area: buildLineAreaPath(coords, baselineY),
  };
}

function resolveTooltipPlacement({
  anchorX,
  anchorY,
  tooltipW,
  tooltipH,
  chartW,
  chartH,
  gap = TOOLTIP_GAP,
}) {
  const overflowScore = (left, top) => (
    Math.max(0, CHART_EDGE - left)
    + Math.max(0, left + tooltipW - (chartW - CHART_EDGE))
    + Math.max(0, CHART_EDGE - top)
    + Math.max(0, top + tooltipH - (chartH - CHART_EDGE))
  );

  const options = [
    { placement: 'top', left: anchorX - tooltipW / 2, top: anchorY - tooltipH - gap },
    { placement: 'bottom', left: anchorX - tooltipW / 2, top: anchorY + POINT_R + gap },
    { placement: 'left', left: anchorX - tooltipW - gap, top: anchorY - tooltipH / 2 },
    { placement: 'right', left: anchorX + POINT_R + gap, top: anchorY - tooltipH / 2 },
  ].map((opt) => ({ ...opt, score: overflowScore(opt.left, opt.top) }));

  const preference = { top: 0, bottom: 1, right: 2, left: 3 };
  options.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return preference[a.placement] - preference[b.placement];
  });

  const best = options[0];
  return {
    placement: best.placement,
    left: Math.min(Math.max(best.left, CHART_EDGE), chartW - tooltipW - CHART_EDGE),
    top: Math.min(Math.max(best.top, CHART_EDGE), chartH - tooltipH - CHART_EDGE),
  };
}

function SavingsChartTooltip({ point, layoutWidth, currency, variant = 'full' }) {
  const [measuredH, setMeasuredH] = useState(0);
  const tooltipH = measuredH || TOOLTIP_EST_H;
  const { left, top } = resolveTooltipPlacement({
    anchorX: point.x,
    anchorY: point.anchorY,
    tooltipW: TOOLTIP_W,
    tooltipH,
    chartW: layoutWidth,
    chartH: CHART_H,
  });

  const displayActual = point.actualBalance ?? 0;
  const displayProjected = point.projectedBalance ?? 0;
  const valueStyle = { fontSize: 12, fontWeight: '600', lineHeight: 15, ...tabularNums };
  const isHistorical = variant === 'historical';

  return (
    <View
      pointerEvents="none"
      onLayout={(e) => {
        const next = e.nativeEvent.layout.height;
        if (next > 0 && next !== measuredH) setMeasuredH(next);
      }}
      style={{
        position: 'absolute',
        left,
        top,
        backgroundColor: C.surface,
        borderRadius: TOOLTIP_RADIUS,
        borderWidth: 1,
        borderColor: C.border,
        paddingVertical: 3,
        paddingHorizontal: 5,
        alignItems: 'center',
        ...SHADOW.card,
      }}
    >
      <View style={{ gap: 1, alignItems: 'center' }}>
        <Text style={{ ...valueStyle, color: C.accent }}>
          {formatCurrency(isHistorical ? (point.actualBalance ?? point.projectedBalance ?? 0) : displayActual, currency)}
        </Text>
        {!isHistorical ? (
          <Text style={{ ...valueStyle, color: C.muted }}>
            {formatCurrency(displayProjected, currency)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function resolveProjectedForMonth(month, projectedCoords) {
  const direct = projectedCoords.find((p) => p.calendarMonth === month);
  if (direct) return direct.balance;
  const last = [...projectedCoords]
    .filter((p) => p.calendarMonth < month)
    .sort((a, b) => b.calendarMonth - a.calendarMonth)[0];
  return last ? last.balance : null;
}

function resolveMonthSavings(month, ctx) {
  const { currentMonth, startBalance, actualCoords, projectedCoords } = ctx;
  const actualPoint = actualCoords.find((p) => p.calendarMonth === month);
  const projectedBalance = resolveProjectedForMonth(month, projectedCoords);

  let actualBalance = null;
  if (month < currentMonth) {
    actualBalance = actualPoint ? actualPoint.balance : null;
  } else if (month === currentMonth) {
    actualBalance = actualPoint?.balance ?? startBalance;
  }

  return { actualBalance, projectedBalance };
}

function ColorDot({ color, size = 8 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  );
}

/**
 * Savings chart — full (actual + projected) or historical (single actual line).
 * @param {'full'|'historical'} [variant='full']
 */
export default function SavingsProjectionChart({ chartData, currency, variant = 'full' }) {
  const { t, locale } = useI18n();
  const isHistorical = variant === 'historical';
  const fillGradientId = useId().replace(/:/g, '');
  const baselineGradientId = useId().replace(/:/g, '');
  const [width, setWidth] = useState(320);
  const [activePointId, setActivePointId] = useState(null);

  const layout = useMemo(() => {
    const projected = chartData?.projectedPoints || [];
    const actual = chartData?.actualPoints || [];
    const hasActualHistory = chartData?.hasActualHistory === true;
    const showEmptyShell = isHistorical && !hasActualHistory;
    if (!showEmptyShell && projected.length < 2 && (!hasActualHistory || actual.length < 2)) return null;

    const anchor = chartData.now ? new Date(chartData.now) : new Date();
    const year = chartData.chartYear ?? anchor.getFullYear();
    const currentMonth = chartData.currentMonth ?? anchor.getMonth();
    const { months: visibleMonths } = resolveSavingsChartMonthWindow(currentMonth);
    const visibleCount = visibleMonths.length;

    const balances = [
      ...(hasActualHistory ? actual.map((p) => p.balance) : []),
      ...projected.map((p) => p.balance),
      ...(showEmptyShell ? [Number(chartData.startBalance) || 0] : []),
    ];

    const yMin = 0;
    const yMax = Math.max(...balances, 1) * 1.08;
    const innerW = Math.max(width - PAD_LEFT - PAD_RIGHT, 40);
    const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;
    const monthSpan = visibleCount > 1 ? innerW / (visibleCount - 1) : innerW;
    const pillWidth = Math.min(monthSpan * PILL_WIDTH_RATIO, monthSpan);
    const xInset = pillWidth / 2 + PILL_GAP_X;
    const xSpan = Math.max(innerW - pillWidth - PILL_GAP_X * 2, 0);

    const xForCalendarMonth = (calendarMonth) => (
      visibleCount <= 1
        ? PAD_LEFT + innerW / 2
        : PAD_LEFT + xInset + (calendarMonth / (visibleCount - 1)) * xSpan
    );
    const yForBalance = (balance) => (
      PAD_TOP + innerH - ((balance - yMin) / Math.max(yMax - yMin, 1)) * innerH
    );

    const inChartYear = (date) => date.getFullYear() === year;

    const actualCoordsAll = hasActualHistory
      ? actual
        .filter((p) => inChartYear(p.monthDate))
        .map((p) => ({
          ...p,
          kind: 'actual',
          calendarMonth: p.monthDate.getMonth(),
          monthDate: p.monthDate,
          balance: p.balance,
        }))
      : [];

    const projectedCoordsAll = projected
      .map((p) => {
        const calendarMonth = currentMonth + p.monthIndex;
        return {
          ...p,
          kind: 'projected',
          calendarMonth,
          monthDate: new Date(year, calendarMonth, 1),
          balance: p.balance,
        };
      })
      .filter((p) => p.calendarMonth >= 0 && p.calendarMonth < 12);

    const monthCtx = {
      currentMonth,
      startBalance: chartData.startBalance ?? 0,
      actualCoords: actualCoordsAll,
      projectedCoords: projectedCoordsAll,
      hasActualHistory,
    };

    const chartBaseline = PAD_TOP + innerH;

    const monthHoverSlots = visibleMonths.map((calendarMonth) => {
      const { actualBalance, projectedBalance } = resolveMonthSavings(calendarMonth, monthCtx);
      const x = xForCalendarMonth(calendarMonth);
      const monthDate = new Date(year, calendarMonth, 1);
      const yActual = actualBalance != null ? yForBalance(actualBalance) : null;
      const yProjected = projectedBalance != null ? yForBalance(projectedBalance) : null;
      const anchorY = yActual ?? chartBaseline;
      return {
        id: `month-${calendarMonth}`,
        calendarMonth,
        monthDate,
        x,
        anchorY,
        yActual,
        yProjected,
        actualBalance,
        projectedBalance,
        kind: calendarMonth > currentMonth ? 'projected' : 'actual',
        isNow: calendarMonth === currentMonth,
      };
    });

    const actualCoords = hasActualHistory
      ? monthHoverSlots
        .filter((slot) => slot.yActual != null && slot.calendarMonth <= currentMonth)
        .map((slot) => ({
          x: slot.x,
          y: slot.yActual,
          calendarMonth: slot.calendarMonth,
        }))
      : [];

    const projectedCoords = monthHoverSlots
      .filter((slot) => slot.projectedBalance != null && slot.calendarMonth >= currentMonth)
      .map((slot) => ({
        x: slot.x,
        y: slot.yProjected,
        calendarMonth: slot.calendarMonth,
      }));

    let projectedLine = '';
    if (projectedCoords.length >= 2) {
      projectedLine = projectedCoords.map((c) => `${c.x},${c.y}`).join(' ');
    } else if (projectedCoords.length === 1) {
      const anchor = monthHoverSlots.find((s) => s.isNow) ?? monthHoverSlots[0];
      const startY = anchor?.yActual ?? anchor?.yProjected ?? anchor?.anchorY;
      if (anchor && startY != null) {
        projectedLine = `${anchor.x},${startY} ${projectedCoords[0].x},${projectedCoords[0].y}`;
      }
    }

    const { line: actualLine, area: actualArea } = buildActualSeriesGeometry(
      actualCoords,
      PAD_TOP + innerH,
    );

    const yTicks = buildYTicks(yMin, yMax);
    const baseline = PAD_TOP + innerH;
    const columnWidth = Math.max(MONTH_COLUMN_MIN_W, monthSpan);
    const hoverBandWidth = monthSpan;
    const pillTop = PAD_TOP;
    const resolvedPillHeight = baseline - pillTop;
    const nowCoord = monthHoverSlots.find((p) => p.isNow) ?? null;
    const endMonth = SAVINGS_CHART_MONTH_COUNT - 1;
    const headlineActual = resolveMonthSavings(currentMonth, monthCtx).actualBalance
      ?? chartData.startBalance
      ?? 0;
    const headlineProjected = resolveMonthSavings(endMonth, monthCtx).projectedBalance
      ?? headlineActual;

    return {
      width,
      year,
      currentMonth,
      hasActualHistory,
      nowCoord,
      columnWidth,
      hoverBandWidth,
      pillWidth,
      pillTop,
      pillHeight: resolvedPillHeight,
      innerW,
      innerH,
      yTicks,
      yForBalance,
      actualLine,
      projectedLine,
      actualArea,
      monthHoverSlots,
      baseline,
      headlineActual,
      headlineProjected,
      showEmptyShell,
    };
  }, [chartData, currency, isHistorical, locale, width]);

  useEffect(() => {
    setActivePointId(null);
  }, [chartData, width]);

  const activePoint = layout?.monthHoverSlots.find((p) => p.id === activePointId) ?? null;

  const activatePoint = useCallback((id) => {
    setActivePointId(id);
  }, []);

  const deactivatePoint = useCallback(() => {
    setActivePointId(null);
  }, []);

  const handleChartPointerMove = useCallback((event) => {
    if (!layout?.monthHoverSlots?.length) return;
    const x = event.nativeEvent?.offsetX ?? event.nativeEvent?.locationX;
    if (typeof x !== 'number') return;
    const slot = findMonthSlotAtX(x, layout.monthHoverSlots, layout.hoverBandWidth);
    if (slot) setActivePointId(slot.id);
  }, [layout]);

  const handleChartPointerLeave = useCallback(() => {
    deactivatePoint();
  }, [deactivatePoint]);

  if (!chartData || (!isHistorical && chartData.startBalance <= 0 && chartData.monthlyInflow <= 0)) {
    return (
      <DashboardSectionEmptyMessage message={t('dashboard.savingsScreen.chart.empty')} />
    );
  }

  if (!layout) {
    return (
      <DashboardSectionEmptyMessage message={t('dashboard.savingsScreen.chart.empty')} />
    );
  }

  const {
    actualLine,
    projectedLine,
    actualArea,
    yTicks,
    yForBalance,
    monthHoverSlots,
    baseline,
    hasActualHistory,
    nowCoord,
    hoverBandWidth,
    pillWidth,
    pillTop,
    pillHeight,
    headlineActual,
    headlineProjected,
    showEmptyShell,
  } = layout;

  const showNowDot = !hasActualHistory && nowCoord && !isHistorical && !activePoint;

  const baselineFocusX = activePoint?.x ?? PAD_LEFT + (layout.innerW ?? 0) / 2;
  const baselineFadeHalf = crosshairFadeHalfSpan(
    baselineFocusX,
    PAD_LEFT,
    layout.width - PAD_RIGHT,
  );

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width || 320)}>
      <View
        {...(Platform.OS === 'web' ? {
          onMouseMove: handleChartPointerMove,
          onMouseLeave: handleChartPointerLeave,
          style: { position: 'relative', height: CHART_H, cursor: 'pointer' },
        } : { style: { position: 'relative', height: CHART_H } })}
      >
        <Svg width="100%" height={CHART_H} viewBox={`0 0 ${layout.width} ${CHART_H}`} pointerEvents="none">
          <Defs>
            <LinearGradient
              id={fillGradientId}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={PAD_TOP}
              x2={0}
              y2={baseline}
            >
              <Stop offset="0%" stopColor={C.accent} stopOpacity={0.18} />
              <Stop offset="100%" stopColor={C.accent} stopOpacity={0.02} />
            </LinearGradient>
            <LinearGradient
              id={baselineGradientId}
              gradientUnits="userSpaceOnUse"
              x1={baselineFocusX - baselineFadeHalf}
              y1={baseline}
              x2={baselineFocusX + baselineFadeHalf}
              y2={baseline}
            >
              {crosshairFadeStops(C.border)}
            </LinearGradient>
          </Defs>

          {monthHoverSlots.map((slot) => {
            const isActive = activePointId === slot.id;
            const pillOpacity = monthPillOpacity(
              slot.calendarMonth,
              monthHoverSlots.length,
              slot.isNow,
              isActive,
            );
            const pillFill = monthPillFill();
            const pillStroke = monthPillStroke(slot.isNow, isActive);
            return (
            <Path
              key={`pill-${slot.id}`}
              d={monthColumnPath(slot.x, pillTop, pillWidth, pillHeight)}
              fill={pillFill}
              stroke={pillStroke}
              strokeWidth={slot.isNow || isActive ? 1 : 0}
              opacity={pillOpacity}
            />
            );
          })}

          <Line
            x1={PAD_LEFT}
            y1={baseline}
            x2={layout.width - PAD_RIGHT}
            y2={baseline}
            stroke={`url(#${baselineGradientId})`}
            strokeWidth={1}
          />

          {actualArea ? (
            <Path
              d={actualArea}
              fill={`url(#${fillGradientId})`}
            />
          ) : null}

          {actualLine ? (
            <Polyline
              points={actualLine}
              fill="none"
              stroke={C.accent}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {projectedLine ? (
            <Polyline
              points={projectedLine}
              fill="none"
              stroke={C.muted}
              strokeWidth={2}
              strokeDasharray="6 5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {activePoint ? (
            <>
              <Line
                x1={activePoint.x}
                y1={pillTop}
                x2={activePoint.x}
                y2={baseline}
                stroke={C.muted}
                strokeWidth={2}
                strokeOpacity={0.95}
              />
              <Circle
                cx={activePoint.x}
                cy={activePoint.anchorY}
                r={POINT_R}
                fill={C.surface}
                stroke={C.text}
                strokeWidth={2.5}
              />
            </>
          ) : showNowDot ? (
            <Circle cx={nowCoord.x} cy={nowCoord.anchorY} r={POINT_R} fill={C.accent} />
          ) : null}

          {yTicks.map((tick, tickIndex) => (
            <SvgText
              key={`ylabel-${tickIndex}-${tick}`}
              x={PAD_LEFT - 6}
              y={yForBalance(tick) + 4}
              fontSize={10}
              fill={C.muted}
              textAnchor="end"
            >
              {formatAxisAmount(tick, currency)}
            </SvgText>
          ))}

          {monthHoverSlots.map((slot) => {
            const isHighlighted = slot.isNow || activePointId === slot.id;
            return (
            <SvgText
              key={`xlabel-${slot.calendarMonth}`}
              x={slot.x}
              y={CHART_H - 8}
              fontSize={11}
              fill={isHighlighted ? C.text : C.muted}
              fontWeight={isHighlighted ? '700' : '500'}
              textAnchor="middle"
            >
              {formatMonthShort(slot.monthDate, locale)}
            </SvgText>
            );
          })}
        </Svg>

        {Platform.OS !== 'web' ? monthHoverSlots.map((slot) => (
          <Pressable
            key={slot.id}
            onPress={() => (
              activePointId === slot.id ? deactivatePoint() : activatePoint(slot.id)
            )}
            accessibilityRole="button"
            accessibilityLabel={isHistorical
              ? t('dashboard.savingsScreen.detail.historyChart.tooltipA11y', {
                month: formatMonthShort(slot.monthDate, locale),
                balance: formatCurrency(slot.actualBalance ?? 0, currency),
              })
              : t('dashboard.savingsScreen.chart.tooltipA11y', {
                month: formatMonthShort(slot.monthDate, locale),
                actual: formatCurrency(slot.actualBalance ?? 0, currency),
                projected: formatCurrency(slot.projectedBalance ?? 0, currency),
              })}
            style={{
              position: 'absolute',
              left: slot.x - hoverBandWidth / 2,
              top: 0,
              width: hoverBandWidth,
              height: CHART_H,
            }}
          />
        )) : null}

        {activePoint ? (
          <SavingsChartTooltip
            point={activePoint}
            layoutWidth={layout.width}
            currency={currency}
            variant={variant}
          />
        ) : null}
      </View>

      <View
        accessibilityLabel={isHistorical
          ? t('dashboard.savingsScreen.detail.historyChart.headlineA11y', {
            balance: formatCurrency(headlineActual, currency),
          })
          : t('dashboard.savingsScreen.chart.headlineA11y', {
            actual: formatCurrency(headlineActual, currency),
            projected: formatCurrency(headlineProjected, currency),
          })}
        style={{
          marginTop: 10,
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ColorDot color={C.accent} />
          <Text style={{ ...T.caption, fontSize: 13, color: C.text, fontWeight: '500' }}>
            {t(isHistorical
              ? 'dashboard.savingsScreen.detail.historyChart.series'
              : 'dashboard.savingsScreen.chart.seriesActual')}
          </Text>
        </View>
        {!isHistorical ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ColorDot color={C.muted} />
            <Text style={{ ...T.caption, fontSize: 13, color: C.muted, fontWeight: '500' }}>
              {t('dashboard.savingsScreen.chart.seriesProjected')}
            </Text>
          </View>
        ) : null}
      </View>

      {showEmptyShell ? (
        <DashboardSectionEmptyMessage
          message={t('dashboard.savingsScreen.detail.historyChart.noHistory')}
          variant="centered"
          style={{ paddingVertical: 8, marginTop: 10 }}
        />
      ) : null}
    </View>
  );
}
