import { View, Pressable, ScrollView, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Svg, { Path } from 'react-native-svg';
import { C, R, T } from '../../constants/onboarding-theme';

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

function TrailingActionChip({ action }) {
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
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        minHeight: 40,
        borderRadius: R.pill,
        flexShrink: 0,
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
        fontWeight: '600',
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
  if (!tabs.length && !trailingAction) return null;

  return (
    <View
      style={{ marginBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
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
                  fontWeight: '600',
                  color: selected ? C.pillSelectedText : TAB_INACTIVE_TEXT,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {trailingAction ? <TrailingActionChip action={trailingAction} /> : null}
    </View>
  );
}
