import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, S } from '../../constants/onboarding-theme';
import TabHeaderToolbar from './TabHeaderToolbar';
import { AppSidebarMobileTrigger } from './AppSidebar';
import useHeaderToolbarData from './useHeaderToolbarData';

const CONTENT_MAX_WIDTH = 900;

/**
 * Sticky top bar — mobile menu (narrow) and alerts/profile actions only.
 */
export default function AppTopNavBar({ showMobileMenu = false, onMobileMenuOpen }) {
  const insets = useSafeAreaInsets();
  const { alertCount, household } = useHeaderToolbarData();

  return (
    <View
      style={{
        backgroundColor: C.surface,
        paddingTop: insets.top,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: S.navHeight,
          gap: 8,
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: 'center',
          paddingHorizontal: S.pagePadH,
        }}
      >
        {showMobileMenu ? (
          <AppSidebarMobileTrigger onMobileOpen={onMobileMenuOpen} />
        ) : null}

        <View style={{ flex: 1 }} />

        <TabHeaderToolbar alertCount={alertCount} household={household} />
      </View>
    </View>
  );
}
