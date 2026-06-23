import { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import AppSidebar from '../../components/app/AppSidebar';
import AppTopNavBar from '../../components/app/AppTopNavBar';
import QuestionnaireBanner from '../../components/app/QuestionnaireBanner';
import { getData } from '../../lib/storage';
import { isTabLockedForQuickSetup } from '../../lib/onboardingProgress';
import { C } from '../../constants/onboarding-theme';

const WIDE_BREAKPOINT = 768;

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    (async () => {
      if (segments[0] !== '(app)') return;
      const routeName = segments[segments.length - 1];
      if (!routeName || routeName === '_layout') return;
      const onboarding = await getData('beaverr_onboarding');
      if (isTabLockedForQuickSetup(onboarding, routeName)) {
        router.replace('/(app)/dashboard');
      }
    })();
  }, [segments, router]);

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.bg }}>
      <AppSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <View style={{ flex: 1 }}>
        <AppTopNavBar
          showMobileMenu={!isWide}
          onMobileMenuOpen={() => setMobileSidebarOpen(true)}
        />

        <QuestionnaireBanner />

        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
        />
      </View>
    </View>
  );
}
