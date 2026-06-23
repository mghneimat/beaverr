import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Svg, { Path, Circle, G } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import { formatSharePct } from '../../lib/formatSharePct';
import { donutSegmentPath, buildDonutArcMeta } from '../../lib/donutSegment';
import { useBreakdownTableColumns } from '../../lib/dashboardLayout';
import { formatDashboardAmount } from './formatDashboardAmount';
import TableHorizontalScroll, { donutLegendTableMinWidth } from './TableHorizontalScroll';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CHART_COLORS = [C.primary, C.accent, C.positive, '#6B4FA0', '#F59E0B', '#0EA5E9'];

const NAME_COL_W = 140;
const LEGEND_COL_GAP = 12;
const LEGEND_MAX_W = 480;
const SEGMENT_STAGGER_MS = 70;
const SEGMENT_DURATION_MS = 520;

const SIZE = 280;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 118;
const INNER_R = 76;

function LegendColumn({ children, align = 'left', width, flex }) {
  return (
    <View style={{
      ...(width != null ? { width, flexShrink: 0 } : { flex: flex ?? 1, minWidth: 0 }),
      alignItems: align === 'center' ? 'center' : 'flex-start',
      justifyContent: 'center',
    }}>
      {children}
    </View>
  );
}

function LegendHeader({ nameLabel, amountLabel, shareLabel, stacked, amountColW, shareColW }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: LEGEND_COL_GAP,
      marginBottom: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: C.tableRowBorder,
      width: '100%',
    }}>
      <View style={{ width: 10, flexShrink: 0 }} />
      <LegendColumn width={stacked ? undefined : NAME_COL_W} flex={stacked ? 1 : undefined} align="left">
        <Text style={{ ...T.caption, fontWeight: '600', color: C.muted }} numberOfLines={1}>
          {nameLabel}
        </Text>
      </LegendColumn>
      <LegendColumn width={amountColW} align="right">
        <Text style={{ ...T.caption, fontWeight: '600', color: C.muted, textAlign: 'right' }} numberOfLines={1}>
          {amountLabel}
        </Text>
      </LegendColumn>
      <LegendColumn width={shareColW} align="right">
        <Text style={{ ...T.caption, fontWeight: '600', color: C.muted, textAlign: 'right' }} numberOfLines={1}>
          {shareLabel}
        </Text>
      </LegendColumn>
    </View>
  );
}

function LegendRows({
  segments, total, frequency, currency, daysInMonth, stacked, amountColW, shareColW,
}) {
  return (
    <View style={{ gap: 0, width: '100%' }}>
      {segments.map((seg, i) => (
        <View
          key={seg.key}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: LEGEND_COL_GAP,
            width: '100%',
            paddingVertical: 12,
            borderBottomWidth: i < segments.length - 1 ? 1 : 0,
            borderBottomColor: C.tableRowBorder,
          }}
        >
          <View style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            flexShrink: 0,
            backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
          }} />
          <LegendColumn width={stacked ? undefined : NAME_COL_W} flex={stacked ? 1 : undefined} align="left">
            <Text style={{ fontSize: 14, fontWeight: '500', color: C.text }} numberOfLines={stacked ? 2 : 1}>
              {seg.label}
            </Text>
          </LegendColumn>
          <LegendColumn width={amountColW} align="right">
            <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary, textAlign: 'right', ...tabularNums }} numberOfLines={1}>
              {formatDashboardAmount(seg.value, frequency, currency, daysInMonth)}
            </Text>
          </LegendColumn>
          <LegendColumn width={shareColW} align="right">
            <Text style={{ fontSize: 14, fontWeight: '500', color: C.muted, textAlign: 'right', ...tabularNums }} numberOfLines={1}>
              {formatSharePct(seg.value, total)}
            </Text>
          </LegendColumn>
        </View>
      ))}
    </View>
  );
}

function AnimatedDonutSegment({
  cx, cy, outerR, innerR, startAngle, drawSweep, fill, delay,
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: SEGMENT_DURATION_MS, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, progress]);

  const animatedProps = useAnimatedProps(() => {
    const end = startAngle + drawSweep * progress.value;
    return {
      d: donutSegmentPath(cx, cy, outerR, innerR, startAngle, end),
    };
  });

  return <AnimatedPath animatedProps={animatedProps} fill={fill} stroke={fill} strokeWidth={1} />;
}

