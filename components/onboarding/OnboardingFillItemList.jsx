import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T } from '../../constants/onboarding-theme';
import OnboardingPressable from './OnboardingPressable';

function fillItemRowBg({ pressed, hovered, isActive }) {
  if (isActive) {
    return C.navSelectedBg;
  }
  if (pressed) return C.bg;
  if (hovered) return C.tableRowHover;
  return C.surface;
}

function FillItemRadio({ selected }) {
  return (
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: selected ? C.progressFill : C.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {selected ? (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: C.progressFill,
          }}
        />
      ) : null}
    </View>
  );
}

function FillItemStatus({ hasError, isComplete }) {
  if (hasError) {
    return (
      <View
        accessibilityLabel="!"
        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.danger, flexShrink: 0 }}
      />
    );
  }

  if (isComplete) {
    return (
      <View style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: C.positiveBg,
        borderWidth: 1,
        borderColor: C.positiveBorder,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.positive }}>{'✓'}</Text>
      </View>
    );
  }

  return (
    <View style={{
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: C.border,
      flexShrink: 0,
    }} />
  );
}

/**
 * Vertical item switcher for multi-item fill steps — ledger rows, not segmented pills.
 */
export default function OnboardingFillItemList({
  label,
  items,
  getItemKey,
  getItemLabel,
  activeIndex,
  onSelectIndex,
  getItemComplete,
  getItemHasError,
  style,
}) {
  if (!items || items.length <= 1) return null;

  return (
    <View style={[{ marginBottom: 20 }, style]}>
      {label ? (
        <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>{label}</Text>
      ) : null}
      <View
        style={{
          borderRadius: R.card,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.surface,
          overflow: 'hidden',
        }}
        accessibilityRole="tablist"
      >
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const isComplete = getItemComplete?.(item, index) ?? false;
          const hasError = getItemHasError?.(item, index) ?? false;
          const isLast = index === items.length - 1;

          return (
            <OnboardingPressable
              key={getItemKey(item, index)}
              onPress={() => onSelectIndex(index)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              contentStyle={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minWidth: 0,
              }}
              style={({ pressed, hovered }) => ({
                paddingVertical: 14,
                paddingHorizontal: 16,
                backgroundColor: fillItemRowBg({ pressed, hovered, isActive }),
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: C.divider,
              })}
            >
              <FillItemRadio selected={isActive} />
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? C.text : C.muted,
                }}
                numberOfLines={2}
              >
                {getItemLabel(item, index)}
              </Text>
              <FillItemStatus hasError={hasError} isComplete={isComplete} />
            </OnboardingPressable>
          );
        })}
      </View>
    </View>
  );
}
