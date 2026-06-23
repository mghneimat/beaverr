import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { toMonthly, formatCurrency } from '../../lib/finance';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import ExpandCollapseIcon from '../onboarding/ExpandCollapseIcon';

/**
 * Expandable cost category row for dashboard top-costs list.
 */
export default function ExpandableCategoryRow({
  label,
  monthlyTotal,
  items,
  currency,
  expanded: controlledExpanded,
  onToggle,
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const next = !expanded;
    if (onToggle) onToggle(next);
    else setInternalExpanded(next);
  };

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: C.divider }}>
      <Pressable
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded }}
        style={({ pressed, hovered }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 44,
          paddingVertical: 12,
          paddingHorizontal: 4,
          backgroundColor: pressed ? C.overlayHover : hovered ? C.overlayHover : 'transparent',
        })}
      >
        {({ pressed, hovered }) => (
          <>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: C.primary }} numberOfLines={2}>
              {label}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary, marginRight: 8, ...tabularNums }}>
              {formatCurrency(monthlyTotal, currency)}
            </Text>
            <ExpandCollapseIcon expanded={expanded} color={C.muted} compact size={16} hovered={hovered} pressed={pressed} />
          </>
        )}
      </Pressable>

      {expanded ? (
        <View style={{ paddingBottom: 12, paddingLeft: 4, paddingRight: 4 }}>
          {items.map((item, idx) => (
            <View
              key={`${item.label}-${idx}`}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 6,
                gap: 12,
              }}
            >
              <Text style={{ ...T.caption, color: C.muted, flex: 1 }} numberOfLines={2}>
                {item.label}
              </Text>
              <Text style={{ ...T.caption, color: C.text, fontWeight: '500', ...tabularNums }}>
                {formatCurrency(toMonthly(item.amount, item.frequency), currency)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