/**
 * Donut chart + Maytech-style legend table below.
 */
export default function ExpensesDonutChart({
  segments,
  total,
  currency,
  frequency,
  daysInMonth,
  emptyLabel,
  nameLabel,
  amountLabel,
  shareLabel,
  chartKey,
}) {
  const { isPhone, amountColW, shareColW } = useBreakdownTableColumns();
  const legendAmountW = Math.max(amountColW, 108);
  const legendShareW = Math.max(shareColW, 56);
  const stacked = !isPhone;
  const legendMinWidth = donutLegendTableMinWidth(NAME_COL_W, legendAmountW, legendShareW, LEGEND_COL_GAP);

  const hasData = total > 0 && segments.length > 0;
  const displayTotal = formatDashboardAmount(total, frequency, currency, daysInMonth);

  const chartScale = useSharedValue(0.92);
  const centerOpacity = useSharedValue(0);

  useEffect(() => {
    chartScale.value = 0.92;
    centerOpacity.value = 0;
    chartScale.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    centerOpacity.value = withDelay(
      segments.length * SEGMENT_STAGGER_MS + 180,
      withTiming(1, { duration: 320 }),
    );
  }, [chartKey, segments.length, chartScale, centerOpacity]);

  const chartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chartScale.value }],
  }));

  const centerAnimStyle = useAnimatedStyle(() => ({
    opacity: centerOpacity.value,
  }));

  const arcMeta = useMemo(() => {
    const arcs = buildDonutArcMeta(segments, total);
    return arcs.map((arc, i) => ({
      ...arc,
      fill: CHART_COLORS[i % CHART_COLORS.length],
      delay: i * SEGMENT_STAGGER_MS,
    }));
  }, [segments, total]);

  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingVertical: 8,
    }}>
      <View style={{
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        width: '100%',
      }}>
        <Animated.View style={[{
          width: SIZE,
          height: SIZE,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }, chartAnimStyle]}
        >
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {!hasData ? (
              <>
                <Circle cx={CX} cy={CY} r={OUTER_R} fill="none" stroke={C.border} strokeWidth={14} />
                <Circle cx={CX} cy={CY} r={INNER_R} fill={C.surface} />
              </>
            ) : (
              <G>
                <Circle
                  cx={CX}
                  cy={CY}
                  r={(OUTER_R + INNER_R) / 2}
                  fill="none"
                  stroke={C.border}
                  strokeWidth={OUTER_R - INNER_R}
                />
                {arcMeta.map((arc) => (
                  <AnimatedDonutSegment
                    key={arc.key}
                    cx={CX}
                    cy={CY}
                    outerR={OUTER_R}
                    innerR={INNER_R}
                    startAngle={arc.start}
                    drawSweep={arc.drawSweep}
                    fill={arc.fill}
                    delay={arc.delay}
                  />
                ))}
              </G>
            )}
          </Svg>
          <Animated.View style={[{ position: 'absolute', alignItems: 'center', maxWidth: INNER_R * 2 - 8 }, centerAnimStyle]}>
            <Text style={{ fontSize: 11, fontWeight: '500', color: C.muted, textAlign: 'center' }}>
              {hasData ? '' : emptyLabel}
            </Text>
            {hasData ? (
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.primary, textAlign: 'center', ...tabularNums }}>
                {displayTotal}
              </Text>
            ) : null}
          </Animated.View>
        </Animated.View>

        {hasData ? (
          <TableHorizontalScroll minWidth={legendMinWidth}>
          <View style={{
            width: isPhone ? legendMinWidth : '100%',
            maxWidth: isPhone ? undefined : LEGEND_MAX_W,
            alignSelf: 'center',
            alignItems: 'center',
          }}>
            <LegendHeader
              nameLabel={nameLabel}
              amountLabel={amountLabel}
              shareLabel={shareLabel}
              stacked={stacked}
              amountColW={legendAmountW}
              shareColW={legendShareW}
            />
            <LegendRows
              segments={segments}
              total={total}
              frequency={frequency}
              currency={currency}
              daysInMonth={daysInMonth}
              stacked={stacked}
              amountColW={legendAmountW}
              shareColW={legendShareW}
            />
          </View>
          </TableHorizontalScroll>
        ) : (
          <Text style={{ ...T.helper }}>{emptyLabel}</Text>
        )}
      </View>
    </View>
  );
}
