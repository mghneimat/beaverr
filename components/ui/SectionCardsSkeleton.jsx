import { View } from 'react-native';
import { C, R, S } from '../../constants/onboarding-theme';
import SkeletonLine from './SkeletonLine';

function SkeletonCard({ children }) {
  return (
    <View style={{
      backgroundColor: C.surface,
      borderRadius: R.card,
      padding: S.cardPad,
      borderWidth: 1,
      borderColor: C.border,
      gap: 10,
    }}>
      {children}
    </View>
  );
}

/**
 * Stacked card skeleton — review screens, suspense fallback, detail panels.
 * @param {number} [cards=3]
 */
export default function SectionCardsSkeleton({
  cards = 3,
  accessibilityLabel,
  style,
}) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      style={[{ gap: S.tabSectionGap, width: '100%' }, style]}
    >
      {Array.from({ length: cards }, (_, i) => (
        <SkeletonCard key={i}>
          <SkeletonLine width={`${38 + (i % 2) * 8}%`} height={16} />
          <SkeletonLine width="100%" height={14} />
          <SkeletonLine width={`${88 - i * 6}%`} height={14} />
          {i === 0 ? <SkeletonLine width="56%" height={14} /> : null}
        </SkeletonCard>
      ))}
    </View>
  );
}
