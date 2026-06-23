import { useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';

/**
 * Tappable metric card — navigates to an app tab on press.
 */
export default function DashboardKpiCard({
  label,
  value,
  subtitle,
  icon,
  iconBg = C.infoWashBg,
  onPress,
  accessibilityLabel,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${label}, ${value}`}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed: p }) => ({
        flex: 1,
        minWidth: 148,
        minHeight: 120,
        backgroundColor: C.surface,
        borderRadius: R.card,
        borderWidth: 1,
        borderColor: hovered || p || pressed ? C.chipSelectedBorder : C.border,
        padding: 16,
        ...(Platform.OS === 'web' && hovered ? { cursor: 'pointer' } : {}),
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: R.input,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </View>
        <Text style={{ fontSize: 14, color: C.muted }}>→</Text>
      </View>
      <Text style={{ ...T.fieldLabel, marginBottom: 4 }} numberOfLines={2}>
        {label}
      </Text>
      <Text style={{
        fontSize: 22,
        lineHeight: 28,
        fontWeight: '700',
        color: C.primary,
        ...tabularNums,
      }} numberOfLines={1}>
        {value}
      </Text>
      {subtitle ? (
        <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}
