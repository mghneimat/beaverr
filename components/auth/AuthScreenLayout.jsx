import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingScreenShell from '../onboarding/OnboardingScreenShell';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { webScrollBottomPadding } from '../../lib/safeAreaWeb';
import { C, S } from '../../constants/onboarding-theme';

/**
 * Shared scroll shell for auth form screens.
 */
export default function AuthScreenLayout({ children, centerContent = false }) {
  const insets = useSafeAreaInsets();
  const layout = useOnboardingLayout();

  return (
    <OnboardingScreenShell>
      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 12,
          paddingHorizontal: layout.pagePadH,
          paddingBottom: webScrollBottomPadding(Math.max(insets.bottom, 24)),
          ...(centerContent ? { justifyContent: 'center' } : null),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: '100%', maxWidth: S.maxWidth, alignSelf: 'center' }}>
          {children}
        </View>
      </ScrollView>
    </OnboardingScreenShell>
  );
}
