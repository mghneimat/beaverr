import { View, Modal, Pressable, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R } from '../../constants/onboarding-theme';
import { useDashboardLayout } from '../../lib/dashboardLayout';
import { PHONE_MAX } from '../../lib/layoutBreakpoints';

const SHEET_PAD = 20;

/**
 * Scrollable dashboard modal shell — maxHeight + inner ScrollView so tall forms
 * remain reachable on mobile web. Padding lives on ScrollView content, not the card shell.
 */
export default function DashboardScrollSheet({
  visible,
  onClose,
  children,
  maxWidth = 440,
  maxHeight = '88%',
  scrollEnabled = true,
  closeA11yLabel,
  contentContainerStyle,
  overlayPadding,
}) {
  const { width } = useWindowDimensions();
  const { pagePadH, isPhone } = useDashboardLayout();
  const insets = useSafeAreaInsets();
  const isPhoneWeb = Platform.OS === 'web' && width < PHONE_MAX;
  const horizontalPad = overlayPadding ?? pagePadH;
  const verticalPad = overlayPadding ?? pagePadH;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          justifyContent: isPhone ? 'flex-end' : 'center',
          alignItems: 'center',
          paddingHorizontal: horizontalPad,
          paddingTop: Math.max(verticalPad, insets.top),
          paddingBottom: Math.max(verticalPad, insets.bottom),
        }}
      >
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(30, 58, 95, 0.35)',
          }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={closeA11yLabel}
        />
        <View
          style={{
            width: '100%',
            maxWidth,
            maxHeight,
            backgroundColor: C.surface,
            borderRadius: R.card,
            borderWidth: 1,
            borderColor: C.border,
            overflow: 'hidden',
            ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            bounces={false}
            scrollEnabled={scrollEnabled}
            showsVerticalScrollIndicator={!isPhoneWeb}
            {...(Platform.OS === 'web' ? { className: 'dashboard-sheet-scroll' } : {})}
            contentContainerStyle={[
              { padding: isPhone ? 16 : SHEET_PAD },
              contentContainerStyle,
            ]}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export { SHEET_PAD };
