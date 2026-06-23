import { useState } from 'react';

import { View, Pressable, Platform, StyleSheet } from 'react-native';

import { Text } from '@gluestack-ui/themed';

import Animated, { interpolate, useAnimatedStyle, LinearTransition } from 'react-native-reanimated';

import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import { DASHBOARD_MOTION_DURATION } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';

import { InfoIcon } from '../app/AppNavIcons';

import StatusChip from './StatusChip';
import AnimatedCollapse from './AnimatedCollapse';

import { getDashboardCardTones, resolveDashboardCardTone } from './dashboardCardTones';
import { GLASS_ON_MESH } from '../../constants/dashboard-showcase';
import { useJarGridEnterProgress } from './useJarGridEnterProgress';
import { formatSignedCurrency } from '../../lib/finance';
import SettleCrossfade from '../ui/SettleCrossfade';



const INFO_SIZE = 22;

const INFO_HIT = 40;



function InfoIconButton({ onPress, accessibilityLabel, tone, glass = false }) {

  const [hovered, setHovered] = useState(false);

  const [pressed, setPressed] = useState(false);

  const palette = tone ? getDashboardCardTones()[tone] : null;

  const iconColor = glass
    ? (hovered || pressed ? GLASS_ON_MESH.iconActive : GLASS_ON_MESH.icon)
    : hovered || pressed
      ? (palette?.valueColor ?? C.primary)
      : (palette?.iconColor ?? C.muted);

  const backgroundColor = glass
    ? (pressed ? 'rgba(255,255,255,0.18)' : hovered ? 'rgba(255,255,255,0.12)' : 'transparent')
    : pressed
      ? (palette?.bgPressed ?? C.overlayPressed)
      : hovered
        ? (palette?.bgHover ?? C.overlayHover)
        : 'transparent';



  return (

    <Pressable

      onPress={onPress}

      accessibilityRole="button"

      accessibilityLabel={accessibilityLabel}

      onPressIn={() => setPressed(true)}

      onPressOut={() => setPressed(false)}

      onHoverIn={() => setHovered(true)}

      onHoverOut={() => setHovered(false)}

      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}

      style={{

        width: INFO_HIT,

        height: INFO_HIT,

        alignItems: 'center',

        justifyContent: 'center',

        borderRadius: R.input,

        backgroundColor,

        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),

      }}

    >

      <InfoIcon color={iconColor} size={INFO_SIZE} />

    </Pressable>

  );

}



/**

 * Metric card — card press navigates; info icon opens modal; optional frequency slot stays outside pressable.

 */

