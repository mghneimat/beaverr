import { useState } from 'react';
import { Pressable, Text, Platform } from 'react-native';
import { C } from '../../constants/onboarding-theme';

/**
 * A single pill toggle with hover/press/selected states.
 * Updated to match UI Examples design — selected pills get navy bg, unselected get light bg with border.
 *
 * @param {Object} props
 * @param {string} props.label - Display label
 * @param {boolean} props.selected - Whether this pill is selected
 * @param {Function} props.onPress - Press handler
 * @param {number} [props.paddingVertical=14] - Vertical padding
 * @param {number} [props.paddingHorizontal=20] - Horizontal padding
 * @param {number} [props.fontSize=13] - Label font size
 * @param {string} [props.fontWeight='600'] - Label font weight
 * @param {boolean} [props.darker=false] - Stronger overlay for Yes/No toggles
 * @param {number} [props.borderRadius=0] - Border radius (0 = flush inside container)
 * @param {'default'|'segment'|'choice'} [props.variant='default'] - segment = inset track; choice = wrap chips (navy selected)
 * @param {number} [props.minHeight=44] - Minimum touch height
 * @param {boolean} [props.expand=true] - When false, pill sizes to label width
 * @param {boolean} [props.hideSelectedSurface=false] - Segment only: text state, external indicator
 */
export default function PillToggle({
  label,
  selected,
  onPress,
  paddingVertical = 14,
  paddingHorizontal = 20,
  fontSize = 13,
  fontWeight = '500',
  darker = false,
  borderRadius = 0,
  variant = 'default',
  minHeight = 44,
  expand = true,
  hideSelectedSurface = false,
  style,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const isSegment = variant === 'segment';
  const isChoice = variant === 'choice';

  let bgColor;
  let borderWidth;
  let borderColor;
  let textColor;

  if (isChoice) {
    if (selected) {
      bgColor = pressed ? C.primaryPressed : C.selectedBg;
      borderWidth = 0;
      textColor = C.selectedText;
    } else {
      bgColor = pressed ? C.overlayPressed : hovered ? C.surfaceTint : C.surface;
      borderWidth = 1.5;
      borderColor = C.border;
      textColor = C.text;
    }
  } else if (isSegment) {
    if (hideSelectedSurface) {
      bgColor = pressed
        ? C.overlayHoverDarker
        : hovered
          ? C.overlayHover
          : 'transparent';
      borderWidth = 0;
      textColor = selected ? C.text : C.muted;
    } else {
      if (selected) {
        bgColor = pressed
          ? C.overlayPressed
          : hovered
            ? C.surfaceTint
            : C.surface;
      } else {
        bgColor = pressed
          ? C.overlayHoverDarker
          : hovered
            ? C.overlayHover
            : 'transparent';
      }
      borderWidth = selected ? 1 : 0;
      borderColor = C.border;
      textColor = selected ? C.text : C.muted;
    }
  } else {
    bgColor = selected
      ? pressed
        ? C.pillSelectedPressed
        : C.pillSelectedBg
      : hovered
        ? C.surfaceTint
        : pressed
          ? C.surfaceTint
          : C.pillUnselectedBg;
    borderWidth = selected ? 0 : 1;
    borderColor = C.pillUnselectedBorder;
    textColor = selected ? C.pillSelectedText : C.pillUnselectedText;
  }

  const resolvedFontWeight = (isSegment || isChoice) && selected ? '600' : fontWeight;

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
      style={[{
        ...(expand ? { flex: 1 } : {}),
        minHeight,
        paddingVertical,
        paddingHorizontal,
        borderRadius,
        backgroundColor: bgColor,
        borderWidth,
        borderColor,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: hideSelectedSurface ? 1 : undefined,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }, style]}
    >
      <Text style={{
        fontSize,
        fontWeight: resolvedFontWeight,
        color: textColor,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}
