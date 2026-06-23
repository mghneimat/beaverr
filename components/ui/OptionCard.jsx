import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, OPTION_CARD, R } from '../../constants/onboarding-theme';
import { useClearOnboardingValidation } from '../../lib/onboardingValidationClear';

/**
 * Selectable option card — blue/navy design system.
 * Fixed height: label-only cards reserve a subtitle line so all rows match goalIntents-style cards.
 */
export function OptionCard({ icon, label, subtitle, selected, onPress, style }) {
  const [hovered, setHovered] = useState(false);
  const clearValidation = useClearOnboardingValidation();

  const handlePress = () => {
    clearValidation?.();
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${label}, ${subtitle}` : label}
      accessibilityState={{ selected }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => ([{
        minHeight: OPTION_CARD.minHeight,
        paddingVertical: OPTION_CARD.paddingVertical,
        paddingHorizontal: OPTION_CARD.paddingHorizontal,
        borderRadius: R.input,
        borderWidth: 1.5,
        borderColor: selected ? C.accent : C.border,
        backgroundColor: selected
          ? C.infoBg
          : pressed
            ? C.overlayPressed
            : hovered
              ? C.bg
              : C.surface,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
      }, style])}
    >
      {icon ? (
        <Text style={{ fontSize: 20, lineHeight: 24, marginRight: 12 }}>{icon}</Text>
      ) : null}

      <View style={{ flex: 1, minWidth: 0, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'flex-start' }}>
        <Text
          style={{
            fontSize: 15,
            color: selected ? C.accent : C.text,
            fontWeight: selected ? '600' : '400',
            lineHeight: OPTION_CARD.labelLineHeight,
            textAlign: 'left',
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontSize: 13,
              color: C.muted,
              lineHeight: OPTION_CARD.subtitleLineHeight,
              marginTop: OPTION_CARD.subtitleMarginTop,
              textAlign: 'left',
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {selected ? (
        <View style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: C.pillSelectedBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 10,
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: 12, lineHeight: 14, fontWeight: '700' }}>
            {'✓'}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default OptionCard;
