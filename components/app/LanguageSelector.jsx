import { useState } from 'react';
import { View, Text, Pressable, Platform, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { C, R } from '../../constants/onboarding-theme';
import { LanguagesIcon } from './AppNavIcons';
import { elevationShadow } from '../../lib/shadow';

/** Match AppSidebar nav row geometry — icon must never shift or vanish on collapse */
const ICON_SLOT = 36;
const NAV_ICON_SIZE = 16;
const ROW_HEIGHT = 44;
const ROW_MARGIN_H = 8;
const ROW_MARGIN_V = 2;
const ROW_PAD_LEFT = 6;
const LABEL_LEFT = ROW_PAD_LEFT + ICON_SLOT + 4;
const OPTION_H = 46;
/** Max visible rows before scroll — safe for many locales without shifting sidebar layout */
const DROPDOWN_MAX_H = OPTION_H * 5 + 12;

const iconSlotStyle = {
  width: ICON_SLOT,
  height: ICON_SLOT,
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  ...(Platform.OS === 'web' ? { transform: [{ translateZ: 0 }] } : {}),
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const LANGUAGES = [
  { code: 'en', displayCode: 'EN', label: 'English', flag: '🇬🇧' },
  { code: 'cs', displayCode: 'CS', label: 'Čeština', flag: '🇨🇿' },
];

function LanguageFlag({ flag, height = 12 }) {
  return (
    <Text style={{ fontSize: height * 1.25, lineHeight: height * 1.35 }}>{flag}</Text>
  );
}

function LanguageOptionRow({ displayCode, flag, label, selected, onPress }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const backgroundColor = selected || pressed
    ? C.navSelectedBg
    : hovered
      ? C.overlayHover
      : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: OPTION_H,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor,
        ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background-color 0.15s ease' } : {}),
      }}
    >
      <Text style={{
        width: 28,
        fontSize: 12,
        fontWeight: '700',
        color: C.muted,
        letterSpacing: 0.6,
      }}>
        {displayCode}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12, gap: 6 }}>
        <Text style={{
          fontSize: 14,
          fontWeight: selected ? '600' : '400',
          color: selected ? C.primary : C.text,
        }}>
          {label}
        </Text>
        <LanguageFlag flag={flag} />
      </View>
    </Pressable>
  );
}

export default function LanguageSelector({
  locale,
  open,
  onToggle,
  onSelect,
  triggerLabel,
  labelAnimatedStyle,
  rowCollapseAnimatedStyle,
  showTooltip = false,
  panelStyle,
  insetStyle,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const chipBackgroundColor = open
    ? C.navSelectedBg
    : pressed
      ? C.overlayPressed
      : hovered
        ? C.overlayHover
        : 'transparent';

  const iconColor = open ? C.primary : C.muted;
  const a11yLabel = triggerLabel;
  const collapsedIconRail = showTooltip;

  return (
    <View style={{
      marginBottom: 4,
      position: 'relative',
      zIndex: open ? 40 : 0,
      ...(Platform.OS === 'android' ? { elevation: open ? 8 : 0 } : {}),
    }}>
      <AnimatedPressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityState={{ expanded: open }}
        {...(Platform.OS === 'web' && showTooltip ? { title: a11yLabel } : {})}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[
          {
            position: 'relative',
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: ROW_HEIGHT,
            marginVertical: ROW_MARGIN_V,
            borderRadius: collapsedIconRail ? ICON_SLOT / 2 : R.input,
            backgroundColor: collapsedIconRail ? 'transparent' : chipBackgroundColor,
            ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background-color 0.15s ease' } : {}),
          },
          rowCollapseAnimatedStyle,
        ]}
      >
        {collapsedIconRail && chipBackgroundColor !== 'transparent' ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: (ROW_HEIGHT - ICON_SLOT) / 2,
              left: 0,
              width: ICON_SLOT,
              height: ICON_SLOT,
              borderRadius: ICON_SLOT / 2,
              backgroundColor: chipBackgroundColor,
              ...(Platform.OS === 'web' ? { transition: 'background-color 0.15s ease' } : {}),
            }}
          />
        ) : null}
        <View style={iconSlotStyle} collapsable={false}>
          <LanguagesIcon color={iconColor} size={NAV_ICON_SIZE} />
        </View>
        {labelAnimatedStyle ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: LABEL_LEFT,
                right: 8,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                pointerEvents: 'none',
              },
              labelAnimatedStyle,
            ]}
          >
            <Text
              numberOfLines={1}
              style={{
                fontSize: 14,
                fontWeight: open ? '600' : '500',
                color: open ? C.primary : C.muted,
              }}
            >
              {triggerLabel}
            </Text>
          </Animated.View>
        ) : (
          <View style={{ flex: 1, marginLeft: 4 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 14,
                fontWeight: open ? '600' : '500',
                color: open ? C.primary : C.muted,
              }}
            >
              {triggerLabel}
            </Text>
          </View>
        )}
      </AnimatedPressable>

      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          {
            position: 'absolute',
            left: ROW_MARGIN_H,
            right: ROW_MARGIN_H,
            bottom: ROW_HEIGHT + ROW_MARGIN_V * 2,
            zIndex: 50,
          },
          panelStyle,
          insetStyle,
        ]}
      >
        <View style={{
          backgroundColor: C.surface,
          borderRadius: R.chip,
          overflow: 'hidden',
          ...elevationShadow({ offsetY: 6, blur: 16, opacity: 0.12 }),
          ...(Platform.OS !== 'web' ? { borderWidth: 1, borderColor: C.border } : {}),
        }}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: DROPDOWN_MAX_H }}
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            {LANGUAGES.map((lang) => (
              <LanguageOptionRow
                key={lang.code}
                displayCode={lang.displayCode}
                flag={lang.flag}
                label={lang.label}
                selected={locale === lang.code}
                onPress={() => onSelect(lang.code)}
              />
            ))}
          </ScrollView>
        </View>
        <View style={{ alignItems: 'center', marginTop: -1 }}>
          <View style={{
            width: 0,
            height: 0,
            borderLeftWidth: 7,
            borderRightWidth: 7,
            borderTopWidth: 7,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: C.surface,
          }} />
        </View>
      </Animated.View>
    </View>
  );
}
