import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { C, R, tabularNums } from '../../constants/onboarding-theme';
import { formatCurrency } from '../../lib/finance';
import { getBurnRateColors } from '../../lib/burnRate';
import {
  BURN_RATE_ROW_DURATION_MS,
  BURN_RATE_ROW_LEAD_MS,
  BURN_RATE_ROW_STAGGER_MS,
  BURN_RATE_SEGMENT_DURATION_MS,
  BURN_RATE_SEGMENT_STAGGER_MS,
  DASHBOARD_MOTION_EASE,
} from '../../lib/dashboardMotion';
import { useSettleCrossfade } from '../../lib/useSettleCrossfade';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { BreakdownCell, BreakdownRow } from './BreakdownTablePrimitives';

function useDelayedDisplay(animationKey, nextDisplay, { slide = false } = {}) {
  const [display, setDisplay] = useState(nextDisplay);
  const pending = useRef(nextDisplay);
  const prevKey = useRef(animationKey);
  pending.current = nextDisplay;

  const onMidpoint = useCallback(() => {
    setDisplay(pending.current);
  }, []);

  const { animatedStyle } = useSettleCrossfade(animationKey, { slide, onMidpoint });

  useEffect(() => {
    if (prevKey.current === animationKey) {
      setDisplay(nextDisplay);
    }
    prevKey.current = animationKey;
  }, [animationKey, nextDisplay]);

  return { display, animatedStyle };
}

function formatLegendSharePct(sharePct) {
  if (sharePct == null || Number.isNaN(sharePct)) return '—';
  return `${sharePct.toFixed(2)}%`;
}

function BurnRateBarSegment({ ratio, color, index, animationKey, reduceMotion }) {
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      index * BURN_RATE_SEGMENT_STAGGER_MS,
      withTiming(1, { duration: BURN_RATE_SEGMENT_DURATION_MS, easing: DASHBOARD_MOTION_EASE }),
    );
  }, [animationKey, color, index, progress, ratio, reduceMotion]);

  const segmentStyle = useAnimatedStyle(() => ({
    flex: Math.max(ratio * progress.value, 0),
    opacity: 0.4 + 0.6 * progress.value,
  }));

  return (
    <Animated.View style={[{ height: '100%', backgroundColor: color }, segmentStyle]} />
  );
}

export function BurnRateBar({ segments, income, isOvercommitted, animationKey, barScale = 1 }) {
  const reduceMotion = useReducedMotion();
  const burnColors = getBurnRateColors();
  const trackScale = useSharedValue(reduceMotion ? 1 : 0.96);
  const trackOpacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      trackScale.value = 1;
      trackOpacity.value = 1;
      return;
    }
    trackScale.value = 0.96;
    trackOpacity.value = 0;
    trackOpacity.value = withTiming(1, { duration: 220, easing: DASHBOARD_MOTION_EASE });
    trackScale.value = withTiming(1, { duration: 320, easing: DASHBOARD_MOTION_EASE });
  }, [animationKey, reduceMotion, trackOpacity, trackScale]);

  const trackStyle = useAnimatedStyle(() => ({
    opacity: trackOpacity.value,
    transform: [{ scaleX: trackScale.value }],
  }));

  if (!income || income <= 0) {
    return (
      <Animated.View style={[{
        height: 14,
        borderRadius: R.pill,
        backgroundColor: burnColors.track,
      }, trackStyle]}
      />
    );
  }

  return (
    <Animated.View style={[{
      flexDirection: 'row',
      height: 14,
      borderRadius: R.pill,
      overflow: 'hidden',
      backgroundColor: burnColors.track,
      borderWidth: isOvercommitted ? 1 : 0,
      borderColor: C.danger,
      transformOrigin: 'left center',
    }, trackStyle]}
    >
      {segments.map((seg, index) => (
        <BurnRateBarSegment
          key={seg.key}
          ratio={(seg.value * barScale) / income}
          color={seg.color}
          index={index}
          animationKey={animationKey}
          reduceMotion={reduceMotion}
        />
      ))}
    </Animated.View>
  );
}

export function BurnRateAnimatedAmount({
  text,
  amountValue,
  currency,
  animationKey,
  style,
  numberOfLines = 1,
}) {
  const nextDisplay = typeof amountValue === 'number'
    ? formatCurrency(amountValue, currency)
    : text;
  const { display, animatedStyle } = useDelayedDisplay(animationKey, nextDisplay);

  return (
    <Animated.View style={animatedStyle}>
      <Text style={style} numberOfLines={numberOfLines}>
        {display}
      </Text>
    </Animated.View>
  );
}

