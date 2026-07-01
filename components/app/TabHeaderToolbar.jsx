import { useRef, useState } from 'react';
import {
  View,
  Pressable,
  Modal,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter, useSegments } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { resolveProfileMenuName } from '../../lib/profileDisplay';
import { loadAccountRegistrationFields } from '../../lib/account/registrationProfile';
import { getData } from '../../lib/storage';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useAdminAccess } from '../../lib/admin/useAdminAccess';
import { clearScheduledCloudPush } from '../../lib/cloud/syncHousehold';
import { navigateAppTab } from '../../lib/screenTransition';
import { C, R, T } from '../../constants/onboarding-theme';
import { elevationShadow } from '../../lib/shadow';
import {
  AlertsIcon,
  ProfileIcon,
  UserIcon,
  CreditCardIcon,
  SlidersIcon,
  SunIcon,
  MoonIcon,
  CircleHelpIcon,
  LogOutIcon,
  ZapIcon,
  DashboardIcon,
} from './AppNavIcons';
import { CardHeaderChevron } from '../dashboard/CardHeaderActionButton';
import ConfirmDialog from '../ui/ConfirmDialog';

const MENU_WIDTH = 280;
const MENU_ITEM_RADIUS = 12;
const MENU_ITEM_GAP = 2;
const MENU_DROPDOWN_ICON_SIZE = 18;
const WIDE_BREAKPOINT = 768;

function useToolbarMetrics() {
  const { width } = useWindowDimensions();
  const comfortable = width < WIDE_BREAKPOINT;
  return {
    comfortable,
    navActionSize: comfortable ? 48 : 44,
    alertsHit: comfortable ? 48 : 44,
    profileAvatarSize: comfortable ? 38 : 36,
    menuIconSize: comfortable ? 22 : 20,
    profileHoverPad: comfortable ? 8 : 6,
    dividerHeight: comfortable ? 28 : 24,
  };
}

function ToolbarSegment({ onPress, accessibilityLabel, accessibilityState, children, style, hitSlop }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      hitSlop={hitSlop}
      style={({ pressed, hovered }) => [{
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: R.input,
        backgroundColor: pressed
          ? C.overlayPressed
          : hovered && Platform.OS === 'web'
            ? C.overlayHover
            : 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }, style]}
    >
      {children}
    </Pressable>
  );
}

function ProBadge({ t }) {
  return (
    <View
      accessibilityLabel={t('dashboard.headerToolbar.proBadgeA11y')}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: R.pill,
        backgroundColor: C.heroIncomeBg,
        borderWidth: 1,
        borderColor: C.heroIncomeBorder,
      }}
    >
      <ZapIcon color={C.heroIncomeBadge} size={11} />
      <Text style={{ fontSize: 10, fontWeight: '700', color: C.heroIncomeBadge, letterSpacing: 0.4 }}>
        {t('dashboard.headerToolbar.proBadge')}
      </Text>
    </View>
  );
}

function ProfileMenuOption({
  label,
  onPress,
  icon: Icon,
  destructive = false,
  selected = false,
  trailing = null,
  accessibilityLabel,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const active = pressed || hovered;
  const iconColor = destructive ? C.danger : C.text;

  const highlightBg = selected
    ? C.navSelectedBg
    : active
      ? C.overlayHover
      : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ selected }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        paddingHorizontal: 6,
        paddingVertical: MENU_ITEM_GAP,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 44,
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: MENU_ITEM_RADIUS,
          gap: 10,
          backgroundColor: highlightBg,
        }}
      >
        <View style={{ width: MENU_DROPDOWN_ICON_SIZE, alignItems: 'center' }}>
          <Icon color={iconColor} size={MENU_DROPDOWN_ICON_SIZE} />
        </View>
        <Text style={{
          flex: 1,
          fontSize: 14,
          fontWeight: '600',
          color: destructive ? C.danger : C.text,
        }}>
          {label}
        </Text>
        {trailing}
      </View>
    </Pressable>
  );
}

/**
 * Alerts + profile pill for tab headers — notifications left, profile right.
 */
