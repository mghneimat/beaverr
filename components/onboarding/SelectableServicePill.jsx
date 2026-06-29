import { View, Text } from 'react-native';
import { C, R } from '../../constants/onboarding-theme';
import OnboardingPressable from './OnboardingPressable';
import { chipBg } from './pressableFeedback';

/**
 * Toggle pill — accent blue when active, optional inline checkmark (subscriptions, pets).
 */
export default function SelectableServicePill({ label, active, onPress, style }) {
  return (
    <OnboardingPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      contentStyle={{
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'nowrap',
      }}
      style={({ pressed, hovered }) => ({
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: R.pill,
        borderWidth: active ? 0 : 1.5,
        borderColor: C.pillUnselectedBorder,
        backgroundColor: chipBg({ pressed, hovered, active, activeBg: C.pillSelectedBg }),
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'nowrap',
        marginBottom: 8,
        marginRight: 8,
        ...style,
      })}
    >
      <Text
        style={{
          flexShrink: 1,
          fontSize: 13,
          fontWeight: active ? '600' : '500',
          color: active ? C.pillSelectedText : C.pillUnselectedText,
          marginRight: active ? 6 : 0,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      {active ? (
        <View style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: 'rgba(255,255,255,0.22)',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Text style={{ color: C.pillSelectedText, fontSize: 10, fontWeight: '700' }}>{'✓'}</Text>
        </View>
      ) : null}
    </OnboardingPressable>
  );
}
