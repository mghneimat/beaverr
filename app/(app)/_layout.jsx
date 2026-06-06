import { useState } from 'react';
import { Tabs, useSegments, useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { useI18n } from '../../lib/i18n';
import Svg, { Path } from 'react-native-svg';
import HamburgerMenu from '../../components/HamburgerMenu';
import { C, S, T } from '../../constants/onboarding-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Simple icon components using SVG
function DashboardIcon({ color }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
        fill={color}
      />
    </Svg>
  );
}

function CostsIcon({ color }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-9-1c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-6v11c0 1.1-.9 2-2 2H4v-2h17V7h2z"
        fill={color}
      />
    </Svg>
  );
}

function BudgetIcon({ color }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"
        fill={color}
      />
    </Svg>
  );
}

function IncomeIcon({ color }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"
        fill={color}
      />
    </Svg>
  );
}

function GoalsIcon({ color }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        fill={color}
      />
    </Svg>
  );
}

function SummaryIcon({ color }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
        fill={color}
      />
    </Svg>
  );
}

// Tab definitions
const TABS = [
  { name: 'dashboard', labelKey: 'dashboard.title', Icon: DashboardIcon },
  { name: 'income',    labelKey: 'dashboard.income',  Icon: IncomeIcon },
  { name: 'costs',     labelKey: 'dashboard.costs',   Icon: CostsIcon },
  { name: 'budget',    labelKey: 'dashboard.budget',  Icon: BudgetIcon },
  { name: 'goals',     labelKey: 'dashboard.goals',   Icon: GoalsIcon },
  { name: 'summary',   labelKey: 'dashboard.summary', Icon: SummaryIcon },
];

/**
 * Custom tab bar button with full control over icon and label layout.
 * Renders icon and label ourselves to ensure perfect centering.
 */
function CustomTabButton({ route, onPress, isFocused, Icon, label }) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const color = isFocused ? C.primary : C.muted;

  // Hover is slightly less dark than selected (focused)
  const bgColor = isFocused
    ? C.overlaySelected
    : hovered
      ? C.overlayHover
      : pressed
        ? C.overlayPressed
        : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgColor,
        borderRadius: 0,
        paddingTop: 4,
      }}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Icon color={color} />
        <Text
          style={{
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.3,
            color,
            marginTop: 3,
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function AppLayout() {
  const { t } = useI18n();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const currentTab = segments[segments.length - 1];

  // Map tab names to their label keys for the header title
  const tabLabelMap = {
    dashboard: 'dashboard.title',
    income: 'dashboard.income',
    costs: 'dashboard.costs',
    budget: 'dashboard.budget',
    goals: 'dashboard.goals',
    summary: 'dashboard.summary',
    alerts: 'dashboard.alerts',
  };

  const headerTitle = tabLabelMap[currentTab] ? t(tabLabelMap[currentTab]) : '';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Consistent header bar for all dashboard tabs ── 56px to match onboarding nav bar */}
      <View style={{
        backgroundColor: C.surface,
        paddingHorizontal: S.pagePadH,
        height: S.navHeight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}>
        <Text style={{
          fontSize: 17,
          fontWeight: '600',
          color: C.primary,
        }}>
          {headerTitle}
        </Text>
        <HamburgerMenu />
      </View>

      {/* ── Tab content ── */}
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => (
          <View style={{
            flexDirection: 'row',
            backgroundColor: C.surface,
            borderTopColor: C.border,
            borderTopWidth: 1,
            paddingBottom: insets.bottom,
            height: 60 + insets.bottom,
          }}>
            {TABS.map(({ name, labelKey, Icon }) => {
              const isFocused = currentTab === name;
              return (
                <CustomTabButton
                  key={name}
                  route={name}
                  onPress={() => router.push(`/(app)/${name}`)}
                  isFocused={isFocused}
                  Icon={Icon}
                  label={t(labelKey)}
                />
              );
            })}
          </View>
        )}
      >
        {TABS.map(({ name, labelKey, Icon }) => (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: t(labelKey),
            }}
          />
        ))}
        <Tabs.Screen
          name="alerts"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}
