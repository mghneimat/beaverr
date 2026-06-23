import { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useRouter, useSegments } from 'expo-router';
import { navigateAppTab, resolveActiveAppTab } from '../../lib/screenTransition';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../lib/i18n';
import { getUiPreferences, setUiPreferences } from '../../lib/uiPreferences';
import { snapshotQuestionnaireForRetake } from '../../lib/onboardingExit';
import {
  getOnboardingState,
  isTabLockedForQuickSetup,
  getResumeRoute,
  getQuestionnaireStartRoute,
  shouldShowContinueQuestionnaire,
  shouldShowStartQuestionnaire,
  shouldShowRetakeQuestionnaire,
  patchOnboardingState,
} from '../../lib/onboardingProgress';
import { subscribeDashboardRefresh } from '../../lib/dashboardRefresh';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { C, R, S, T } from '../../constants/onboarding-theme';
import {
  DashboardIcon,
  IncomeIcon,
  CostsIcon,
  BudgetIcon,
  GoalsIcon,
  SavingsIcon,
  TrackerIcon,
  SummaryIcon,
  RemindersIcon,
  SidebarToggleIcon,
  SidebarCollapseIcon,
  SidebarExpandIcon,
  QuestionnaireIcon,
  LockIcon,
} from './AppNavIcons';
import LanguageSelector from './LanguageSelector';
import SidebarBrandMark from './SidebarBrandMark';
import ConfirmDialog from '../ui/ConfirmDialog';

const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 68;
const WIDE_BREAKPOINT = 768;
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const SECTION_LABEL_COLOR = '#64748B';
const NAV_INACTIVE_COLOR = C.text;
const NAV_ICON_SIZE = 16;

/** Fixed icon column — never changes during collapse animation */
const ICON_SLOT = 36;
const ROW_HEIGHT = 44;
const ROW_MARGIN_H = 8;
const ROW_MARGIN_V = 2;
const ROW_PAD_LEFT = 6;
const SECTION_LABEL_PAD_LEFT = ROW_PAD_LEFT + (ICON_SLOT - NAV_ICON_SIZE) / 2;
/** Label inset — absolute so expand/collapse never reflows the icon column */
const LABEL_LEFT = ROW_PAD_LEFT + ICON_SLOT + 4;
const ROW_WIDTH_EXPANDED = SIDEBAR_EXPANDED - ROW_MARGIN_H * 2;
/** Center icon-only row in collapsed rail */
const ROW_MARGIN_LEFT_COLLAPSED = (SIDEBAR_COLLAPSED - ICON_SLOT) / 2;
const TOGGLE_SIZE = 36;
const HEADER_HEIGHT = S.navHeight;
const HEADER_TOGGLE_INSET = 8;
const TOGGLE_RIGHT_OFFSET = 16;
/** Fixed slots — section labels fade out but never shrink (prevents icon vertical jump) */
const NAV_SECTION_LABEL_H = 44;
const TOOLS_SECTION_LABEL_H = 44;
const LOCK_ICON_SIZE = 14;
const LOCK_SLOT_RIGHT = 10;

const NAV_ITEMS = [
  { name: 'dashboard', labelKey: 'dashboard.title', Icon: DashboardIcon },
  { name: 'income', labelKey: 'dashboard.income', Icon: IncomeIcon },
  { name: 'costs', labelKey: 'dashboard.expenses', Icon: CostsIcon },
  { name: 'budget', labelKey: 'dashboard.budget', Icon: BudgetIcon },
  { name: 'savings', labelKey: 'dashboard.savings', Icon: SavingsIcon },
  { name: 'tracker', labelKey: 'dashboard.tracker', Icon: TrackerIcon },
  { name: 'goals', labelKey: 'dashboard.goals', Icon: GoalsIcon },
  { name: 'summary', labelKey: 'dashboard.summary', Icon: SummaryIcon },
  { name: 'alerts', labelKey: 'dashboard.alerts', Icon: RemindersIcon },
];

