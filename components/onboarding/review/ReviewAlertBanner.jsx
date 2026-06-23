import { View, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { R } from '../../../constants/onboarding-theme';
import OnboardingPressable from '../OnboardingPressable';

const MESSAGE_LINE = 18;

/** Slightly warmer than default C.warning* tokens — review alert only */
const REVIEW_ALERT = {
  bg: '#FEF3C7',
  border: '#FCD34D',
  text: '#C2410C',
  linkHover: 'rgba(234, 88, 12, 0.12)',
  linkPressed: 'rgba(234, 88, 12, 0.2)',
};

/**
 * Standalone warning banner for missing review data — message left, review action right.
 */
export default function ReviewAlertBanner({ message, editLabel, editRoute }) {
  const router = useRouter();

  if (!message) return null;

  return (
    <View style={{
      marginBottom: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: R.card,
      backgroundColor: REVIEW_ALERT.bg,
      borderWidth: 1,
      borderColor: REVIEW_ALERT.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    }}>
      <View style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
      }}>
        <Text
          style={{
            fontSize: 14,
            lineHeight: MESSAGE_LINE,
            color: REVIEW_ALERT.text,
            includeFontPadding: false,
          }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          ⚠
        </Text>
        <Text
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: '500',
            color: REVIEW_ALERT.text,
            lineHeight: MESSAGE_LINE,
          }}
          numberOfLines={3}
        >
          {message}
        </Text>
      </View>
      {editRoute && editLabel ? (
        <OnboardingPressable
          onPress={() => router.push(editRoute)}
          accessibilityRole="button"
          accessibilityLabel={editLabel}
          style={({ pressed, hovered }) => ({
            flexShrink: 0,
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 6,
            backgroundColor: pressed
              ? REVIEW_ALERT.linkPressed
              : hovered
                ? REVIEW_ALERT.linkHover
                : 'transparent',
            ...(Platform.OS === 'web' ? {
              cursor: 'pointer',
              transitionProperty: 'background-color',
              transitionDuration: '0.12s',
            } : {}),
          })}
        >
          {({ hovered, pressed }) => (
            <Text style={{
              fontSize: 13,
              fontWeight: '700',
              color: REVIEW_ALERT.text,
              textDecorationLine: hovered || pressed ? 'underline' : 'none',
            }}>
              {editLabel}
            </Text>
          )}
        </OnboardingPressable>
      ) : null}
    </View>
  );
}