export default function TabHeaderToolbar({ alertCount = 0, household = null, accountFields = null, onRefresh }) {
  const { signOut, user, configured } = useAuth();
  const isAdmin = useAdminAccess();
  const { t } = useI18n();
  const { toggleMode, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];
  const {
    comfortable,
    navActionSize,
    alertsHit,
    profileAvatarSize,
    menuIconSize,
    profileHoverPad,
    dividerHeight,
  } = useToolbarMetrics();

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [menuName, setMenuName] = useState('');
  const [logOutDialogOpen, setLogOutDialogOpen] = useState(false);
  const profileTriggerRef = useRef(null);

  const profileMenuName = menuName || resolveProfileMenuName(household, t, user, accountFields);
  const isProfileRoute = currentRoute === 'profile';

  const closeProfileMenu = () => {
    setProfileOpen(false);
    setProfileAnchor(null);
    setMenuName('');
  };

  const openProfileMenu = async () => {
    let fields = accountFields;
    let householdData = household;
    try {
      [fields, householdData] = await Promise.all([
        loadAccountRegistrationFields(user?.id),
        getData('beaverr_household'),
      ]);
    } catch {
      fields = accountFields;
      householdData = household;
    }

    const resolvedName = resolveProfileMenuName(householdData || null, t, user, fields);
    void onRefresh?.();

    const node = profileTriggerRef.current;
    if (!node?.measureInWindow) {
      setMenuName(resolvedName);
      setProfileOpen(true);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      setProfileAnchor({ x, y, width, height });
      setMenuName(resolvedName);
      setProfileOpen(true);
    });
  };

  const handleAlertsPress = () => {
    navigateAppTab(router, 'alerts', currentRoute);
  };

  const handleOpenProfile = () => {
    closeProfileMenu();
    setTimeout(() => navigateAppTab(router, 'profile', currentRoute), 0);
  };

  const openSettingsTab = (route) => {
    closeProfileMenu();
    setTimeout(() => navigateAppTab(router, route, currentRoute), 0);
  };

  const handleOpenAdmin = () => {
    closeProfileMenu();
    setTimeout(() => router.push('/(admin)/stats'), 0);
  };

  const handleToggleAppearance = () => {
    toggleMode();
    closeProfileMenu();
  };

  const AppearanceMenuIcon = isDark ? MoonIcon : SunIcon;
  const appearanceA11y = isDark
    ? t('dashboard.headerToolbar.appearanceSwitchToLight')
    : t('dashboard.headerToolbar.appearanceSwitchToDark');

  const handleLogOutRequest = () => {
    closeProfileMenu();
    setTimeout(() => setLogOutDialogOpen(true), 0);
  };

  const handleConfirmLogOut = async () => {
    setLogOutDialogOpen(false);
    clearScheduledCloudPush();
    await signOut();
    router.replace('/(auth)/welcome');
  };

  const menuTop = profileAnchor ? profileAnchor.y + profileAnchor.height + 8 : 0;
  const menuLeft = profileAnchor
    ? Math.max(8, profileAnchor.x + profileAnchor.width - MENU_WIDTH)
    : 0;

  const badgeLabel = alertCount > 9 ? '9+' : String(alertCount);
  const alertsA11y = alertCount > 0
    ? t('dashboard.headerToolbar.alertsCountA11y', { count: alertCount })
    : t('dashboard.headerToolbar.alertsA11y');

  return (
    <>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
        gap: comfortable ? 4 : 2,
      }}>
        <ToolbarSegment
          onPress={handleAlertsPress}
          accessibilityLabel={alertsA11y}
          hitSlop={comfortable ? { top: 4, bottom: 4, left: 4, right: 4 } : undefined}
          style={{ width: alertsHit, height: alertsHit, minWidth: alertsHit, minHeight: alertsHit, position: 'relative' }}
        >
          <AlertsIcon color={C.text} size={menuIconSize} />
          {alertCount > 0 ? (
            <View style={{
              position: 'absolute',
              top: comfortable ? 8 : 6,
              right: comfortable ? 8 : 6,
              minWidth: 16,
              height: 16,
              paddingHorizontal: 4,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: C.danger,
              borderWidth: 1.5,
              borderColor: C.surface,
            }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF', lineHeight: 11 }}>
                {badgeLabel}
              </Text>
            </View>
          ) : null}
        </ToolbarSegment>

        <View style={{
          width: 1,
          height: dividerHeight,
          backgroundColor: C.border,
          flexShrink: 0,
          marginHorizontal: comfortable ? 6 : 4,
        }} />

        <View ref={profileTriggerRef} collapsable={false} style={{ flexShrink: 0 }}>
          <ToolbarSegment
            onPress={() => (profileOpen ? closeProfileMenu() : openProfileMenu())}
            accessibilityLabel={t('dashboard.headerToolbar.profileA11y')}
            accessibilityState={{ expanded: profileOpen }}
            hitSlop={comfortable ? { top: 4, bottom: 4, left: 4, right: 4 } : undefined}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: comfortable ? 4 : 2,
              minWidth: navActionSize,
              minHeight: navActionSize,
              paddingHorizontal: profileHoverPad,
              paddingVertical: profileHoverPad,
            }}
          >
            <View style={{
              width: profileAvatarSize,
              height: profileAvatarSize,
              borderRadius: profileAvatarSize / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: C.navSelectedBg,
              borderWidth: 1,
              borderColor: C.border,
            }}>
              <ProfileIcon color={C.text} size={menuIconSize} />
            </View>
            <CardHeaderChevron expanded={profileOpen} color={C.text} active={false} />
          </ToolbarSegment>
        </View>
      </View>

      <Modal
        visible={profileOpen}
        transparent
        animationType="fade"
        onRequestClose={closeProfileMenu}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeProfileMenu}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          />
          {profileAnchor ? (
            <View
              accessibilityRole="menu"
              accessibilityLabel={t('dashboard.headerToolbar.profileMenuA11y')}
              style={{
                position: 'absolute',
                top: menuTop,
                left: menuLeft,
                width: MENU_WIDTH,
                backgroundColor: C.surface,
                borderRadius: R.card,
                paddingTop: 10,
                paddingBottom: 10,
                borderWidth: 1,
                borderColor: C.border,
                ...elevationShadow({ offsetY: 12, blur: 28, opacity: 0.16 }),
                ...(Platform.OS === 'web' ? { zIndex: 9999 } : {}),
              }}
            >
              <ProfileMenuOption
                label={profileMenuName}
                icon={UserIcon}
                onPress={handleOpenProfile}
                selected={isProfileRoute}
                accessibilityLabel={t('dashboard.headerToolbar.openProfileA11y', { name: profileMenuName })}
              />
              <ProfileMenuOption
                label={t('dashboard.headerToolbar.subscription')}
                icon={CreditCardIcon}
                onPress={() => openSettingsTab('subscriptions')}
                selected={currentRoute === 'subscriptions'}
                trailing={<ProBadge t={t} />}
              />
              <ProfileMenuOption
                label={t('dashboard.headerToolbar.accountSettings')}
                icon={SlidersIcon}
                onPress={() => openSettingsTab('account-settings')}
                selected={currentRoute === 'account-settings'}
              />
              {Platform.OS === 'web' && isAdmin ? (
                <ProfileMenuOption
                  label={t('dashboard.headerToolbar.adminDashboard')}
                  icon={DashboardIcon}
                  onPress={handleOpenAdmin}
                  accessibilityLabel={t('dashboard.headerToolbar.adminDashboardA11y')}
                />
              ) : null}
              <ProfileMenuOption
                label={t('dashboard.headerToolbar.appearance')}
                icon={AppearanceMenuIcon}
                onPress={handleToggleAppearance}
                accessibilityLabel={appearanceA11y}
              />

              <View style={{ height: 1, backgroundColor: C.border, marginVertical: 6, marginHorizontal: 12 }} />

              <ProfileMenuOption
                label={t('dashboard.headerToolbar.helpFeedback')}
                icon={CircleHelpIcon}
                onPress={() => openSettingsTab('help-feedback')}
                selected={currentRoute === 'help-feedback'}
              />
              {configured && user ? (
                <ProfileMenuOption
                  label={t('auth.signOut')}
                  icon={LogOutIcon}
                  onPress={handleLogOutRequest}
                  destructive
                />
              ) : null}
            </View>
          ) : null}
        </View>
      </Modal>

      <ConfirmDialog
        visible={logOutDialogOpen}
        title={t('auth.signOut')}
        message={t('auth.signOutHelper')}
        confirmLabel={t('auth.signOut')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={handleConfirmLogOut}
        onCancel={() => setLogOutDialogOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? 'rgba(15, 23, 42, 0.06)' : 'rgba(0, 0, 0, 0.18)',
  },
});