/** Income pill in burn-rate header — animates label + amount together and resizes smoothly. */
export function BurnRateIncomePill({ label, amount, amountValue, currency, animationKey, isOvercommitted = false }) {
  const { display, animatedStyle: contentStyle } = useDelayedDisplay(animationKey, amount, { slide: true });
  const pillBg = isOvercommitted ? C.dangerBg : C.heroIncomeBg;
  const pillBorder = isOvercommitted ? C.danger : C.heroIncomeBorder;
  const textColor = isOvercommitted ? C.danger : C.heroIncomeBadge;
  const textStyle = { fontSize: 12, fontWeight: '600', color: textColor };

  return (
    <Animated.View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: R.pill,
        backgroundColor: pillBg,
        borderWidth: 1,
        borderColor: pillBorder,
        alignSelf: 'flex-start',
        overflow: 'hidden',
      }}
    >
      {isOvercommitted ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={textStyle}>{label}</Text>
        </View>
      ) : (
        <Animated.View style={contentStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={textStyle}>{label}</Text>
            <Text style={{ ...textStyle, ...tabularNums }}>{display}</Text>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export function BurnRateHorizontalLegend({ items, animationKey, amountAnimationKey }) {
  if (!items?.length) return null;

  return (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      gap: 32,
      rowGap: 14,
      marginTop: 12,
      width: '100%',
    }}>
      {items.map((item, index) => (
        <BurnRateHorizontalLegendItem
          key={item.key}
          index={index}
          color={item.color}
          label={item.label}
          amount={item.amount}
          amountValue={item.amountValue}
          currency={item.currency}
          sharePct={item.sharePct}
          onPress={item.onPress}
          hint={item.hint}
          animationKey={animationKey}
          amountAnimationKey={amountAnimationKey}
        />
      ))}
    </View>
  );
}

function BurnRateHorizontalLegendItem({
  color,
  label,
  amount,
  amountValue,
  currency,
  sharePct,
  amountAnimationKey,
  index,
  onPress,
  hint,
  animationKey,
}) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const enterProgress = useSharedValue(reduceMotion ? 1 : 0);
  const swatchScale = useSharedValue(reduceMotion ? 1 : 0);
  const pctDisplay = formatLegendSharePct(sharePct);

  useEffect(() => {
    if (reduceMotion) {
      enterProgress.value = 1;
      swatchScale.value = 1;
      return;
    }
    enterProgress.value = 0;
    swatchScale.value = 0;
    const delay = BURN_RATE_ROW_LEAD_MS + index * BURN_RATE_ROW_STAGGER_MS;
    enterProgress.value = withDelay(
      delay,
      withTiming(1, { duration: BURN_RATE_ROW_DURATION_MS, easing: DASHBOARD_MOTION_EASE }),
    );
    swatchScale.value = withDelay(
      delay + 40,
      withTiming(1, { duration: 200, easing: DASHBOARD_MOTION_EASE }),
    );
  }, [animationKey, enterProgress, index, reduceMotion, swatchScale]);

  const itemEnterStyle = useAnimatedStyle(() => ({
    opacity: enterProgress.value,
    transform: [{ translateY: (1 - enterProgress.value) * 6 }],
  }));

  const swatchStyle = useAnimatedStyle(() => ({
    transform: [{ scale: swatchScale.value }],
  }));

  const hoverProps = Platform.OS === 'web'
    ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }
    : {};

  return (
    <Animated.View style={itemEnterStyle}>
      <View {...hoverProps}>
        <Pressable
          onPress={onPress}
          disabled={!onPress}
          accessibilityRole={onPress ? 'button' : 'text'}
          accessibilityLabel={`${label}, ${amount}, ${pctDisplay}`}
          accessibilityHint={hint}
          style={({ pressed: isPressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: R.input,
            backgroundColor: isPressed || hovered ? C.breakdownRowHover : 'transparent',
            opacity: isPressed ? 0.92 : 1,
            ...(Platform.OS === 'web' && onPress ? { cursor: 'pointer' } : {}),
          })}
        >
          <Animated.View style={[{
            width: 10,
            height: 10,
            borderRadius: 2,
            backgroundColor: color,
            flexShrink: 0,
          }, swatchStyle]}
          />
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: C.muted }} numberOfLines={1}>
              {`${label} `}
            </Text>
            <BurnRateAnimatedAmount
              text={amount}
              amountValue={amountValue}
              currency={currency}
              animationKey={amountAnimationKey}
              style={{ fontSize: 13, fontWeight: '700', color: C.text, ...tabularNums }}
            />
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, ...tabularNums }} numberOfLines={1}>
              {`(${pctDisplay})`}
            </Text>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function burnRateRowBackground({ index, pressed, hovered }) {
  const striped = index % 2 === 1;
  const base = striped ? C.breakdownStripeBg : 'transparent';
  if (pressed || hovered) return C.breakdownRowHover;
  return base;
}