const iconSlotStyle = {
  width: ICON_SLOT,
  height: ICON_SLOT,
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  ...(Platform.OS === 'web' ? { transform: [{ translateZ: 0 }] } : {}),
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Nav row — icon locked in a fixed slot; label fades beside it without flex reflow.
 */
const SidebarNavRow = memo(function SidebarNavRow({
  isActive,
  onPress,
  Icon,
  iconColor,
  label,
  labelAnimatedStyle,
  rowCollapseAnimatedStyle,
  danger = false,
  locked = false,
  accessibilityLabel,
  showTooltip = false,
  trailing = null,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const chipBackgroundColor = locked
    ? 'transparent'
    : isActive
      ? C.navSelectedBg
      : danger && pressed
        ? C.dangerBg
        : pressed
          ? C.overlayPressed
          : hovered
            ? C.overlayHover
            : 'transparent';

  const labelColor = locked
    ? C.muted
    : danger
      ? C.danger
      : isActive
        ? C.primary
        : NAV_INACTIVE_COLOR;
  const a11yLabel = accessibilityLabel ?? label;
  const collapsedIconRail = showTooltip;

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected: isActive }}
      {...(Platform.OS === 'web' && showTooltip ? { title: a11yLabel } : {})}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        {
          position: 'relative',
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: ROW_HEIGHT,
          marginVertical: ROW_MARGIN_V,
          borderRadius: collapsedIconRail ? ICON_SLOT / 2 : R.input,
          backgroundColor: collapsedIconRail ? 'transparent' : chipBackgroundColor,
          ...(Platform.OS === 'web' ? { cursor: locked ? 'default' : 'pointer', transition: 'background-color 0.15s ease' } : {}),
        },
        rowCollapseAnimatedStyle,
      ]}
    >
      {collapsedIconRail && chipBackgroundColor !== 'transparent' ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: (ROW_HEIGHT - ICON_SLOT) / 2,
            left: 0,
            width: ICON_SLOT,
            height: ICON_SLOT,
            borderRadius: ICON_SLOT / 2,
            backgroundColor: chipBackgroundColor,
            ...(Platform.OS === 'web' ? { transition: 'background-color 0.15s ease' } : {}),
          }}
        />
      ) : null}
      <View style={[iconSlotStyle, locked ? { opacity: 0.72 } : null]} collapsable={false}>
        <Icon color={iconColor} size={NAV_ICON_SIZE} />
      </View>
      {labelAnimatedStyle ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: LABEL_LEFT,
              right: locked && !collapsedIconRail ? LOCK_SLOT_RIGHT + LOCK_ICON_SIZE + 8 : 8,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              pointerEvents: 'none',
            },
            labelAnimatedStyle,
          ]}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontWeight: isActive && !locked ? '600' : '500',
              color: labelColor,
              opacity: locked ? 0.72 : 1,
            }}
          >
            {label}
          </Text>
        </Animated.View>
      ) : (
        <View style={{ flex: 1, marginLeft: 4, marginRight: locked ? LOCK_SLOT_RIGHT + LOCK_ICON_SIZE + 4 : 0 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontWeight: isActive && !locked ? '600' : '500',
              color: labelColor,
              opacity: locked ? 0.72 : 1,
            }}
          >
            {label}
          </Text>
        </View>
      )}
      {locked && !collapsedIconRail ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{
            position: 'absolute',
            right: LOCK_SLOT_RIGHT,
            top: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            width: LOCK_ICON_SIZE + 4,
          }}
        >
          <LockIcon color={C.primary} size={LOCK_ICON_SIZE} />
        </View>
      ) : null}
      {trailing}
    </AnimatedPressable>
  );
});

function CollapseToggleButton({ isWide, onPress, collapseProgress, accessibilityLabel }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const expandIconStyle = useAnimatedStyle(() => ({
    opacity: collapseProgress.value < 0.5 ? 1 : 0,
  }));

  const collapseIconStyle = useAnimatedStyle(() => ({
    opacity: collapseProgress.value >= 0.5 ? 1 : 0,
  }));

  const buttonPosStyle = useAnimatedStyle(() => {
    if (!isWide) return { right: 8 };
    const left = interpolate(
      collapseProgress.value,
      [0, 1],
      [SIDEBAR_EXPANDED - TOGGLE_SIZE - TOGGLE_RIGHT_OFFSET, (SIDEBAR_COLLAPSED - TOGGLE_SIZE) / 2 - 3],
      Extrapolation.CLAMP,
    );
    return { left };
  });

  const bg = pressed ? C.overlayPressed : hovered ? C.overlayHover : 'transparent';

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        top: HEADER_TOGGLE_INSET,
        width: TOGGLE_SIZE,
        height: HEADER_HEIGHT - HEADER_TOGGLE_INSET * 2,
        justifyContent: 'center',
      }, buttonPosStyle]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={{
          width: TOGGLE_SIZE,
          height: HEADER_HEIGHT - HEADER_TOGGLE_INSET * 2,
          minWidth: 44,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: R.input,
          backgroundColor: bg,
          ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background-color 0.15s ease' } : {}),
        }}
      >
        <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[{ position: 'absolute' }, expandIconStyle]}>
            <SidebarCollapseIcon color={C.muted} size={20} />
          </Animated.View>
          <Animated.View style={[{ position: 'absolute' }, collapseIconStyle]}>
            <SidebarExpandIcon color={C.muted} size={20} />
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function AppSidebarMobileTrigger({ onMobileOpen }) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onMobileOpen}
      accessibilityRole="button"
      accessibilityLabel={t('common.menu')}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        width: 48,
        height: 48,
        minWidth: 48,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: R.input,
        backgroundColor: pressed ? C.overlayPressed : hovered ? C.overlayHover : 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      <SidebarToggleIcon color={C.primary} size={22} />
    </Pressable>
  );
}

