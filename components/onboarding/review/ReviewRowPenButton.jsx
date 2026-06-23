import { View, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C } from '../../../constants/onboarding-theme';
import OnboardingPressable from '../OnboardingPressable';

export const REVIEW_PEN_SLOT = 26;
export const REVIEW_PEN_ICON = 13;
export const REVIEW_PEN_GAP = 12;

const webNoMotion = Platform.OS === 'web'
  ? {
    transitionProperty: 'none',
    transitionDuration: '0s',
    animation: 'none',
    animationDuration: '0s',
  }
  : null;

/**
 * Fixed-size pen slot — space always reserved; pen mounts/unmounts instantly (no fade/slide).
 */
export default function ReviewRowPenButton({ visible, onPress, accessibilityLabel }) {
  return (
    <View
      style={{
        width: REVIEW_PEN_SLOT,
        height: REVIEW_PEN_SLOT,
        alignItems: 'center',
        justifyContent: 'center',
        ...webNoMotion,
      }}
    >
      {visible ? (
        <OnboardingPressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          style={({ pressed, hovered }) => ({
            width: REVIEW_PEN_SLOT,
            height: REVIEW_PEN_SLOT,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            backgroundColor: pressed ? C.overlayPressed : hovered ? C.overlayHover : C.surfaceTint,
            ...(Platform.OS === 'web' ? { cursor: 'pointer', ...webNoMotion } : {}),
          })}
        >
          <Text
            style={{
              fontSize: REVIEW_PEN_ICON,
              lineHeight: REVIEW_PEN_ICON,
              color: C.accent,
              ...(Platform.OS === 'web' ? webNoMotion : {}),
            }}
          >
            ✎
          </Text>
        </OnboardingPressable>
      ) : null}
    </View>
  );
}
