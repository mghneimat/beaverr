import { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, R, T, SHADOW } from '../../constants/onboarding-theme';
import { useClearOnboardingValidation } from '../../lib/onboardingValidationClear';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import PillToggle from './PillToggle';

function InlineChoicePill({ label, selected, onPress }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        minWidth: 52,
        minHeight: 36,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: R.button,
        backgroundColor: selected
          ? (pressed ? C.pillSelectedPressed : C.pillSelectedBg)
          : (pressed ? C.overlayPressed : hovered ? C.surfaceTint : 'transparent'),
        borderWidth: selected ? 0 : 1.5,
        borderColor: C.border,
        alignItems: 'center',
        justifyContent: 'center',
        ...(selected ? SHADOW.button : {}),
      }}
    >
      <Text style={{
        ...T.pillLabel,
        fontSize: 14,
        color: selected ? C.pillSelectedText : C.muted,
        fontWeight: selected ? '600' : '500',
      }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ChoicePill({ label, selected, onPress, stacked = false }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        ...(stacked ? { width: '100%' } : { flex: 1 }),
        minHeight: 44,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: R.button,
        backgroundColor: selected
          ? (pressed ? C.pillSelectedPressed : C.pillSelectedBg)
          : (pressed ? C.pillUnselectedBg : hovered ? C.surfaceTint : C.pillUnselectedBg),
        borderWidth: selected ? 0 : 1.5,
        borderColor: C.pillUnselectedBorder,
        alignItems: 'center',
        justifyContent: 'center',
        ...(selected ? SHADOW.button : {}),
      }}
    >
      <Text style={{
        ...T.btnPrimary,
        fontSize: 15,
        color: selected ? C.pillSelectedText : C.pillUnselectedText,
        textAlign: 'center',
      }}
      numberOfLines={stacked ? 2 : 1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Yes / No choice.
 * @param {boolean|null|undefined} value — when allowUnset, null means neither selected
 * @param {boolean} [allowUnset=false] — keep pills empty until the user taps
 * @param {'default'|'segment'|'inline'} [variant='segment'] — segment = inset track (not CTA-style); default = full blue pills
 */
export default function YesNoToggle({
  value,
  onChange,
  yesLabel,
  noLabel,
  containerStyle,
  allowUnset = false,
  variant = 'segment',
}) {
  const { t } = useI18n();
  const clearValidation = useClearOnboardingValidation();

  useEffect(() => {
    if (!allowUnset && value == null) {
      onChange(false);
    }
  }, [value, onChange, allowUnset]);

  const handleChange = (next) => {
    clearValidation?.();
    onChange(next);
  };

  const noSelected = allowUnset ? value === false : (value ?? false) === false;
  const yesSelected = allowUnset ? value === true : (value ?? false) === true;
  const resolvedNoLabel = noLabel ?? t('common.no');
  const resolvedYesLabel = yesLabel ?? t('common.yes');
  const { isPhone } = useOnboardingLayout();
  const stackPills = isPhone && variant === 'default';

  if (variant === 'inline') {
    return (
      <View
        accessibilityRole="radiogroup"
        style={[{ flexDirection: 'row', gap: 8, flexShrink: 0 }, containerStyle]}
      >
        <InlineChoicePill
          label={resolvedYesLabel}
          selected={yesSelected}
          onPress={() => handleChange(true)}
        />
        <InlineChoicePill
          label={resolvedNoLabel}
          selected={noSelected}
          onPress={() => handleChange(false)}
        />
      </View>
    );
  }

  if (variant === 'segment') {
    return (
      <View
        accessibilityRole="radiogroup"
        style={[
          {
            flexDirection: 'row',
            gap: 4,
            backgroundColor: C.bg,
            borderRadius: R.pill,
            padding: 4,
            borderWidth: 1,
            borderColor: C.border,
          },
          containerStyle,
        ]}
      >
        <PillToggle
          label={resolvedNoLabel}
          selected={noSelected}
          onPress={() => handleChange(false)}
          variant="segment"
          borderRadius={R.button}
          minHeight={40}
          paddingVertical={10}
          paddingHorizontal={16}
          fontSize={14}
          fontWeight="500"
        />
        <PillToggle
          label={resolvedYesLabel}
          selected={yesSelected}
          onPress={() => handleChange(true)}
          variant="segment"
          borderRadius={R.button}
          minHeight={40}
          paddingVertical={10}
          paddingHorizontal={16}
          fontSize={14}
          fontWeight="500"
        />
      </View>
    );
  }

  return (
    <View style={[{ flexDirection: stackPills ? 'column' : 'row', gap: 10, marginBottom: 0 }, containerStyle]}>
      <ChoicePill
        label={resolvedNoLabel}
        selected={noSelected}
        onPress={() => handleChange(false)}
        stacked={stackPills}
      />
      <ChoicePill
        label={resolvedYesLabel}
        selected={yesSelected}
        onPress={() => handleChange(true)}
        stacked={stackPills}
      />
    </View>
  );
}