export default function MetricExplainCard({

  label,

  labelIcon,

  value,

  amountValue,

  amountCurrency,

  amountShowPlus = false,

  subtitle,

  valueMeta,

  footerLabel,

  footerMeta,

  statusChip,

  statusLabel,

  statusColor,

  frequencySlot,

  frequencySlotVisible,

  frequencyControl,

  frequencyControlVisible,

  valueAnimationKey,

  layoutAnimated = false,

  onPress,

  onInfoPress,

  variant = 'compact',

  tone,

  accessibilityLabel,

  infoAccessibilityLabel,

  style,

  enterKey,

  enterIndex = 0,

  trailingInset = 0,

  dimmed = false,

}) {

  const [hovered, setHovered] = useState(false);

  const [pressed, setPressed] = useState(false);

  const reduceMotion = useReducedMotion();

  const isDimmed = dimmed;

  const Container = layoutAnimated && !reduceMotion ? Animated.View : View;

  const containerLayoutProps = layoutAnimated && !reduceMotion
    ? { layout: LinearTransition.duration(DASHBOARD_MOTION_DURATION) }
    : {};

  const showFrequencySlot = frequencySlot != null && (frequencySlotVisible ?? true) && frequencyControl == null;

  const showFrequencyControl = frequencyControl != null && (frequencyControlVisible ?? true);

  const glassAnimated = variant === 'glass' && enterKey != null;
  const enterProgress = useJarGridEnterProgress(glassAnimated ? enterKey : null, enterIndex);

  const glassLayerStyle = useAnimatedStyle(() => ({
    opacity: glassAnimated
      ? interpolate(enterProgress.value, [0, 1], [0.2, 1])
      : 1,
  }));



  const isHero = variant === 'hero';

  const isPanel = variant === 'hero-panel';

  const isSnapshot = variant === 'snapshot';

  const isGlass = variant === 'glass';

  const valueSize = isHero || isPanel ? 32 : 22;

  const valueLineHeight = isHero || isPanel ? 38 : 28;

  const padH = isHero ? 20 : isPanel ? 18 : 16;

  const padV = isHero ? 24 : isPanel ? 20 : isSnapshot ? 16 : 16;

  const headerControlsWidth = showFrequencyControl
    ? 96 + (onInfoPress ? INFO_HIT + 6 : 0)
    : (onInfoPress ? INFO_HIT - 8 : 0);

  const pressPadRight = padH + Math.max(headerControlsWidth, trailingInset);



  const toneStyle = isGlass ? null : resolveDashboardCardTone(tone, { hovered, pressed });

  const borderColor = isDimmed
    ? C.border
    : isGlass
      ? (hovered || pressed ? GLASS_ON_MESH.borderActive : GLASS_ON_MESH.border)
      : toneStyle
        ? toneStyle.borderColor
        : hovered || pressed
          ? C.chipSelectedBorder
          : C.border;

  const backgroundColor = isDimmed
    ? (pressed ? C.surfaceTint : hovered ? C.bg : C.bg)
    : isGlass
      ? (pressed ? GLASS_ON_MESH.fillPressed : hovered ? GLASS_ON_MESH.fillHover : GLASS_ON_MESH.fill)
      : toneStyle
        ? toneStyle.backgroundColor
        : pressed
          ? C.overlayPressed
          : hovered
            ? C.overlayHover
            : C.surface;

  const valueColor = isDimmed
    ? C.muted
    : isGlass
      ? GLASS_ON_MESH.value
      : (toneStyle?.valueColor || C.primary);

  const labelColor = isDimmed ? C.muted : (isGlass ? GLASS_ON_MESH.label : C.text);

  const footerColor = isDimmed ? C.muted : (isGlass ? GLASS_ON_MESH.footer : C.muted);

  const valueStyle = {
    fontSize: valueSize,
    lineHeight: valueLineHeight,
    fontWeight: '700',
    color: valueColor,
    letterSpacing: isHero ? -0.02 : 0,
    ...tabularNums,
  };

  const resolvedValueLabel = typeof amountValue === 'number'
    ? formatSignedCurrency(amountValue, amountCurrency, amountShowPlus)
    : value;

  const valueNode = typeof amountValue === 'number' ? (
    <Text style={valueStyle} numberOfLines={2}>
      {formatSignedCurrency(amountValue, amountCurrency, amountShowPlus)}
    </Text>
  ) : (
    <Text style={valueStyle} numberOfLines={2}>
      {value}
    </Text>
  );

  const valueBlock = valueAnimationKey != null ? (
    <SettleCrossfade animationKey={valueAnimationKey} slide={false}>
      {valueNode}
    </SettleCrossfade>
  ) : valueNode;

  const glassWebBlur = isGlass && Platform.OS === 'web'
    ? { backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }
    : {};



  const hoverHandlers = Platform.OS === 'web'

    ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }

    : {};



  return (

    <Container

      {...hoverHandlers}

      {...containerLayoutProps}

      style={{

        position: 'relative',

        flex: isPanel ? 1 : isHero ? undefined : 1,

        minWidth: isHero || isPanel ? undefined : 120,

        width: isHero ? '100%' : undefined,

        backgroundColor: glassAnimated ? 'transparent' : backgroundColor,

        borderRadius: R.card,

        borderWidth: 1,

        borderColor,

        overflow: glassAnimated ? 'hidden' : undefined,

        ...(toneStyle?.borderLeftWidth ? {

          borderLeftWidth: toneStyle.borderLeftWidth,

          borderLeftColor: toneStyle.borderLeftColor,

        } : {}),

        ...(isSnapshot ? { minHeight: 112 } : {}),

        ...(isGlass ? { minHeight: 88 } : {}),

        ...(glassAnimated ? {} : glassWebBlur),

        ...(Platform.OS === 'web' ? { transition: 'background-color 0.15s ease, border-color 0.15s ease' } : {}),

        ...style,

      }}

    >

      {glassAnimated ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor,
              borderRadius: R.card,
              pointerEvents: 'none',
              ...glassWebBlur,
            },
            glassLayerStyle,
          ]}
        />
      ) : null}

      <Pressable

        onPress={onPress}

        accessibilityRole="button"

        accessibilityLabel={accessibilityLabel ?? `${label}, ${resolvedValueLabel}`}

        onPressIn={() => setPressed(true)}

        onPressOut={() => setPressed(false)}

        onHoverIn={() => setHovered(true)}

        onHoverOut={() => setHovered(false)}

        style={{

          paddingHorizontal: padH,

          paddingTop: padV,

          paddingBottom: frequencySlot ? 8 : padV,

          paddingRight: pressPadRight,

          ...(Platform.OS === 'web' ? { cursor: onPress ? 'pointer' : 'default' } : {}),

        }}

      >

        <View

          style={{

            flexDirection: 'row',

            alignItems: 'center',

            gap: 6,

            marginBottom: isHero || isPanel ? 8 : 4,

            paddingRight: onInfoPress ? 4 : 0,

          }}

        >

          {labelIcon ? (

            <View style={{ flexShrink: 0 }}>{labelIcon}</View>

          ) : null}

          <Text style={{ ...T.fieldLabel, flex: 1, color: labelColor }} numberOfLines={2}>

            {label}

          </Text>

        </View>

        {valueBlock}

        {valueMeta ? (
          <View style={{ marginTop: isHero || isPanel ? 8 : 4 }}>
            {valueMeta}
          </View>
        ) : null}

        {statusChip ? (

          <StatusChip label={statusChip.label} variant={statusChip.variant} />

        ) : null}

        {subtitle ? (

          <Text style={{ ...T.helper, marginTop: isHero || isPanel ? 8 : 4 }} numberOfLines={3}>

            {subtitle}

          </Text>

        ) : null}

        {footerMeta ? (

          <View style={{ marginTop: statusChip ? 4 : 6 }}>

            {footerMeta}

          </View>

        ) : null}

        {!footerMeta && footerLabel ? (

          <Text style={{ ...T.caption, color: footerColor, marginTop: statusChip ? 4 : 6 }} numberOfLines={1}>

            {footerLabel}

          </Text>

        ) : null}

        {!statusChip && statusLabel ? (

          <Text style={{ ...T.caption, color: statusColor || C.muted, marginTop: 6 }} numberOfLines={3}>

            {statusLabel}

          </Text>

        ) : null}

      </Pressable>



      {showFrequencySlot ? (

        <AnimatedCollapse
          visible={showFrequencySlot}
          fallbackHeight={36}
          style={{ paddingHorizontal: padH }}
        >
          <View style={{ paddingBottom: padV }}>
            {frequencySlot}
          </View>
        </AnimatedCollapse>

      ) : null}



      {(showFrequencyControl || onInfoPress) ? (

        <View

          style={{

            position: 'absolute',

            top: padV - 4,

            right: padH - 4,

            zIndex: 1,

            flexDirection: 'row',

            alignItems: 'center',

            gap: 6,

            pointerEvents: 'box-none',

          }}

        >

          {showFrequencyControl ? frequencyControl : null}

          {onInfoPress ? (

            <InfoIconButton onPress={onInfoPress} accessibilityLabel={infoAccessibilityLabel} tone={tone} glass={isGlass} />

          ) : null}

        </View>

      ) : null}

    </Container>

  );

}

