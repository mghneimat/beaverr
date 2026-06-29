import { View, Pressable, ScrollView, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Svg, { Path } from 'react-native-svg';
import { C, R, T } from '../../constants/onboarding-theme';
import { useDashboardLayout } from '../../lib/dashboardLayout';

const TAB_PLUS_SIZE = 16;
/** Inactive tabs — navy on white for readable contrast (pillUnselectedText is too faint). */
const TAB_INACTIVE_TEXT = C.primary;

function TabPlusIcon({ color }) {
  return (
    <Svg width={TAB_PLUS_SIZE} height={TAB_PLUS_SIZE} viewBox="0 0 24 24">
      <Path
        d="M12 5.5v13M5.5 12h13"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TrailingActionChip({ action, fullWidth = false }) {
  const textColor = action.active ? C.pillSelectedText : TAB_INACTIVE_TEXT;

  return (
    <Pressable
      onPress={action.onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(action.active) }}
      accessibilityLabel={action.accessibilityLabel || action.label}
      style={({ pressed, hovered }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        minHeight: 40,
        borderRadius: R.pill,
        flexShrink: 0,
        width: fullWidth ? '100%' : undefined,
        backgroundColor: action.active
          ? C.pillSelectedBg
          : pressed
            ? C.bg
            : hovered
              ? C.bg
              : C.pillUnselectedBg,
        borderWidth: action.active ? 0 : 1,
        borderColor: C.pillUnselectedBorder,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      })}
    >
      <TabPlusIcon color={textColor} />
      <Text style={{
        ...T.pillLabel,
        fontSize: 14,
        color: textColor,
      }}>
        {action.label}
      </Text>
    </Pressable>
  );
}

/**
 * Rounded pill tab row — Balshet dark-grey selected state.
 */
export default function ExpenseUnderlineTabBar({
  tabs,
  activeKey,
  onChange,
  accessibilityLabel,
  trailingAction,
}) {
  const { isPhone } = useDashboardLayout();
  if (!tabs.length && !trailingAction) return null;

  const tabRow = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={Platform.OS === 'web' && !isPhone}
      style={isPhone ? { width: '100%' } : { flexGrow: 1, flexShrink: 1, minWidth: 0 }}
      contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 2, alignItems: 'center' }}
    >
      {tabs.map((tab) => {
        const selected = activeKey === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
            style={({ pressed, hovered }) => ({
              paddingVertical: 10,
              paddingHorizontal: 18,
              minHeight: 40,
              borderRadius: R.pill,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected
                ? C.pillSelectedBg
                : pressed
                  ? C.bg
                  : hovered
                    ? C.bg
                    : C.pillUnselectedBg,
              borderWidth: selected ? 0 : 1,
              borderColor: C.pillUnselectedBorder,
              ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
            })}
          >
            <Text
              style={{
                ...T.pillLabel,
                fontSize: 14,
                fontWeight: selected ? '500' : '400',
                color: selected ? C.pillSelectedText : TAB_INACTIVE_TEXT,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  if (isPhone) {
    return (
      <View
        style={{ marginBottom: 4, gap: 10 }}
        accessibilityRole="tablist"
        accessibilityLabel={accessibilityLabel}
      >
        {tabRow}
        {trailingAction ? (
          <View style={{ alignSelf: 'stretch' }}>
            <TrailingActionChip action={trailingAction} fullWidth />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={{ marginBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {tabRow}
      {trailingAction ? <TrailingActionChip action={trailingAction} /> : null}
    </View>
  );
}
