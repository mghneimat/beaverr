import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { formatCurrency } from '../../lib/finance';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';

export default function RecurringCommitmentsCard({
  title,
  insight,
  items,
  currency,
  annualLabel,
  reviewLabel,
  onReview,
  showReviewButton = true,
  limit = 5,
}) {
  const shown = items.slice(0, limit);

  if (!items.length) return null;

  return (
    <SurfaceCard style={{ marginBottom: 16 }}>
      <InCardSectionHeader title={title} />
      {insight ? (
        <Text style={{ ...T.helper, marginBottom: 12 }}>{insight}</Text>
      ) : null}
      {shown.map((item) => (
        <View
          key={item.id}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: C.divider,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '500', color: C.primary }} numberOfLines={2}>
              {item.label}
            </Text>
            <Text style={{ ...T.caption, color: C.muted, marginTop: 2 }}>
              {annualLabel}: {formatCurrency(item.annualAmount, currency)}
            </Text>
          </View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary, ...tabularNums }}>
            {formatCurrency(item.monthlyAmount, currency)}
          </Text>
        </View>
      ))}
      {showReviewButton && onReview ? (
        <Pressable
          onPress={onReview}
          accessibilityRole="button"
          accessibilityLabel={reviewLabel}
          style={({ pressed }) => ({
            marginTop: 12,
            paddingVertical: 12,
            alignItems: 'center',
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: C.border,
            backgroundColor: pressed ? C.overlayHover : 'transparent',
            minHeight: 44,
            justifyContent: 'center',
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: C.accent }}>{reviewLabel}</Text>
        </Pressable>
      ) : null}
    </SurfaceCard>
  );
}
