import { View } from 'react-native';
import { ONBOARDING_ILLUSTRATION } from '../../constants/onboarding-theme';

/**
 * Layout wrapper for inline undraw illustrations above headings.
 * Pair with a parent FadeUpView so the whole page content animates together.
 */
export default function OnboardingIllustrationFrame({ children, style }) {
  return (
    <View
      style={[
        {
          alignItems: 'center',
          marginBottom: ONBOARDING_ILLUSTRATION.marginBottom,
          width: '100%',
          maxWidth: '100%',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
