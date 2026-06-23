import { ScrollView, View, Platform } from 'react-native';
import { useBreakdownTableColumns } from '../../lib/dashboardLayout';

const PILL_ICON_SLOT = 36;
const PILL_CHEVRON_SLOT = 32;
const PILL_ROW_GAP = 10;
const ROW_PAD_H = 28;

/** Minimum scroll width for icon + name + share + amount pill tables. */
export function breakdownPillTableMinWidth(amountColMinW, shareColMinW, { withChevron = true } = {}) {
  const amountW = Math.max(amountColMinW, 108);
  const shareW = Math.max(shareColMinW, 56);
  const nameMin = 140;
  const chevron = withChevron ? PILL_CHEVRON_SLOT : 0;
  return ROW_PAD_H + PILL_ICON_SLOT + chevron + (PILL_ROW_GAP * 3) + nameMin + amountW + shareW;
}

/** Minimum scroll width for donut legend (dot + name + amount + share). */
export function donutLegendTableMinWidth(nameColW, amountColW, shareColW, colGap = 12) {
  const dot = 10;
  const amountW = Math.max(amountColW, 108);
  const shareW = Math.max(shareColW, 56);
  const nameW = Math.max(nameColW, 120);
  return dot + colGap + nameW + colGap + amountW + colGap + shareW + 16;
}

/**
 * Horizontal scroll wrapper for dashboard tables on phone-width viewports.
 */
export default function TableHorizontalScroll({ children, minWidth, enabled }) {
  const { isPhone } = useBreakdownTableColumns();
  const scroll = enabled ?? isPhone;

  if (!scroll || !minWidth) {
    return <View style={{ width: '100%' }}>{children}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={Platform.OS === 'web'}
      style={{ width: '100%' }}
      contentContainerStyle={{ alignItems: 'flex-start' }}
    >
      <View style={{ minWidth, width: minWidth }}>
        {children}
      </View>
    </ScrollView>
  );
}