export function BurnRateColumnHeaders({
  nameLabel,
  shareLabel,
  amountLabel,
  shareColMinW,
  amountColMinW,
  animationKey,
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      BURN_RATE_ROW_LEAD_MS,
      withTiming(1, { duration: BURN_RATE_ROW_DURATION_MS, easing: DASHBOARD_MOTION_EASE }),
    );
  }, [animationKey, progress, reduceMotion]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 6 }],
  }));

  return (
    <Animated.View style={headerStyle}>
      <BreakdownRow style={{ paddingHorizontal: 14, marginBottom: 8, gap: 10 }}>
        <View style={{ width: 36, flexShrink: 0 }} />
        <BreakdownCell flex={1}>
          <Text style={{
            fontSize: 11,
            fontWeight: '600',
            color: C.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
          >
            {nameLabel}
          </Text>
        </BreakdownCell>
        <BreakdownCell minWidth={shareColMinW} align="center">
          <Text style={{
            fontSize: 11,
            fontWeight: '600',
            color: C.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
            textAlign: 'center',
          }}
          >
            {shareLabel}
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
            {amountLabel}
          </Text>
        </BreakdownCell>
      </BreakdownRow>
    </Animated.View>
  );
}

export function BurnRateLegendRow({
  color,
  label,
  sharePct,
  amount,
  amountValue,
  currency,
  amountAnimationKey,
  index,
  onPress,
  hint,
  shareColMinW,
  amountColMinW,
  animationKey,
}) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const enterProgress = useSharedValue(reduceMotion ? 1 : 0);
  const swatchScale = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      enterProgress.value = 1;
      swatchScale.value = 1;
      return;
    }
    enterProgress.value = 0;
    swatchScale.value = 0;
    const delay = BURN_RATE_ROW_LEAD_MS + index * BURN_RATE_ROW_STAGGER_MS;
    enterProgress.value = withDelay(
      delay,
      withTiming(1, { duration: BURN_RATE_ROW_DURATION_MS, easing: DASHBOARD_MOTION_EASE }),
    );
    swatchScale.value = withDelay(
      delay + 40,
      withTiming(1, { duration: 200, easing: DASHBOARD_MOTION_EASE }),
    );
  }, [animationKey, enterProgress, index, reduceMotion, swatchScale]);

  const rowEnterStyle = useAnimatedStyle(() => ({
    opacity: enterProgress.value,
    transform: [{ translateX: (1 - enterProgress.value) * -14 }],
  }));

  const swatchStyle = useAnimatedStyle(() => ({
    transform: [{ scale: swatchScale.value }],
  }));

  const rowHoverProps = Platform.OS === 'web'
    ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }
    : {};
  const bg = burnRateRowBackground({
    index,
    pressed,
    hovered: Platform.OS === 'web' && hovered,
  });

  return (
    <Animated.View
      style={[{ width: '100%', borderRadius: R.pill, backgroundColor: bg }, rowEnterStyle]}
    >
      <View {...rowHoverProps} style={{ width: '100%', borderRadius: R.pill }}>
        <Pressable
          onPress={onPress}
          disabled={!onPress}
          accessibilityRole={onPress ? 'button' : 'text'}
          accessibilityLabel={`${label}, ${sharePct}%, ${amount}`}
          accessibilityHint={hint}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 10,
            paddingHorizontal: 14,
            minHeight: 52,
            width: '100%',
            borderRadius: R.pill,
            backgroundColor: 'transparent',
            opacity: pressed ? 0.92 : 1,
            ...(Platform.OS === 'web' && onPress ? { cursor: 'pointer' } : {}),
          }}
        >
          <View style={{ width: 36, alignItems: 'center', flexShrink: 0 }}>
            <Animated.View style={[{
              width: 12,
              height: 12,
              borderRadius: 3,
              backgroundColor: color,
            }, swatchStyle]}
            />
          </View>
          <BreakdownCell flex={1}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: C.text }} numberOfLines={2}>
              {label}
            </Text>
          </BreakdownCell>
          <BreakdownCell minWidth={shareColMinW} align="center">
            <Text style={{ fontSize: 13, fontWeight: '500', color: C.muted, ...tabularNums }} numberOfLines={1}>
              {sharePct != null ? `${sharePct}%` : '—'}
            </Text>
          </BreakdownCell>
          <BreakdownCell minWidth={amountColMinW} align="right">
            <BurnRateAnimatedAmount
              text={amount}
              amountValue={amountValue}
              currency={currency}
              animationKey={amountAnimationKey}
              style={{ fontSize: 14, fontWeight: '700', color: C.primary, ...tabularNums }}
            />
          </BreakdownCell>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function BurnRateSpendHero({ amount, amountValue, currency, burnAnimationKey, amountAnimationKey }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      BURN_RATE_ROW_LEAD_MS + BURN_RATE_ROW_STAGGER_MS * 2,
      withTiming(1, { duration: 340, easing: DASHBOARD_MOTION_EASE }),
    );
  }, [burnAnimationKey, progress, reduceMotion]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 10 }],
  }));

  return (
    <Animated.View style={heroStyle}>
      <BurnRateAnimatedAmount
        text={amount}
        amountValue={amountValue}
        currency={currency}
        animationKey={amountAnimationKey}
        style={{ fontSize: 32, fontWeight: '700', color: C.positive, ...tabularNums }}
      />
    </Animated.View>
  );
}