export default function AppSidebar({ mobileOpen = false, onMobileClose }) {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const reduceMotion = useReducedMotion();
  const animDuration = reduceMotion ? 0 : 260;
  const animDurationFast = reduceMotion ? 0 : 220;

  const [collapsed, setCollapsed] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMounted, setMobileMounted] = useState(false);
  const [onboardingState, setOnboardingState] = useState(null);
  const [lockedTabDialogOpen, setLockedTabDialogOpen] = useState(false);

  const slideX = useSharedValue(-SIDEBAR_EXPANDED);
  const backdropOpacity = useSharedValue(0);
  const sidebarWidth = useSharedValue(SIDEBAR_EXPANDED);
  const collapseProgress = useSharedValue(0);
  const langHeight = useSharedValue(0);

  const currentRoute = resolveActiveAppTab(segments);

  useEffect(() => {
    (async () => {
      const prefs = await getUiPreferences();
      if (!prefs.sidebarVisited) {
        setCollapsed(false);
        await setUiPreferences({ sidebarVisited: true, sidebarCollapsed: false });
      } else {
        setCollapsed(prefs.sidebarCollapsed);
      }
      setOnboardingState(await getOnboardingState());
      setPrefsReady(true);
    })();
  }, []);

  useEffect(() => {
    return subscribeDashboardRefresh(async () => {
      setOnboardingState(await getOnboardingState());
    });
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    const targetWidth = collapsed && isWide ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
    const targetCollapse = collapsed && isWide ? 1 : 0;
    sidebarWidth.value = withTiming(targetWidth, { duration: animDuration, easing: EASE });
    collapseProgress.value = withTiming(targetCollapse, { duration: animDuration, easing: EASE });
  }, [collapsed, isWide, prefsReady, animDuration]);

  useEffect(() => {
    langHeight.value = withTiming(langOpen ? 1 : 0, { duration: animDurationFast, easing: EASE });
  }, [langOpen, animDurationFast]);

  useEffect(() => {
    if (!isWide && mobileOpen) {
      setMobileMounted(true);
      slideX.value = withTiming(0, { duration: 280, easing: EASE });
      backdropOpacity.value = withTiming(1, { duration: 280, easing: EASE });
    } else if (!isWide && mobileMounted) {
      slideX.value = withTiming(-SIDEBAR_EXPANDED, { duration: 240, easing: EASE });
      backdropOpacity.value = withTiming(0, { duration: 240, easing: EASE }, (finished) => {
        if (finished) scheduleOnRN(() => setMobileMounted(false));
      });
    }
  }, [mobileOpen, isWide]);

  const animatedSidebarWidth = useAnimatedStyle(() => ({
    width: sidebarWidth.value,
  }));

  const labelClipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapseProgress.value, [0, 0.2, 1], [1, 0, 0], Extrapolation.CLAMP),
  }));

  const sectionLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapseProgress.value, [0, 0.2, 1], [1, 0, 0], Extrapolation.CLAMP),
  }));

  const rowCollapseStyle = useAnimatedStyle(() => {
    if (!isWide) {
      return {
        width: ROW_WIDTH_EXPANDED,
        marginLeft: ROW_MARGIN_H,
        marginRight: ROW_MARGIN_H,
        paddingLeft: ROW_PAD_LEFT,
        paddingRight: 8,
      };
    }
    return {
      width: interpolate(
        collapseProgress.value,
        [0, 1],
        [ROW_WIDTH_EXPANDED, ICON_SLOT],
        Extrapolation.CLAMP,
      ),
      marginLeft: interpolate(
        collapseProgress.value,
        [0, 1],
        [ROW_MARGIN_H, ROW_MARGIN_LEFT_COLLAPSED],
        Extrapolation.CLAMP,
      ),
      marginRight: ROW_MARGIN_H,
      paddingLeft: interpolate(
        collapseProgress.value,
        [0, 1],
        [ROW_PAD_LEFT, 0],
        Extrapolation.CLAMP,
      ),
      paddingRight: interpolate(
        collapseProgress.value,
        [0, 1],
        [8, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  const animatedDrawer = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const animatedBackdrop = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedLangPanel = useAnimatedStyle(() => ({
    opacity: interpolate(langHeight.value, [0, 0.15, 1], [0, 0.85, 1], Extrapolation.CLAMP),
    transform: [{
      translateY: interpolate(langHeight.value, [0, 1], [6, 0], Extrapolation.CLAMP),
    }],
  }));

  const langDropdownInsetStyle = animatedLangPanel;

  const navigate = (route) => {
    navigateAppTab(router, route, currentRoute);
    if (!isWide && onMobileClose) onMobileClose();
  };

  const handleToggleCollapse = () => {
    if (isWide) {
      setCollapsed((c) => {
        const next = !c;
        if (next) setLangOpen(false);
        setUiPreferences({ sidebarVisited: true, sidebarCollapsed: next });
        return next;
      });
    } else if (onMobileClose) {
      onMobileClose();
    }
  };

  const handleRetakeQuestionnaire = async () => {
    await snapshotQuestionnaireForRetake();
    await patchOnboardingState({
      completed: false,
      questionnaireComplete: false,
    });
    if (!isWide && onMobileClose) onMobileClose();
    setTimeout(() => router.push('/(onboarding)/welcome'), isWide ? 0 : 240);
  };

  const handleLanguagePress = () => {
    if (isWide && collapsed) {
      setCollapsed(false);
      setLangOpen(true);
      return;
    }
    setLangOpen((open) => !open);
  };

  const renderNavItem = (item) => {
    const isActive = currentRoute === item.name;
    const locked = isTabLockedForQuickSetup(onboardingState, item.name);
    const color = locked ? C.muted : isActive ? C.primary : NAV_INACTIVE_COLOR;
    const { Icon } = item;

    const showTooltip = isWide && collapsed;

    return (
      <SidebarNavRow
        key={item.name}
        isActive={isActive && !locked}
        locked={locked}
        onPress={() => {
          if (locked) {
            setLockedTabDialogOpen(true);
            return;
          }
          navigate(item.name);
        }}
        Icon={Icon}
        iconColor={color}
        label={t(item.labelKey)}
        labelAnimatedStyle={isWide ? labelClipStyle : undefined}
        rowCollapseAnimatedStyle={rowCollapseStyle}
        showTooltip={showTooltip}
        accessibilityLabel={locked ? t('app.sidebar.lockedTabA11y', { tab: t(item.labelKey) }) : undefined}
      />
    );
  };

  const handleContinueQuestionnaire = () => {
    router.push(getResumeRoute(onboardingState));
    if (!isWide && onMobileClose) onMobileClose();
  };

  const handleStartQuestionnaire = () => {
    router.push(getQuestionnaireStartRoute(onboardingState));
    if (!isWide && onMobileClose) onMobileClose();
  };

  const lockedTabDialog = (
    <ConfirmDialog
      visible={lockedTabDialogOpen}
      title={t('app.sidebar.lockedTabTitle')}
      message={t('app.sidebar.lockedTabMessage')}
      confirmLabel={t('app.sidebar.continueQuestionnaire')}
      cancelLabel={t('common.cancel')}
      onConfirm={() => {
        setLockedTabDialogOpen(false);
        handleContinueQuestionnaire();
      }}
      onCancel={() => setLockedTabDialogOpen(false)}
    />
  );

  /** Inner panel is always SIDEBAR_EXPANDED — outer wrapper clips width */
  const sidebarContent = (
    <View
      style={{
        width: SIDEBAR_EXPANDED,
        flex: 1,
        backgroundColor: C.surface,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 8,
        ...(Platform.OS === 'web' ? { transform: [{ translateZ: 0 }] } : {}),
      }}
    >
      {/* Header */}
      <View style={{
        flexShrink: 0,
        height: HEADER_HEIGHT,
        position: 'relative',
        marginBottom: 8,
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <SidebarBrandMark
          collapseProgress={collapseProgress}
          animateCollapse={isWide}
          alphaLabel={t('app.sidebar.alphaLabel')}
          accessibilityLabel={`${t('app.name')} ${t('app.sidebar.alphaLabel')}`}
        />
        <CollapseToggleButton
          isWide={isWide}
          onPress={handleToggleCollapse}
          collapseProgress={collapseProgress}
          accessibilityLabel={collapsed ? t('app.sidebar.expand') : t('app.sidebar.collapse')}
        />
      </View>

      {/* Navigation — scrollable so short viewports don't crush the layout */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 4 }}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        bounces={false}
      >
        <View style={{ height: NAV_SECTION_LABEL_H, justifyContent: 'center', overflow: 'hidden' }}>
          <Animated.Text style={[{
            ...T.sectionLabel,
            color: SECTION_LABEL_COLOR,
            fontWeight: '600',
            paddingLeft: SECTION_LABEL_PAD_LEFT,
            paddingTop: 14,
            paddingBottom: 14,
          }, isWide ? sectionLabelStyle : {}]}>
            {t('app.sidebar.navigation')}
          </Animated.Text>
        </View>
        {NAV_ITEMS.map(renderNavItem)}

        <View style={{ height: TOOLS_SECTION_LABEL_H, justifyContent: 'center', overflow: 'hidden' }}>
          <Animated.Text style={[{
            ...T.sectionLabel,
            color: SECTION_LABEL_COLOR,
            fontWeight: '600',
            paddingLeft: SECTION_LABEL_PAD_LEFT,
            paddingTop: 14,
            paddingBottom: 14,
          }, isWide ? sectionLabelStyle : {}]}>
            {t('app.sidebar.tools')}
          </Animated.Text>
        </View>

        {shouldShowContinueQuestionnaire(onboardingState) ? (
          <SidebarNavRow
            isActive={false}
            onPress={handleContinueQuestionnaire}
            Icon={QuestionnaireIcon}
            iconColor={C.primary}
            label={t('app.sidebar.continueQuestionnaire')}
            labelAnimatedStyle={isWide ? labelClipStyle : undefined}
            rowCollapseAnimatedStyle={rowCollapseStyle}
            showTooltip={isWide && collapsed}
          />
        ) : null}

        {shouldShowStartQuestionnaire(onboardingState) ? (
          <SidebarNavRow
            isActive={false}
            onPress={handleStartQuestionnaire}
            Icon={QuestionnaireIcon}
            iconColor={C.primary}
            label={t('app.sidebar.startNewQuestionnaire')}
            labelAnimatedStyle={isWide ? labelClipStyle : undefined}
            rowCollapseAnimatedStyle={rowCollapseStyle}
            showTooltip={isWide && collapsed}
          />
        ) : null}

        {shouldShowRetakeQuestionnaire(onboardingState) ? (
          <SidebarNavRow
            isActive={false}
            onPress={handleRetakeQuestionnaire}
            Icon={QuestionnaireIcon}
            iconColor={NAV_INACTIVE_COLOR}
            label={t('app.sidebar.retakeQuestionnaire')}
            labelAnimatedStyle={isWide ? labelClipStyle : undefined}
            rowCollapseAnimatedStyle={rowCollapseStyle}
            showTooltip={isWide && collapsed}
          />
        ) : null}

      </ScrollView>

      {/* Footer — pinned; never shrinks when viewport is short */}
      <View style={{
        flexShrink: 0,
        borderTopWidth: 1,
        borderTopColor: C.border,
        paddingTop: 8,
        overflow: 'visible',
        zIndex: langOpen ? 30 : 0,
      }}>
        <LanguageSelector
          locale={locale}
          open={langOpen}
          onToggle={handleLanguagePress}
          onSelect={(code) => { setLocale(code); setLangOpen(false); }}
          triggerLabel={t('common.language')}
          labelAnimatedStyle={isWide ? labelClipStyle : undefined}
          rowCollapseAnimatedStyle={rowCollapseStyle}
          showTooltip={isWide && collapsed}
          panelStyle={animatedLangPanel}
          insetStyle={langDropdownInsetStyle}
        />

      </View>
    </View>
  );

  if (!prefsReady) {
    return <View style={{ width: SIDEBAR_EXPANDED, height: '100%', backgroundColor: C.surface, borderRightWidth: 1, borderRightColor: C.border }} />;
  }

  if (!isWide) {
    return (
      <>
        <Modal
          visible={mobileMounted}
          transparent
          animationType="none"
          onRequestClose={onMobileClose}
          statusBarTranslucent
        >
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <Animated.View
              style={[{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(30,58,95,0.35)',
              }, animatedBackdrop]}
            >
              <Pressable style={{ flex: 1 }} onPress={onMobileClose} />
            </Animated.View>
            <Animated.View style={[{ width: SIDEBAR_EXPANDED, height: '100%', borderRightWidth: 1, borderRightColor: C.border }, animatedDrawer]}>
              {sidebarContent}
            </Animated.View>
          </View>
        </Modal>
        {lockedTabDialog}
      </>
    );
  }

  return (
    <>
      <Animated.View style={[{ height: '100%', overflow: 'hidden', borderRightWidth: 1, borderRightColor: C.border }, animatedSidebarWidth]}>
        {sidebarContent}
      </Animated.View>
      {lockedTabDialog}
    </>
  );
}
