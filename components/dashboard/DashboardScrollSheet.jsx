import { View, Modal, Pressable, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { C, R, S } from '../../constants/onboarding-theme';
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
  overlayPadding = S.pagePadH,
}) {
  const { width } = useWindowDimensions();
  const isPhoneWeb = Platform.OS === 'web' && width < PHONE_MAX;

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
          justifyContent: 'center',
          alignItems: 'center',
          padding: overlayPadding,
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
              { padding: SHEET_PAD },
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
