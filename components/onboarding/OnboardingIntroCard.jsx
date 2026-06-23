import { View } from 'react-native';
import { C, R, S } from '../../constants/onboarding-theme';

/**
 * Surface card shell for splash intros and illustrated question screens.
 */
export default function OnboardingIntroCard({ children, style }) {
  return (
    <View style={{
      width: '100%',
      padding: S.cardPad,
      backgroundColor: C.surface,
      borderRadius: R.card,
      borderWidth: 1,
      borderColor: C.border,
      ...style,
    }}>
      {children}
    </View>
  );
}
