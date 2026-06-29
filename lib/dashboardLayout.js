import { useWindowDimensions } from 'react-native';
import { S } from '../constants/onboarding-theme';
import { DASHBOARD_WIDE_BREAKPOINT, PHONE_MAX } from './layoutBreakpoints';

/** Standard vertical gap between stacked dashboard tab sections. */
export const tabSectionStackStyle = { gap: S.tabSectionGap };

/** Smaller gap for related blocks within a section group. */
export const tabSectionTightStackStyle = { gap: S.tabSectionTightGap };

export { DASHBOARD_WIDE_BREAKPOINT, PHONE_MAX };

/**
 * @param {number} width
 * @returns {{ width: number, isPhone: boolean, isNarrow: boolean, pagePadH: number, tableLayout: 'card' | 'table', titleFontSize: number }}
 */
export function getDashboardLayout(width) {
  const isPhone = width < PHONE_MAX;
  const isNarrow = width < DASHBOARD_WIDE_BREAKPOINT;
  return {
    width,
    isPhone,
    isNarrow,
    pagePadH: isPhone ? 16 : S.pagePadH,
    tableLayout: isPhone ? 'card' : 'table',
    titleFontSize: isPhone ? 24 : 28,
  };
}

export function useDashboardLayout() {
  const { width } = useWindowDimensions();
  return getDashboardLayout(width);
}

export function useIsDashboardNarrow() {
  const { isNarrow } = useDashboardLayout();
  return isNarrow;
}

/**
 * Breakdown table columns — name flexes; amount/share keep data-sized minimums.
 * Table fills card content width and shrinks with the viewport until cols hit mins.
 */
export function useBreakdownTableColumns() {
  const layout = useDashboardLayout();
  const { isNarrow, isPhone, tableLayout } = layout;

  const amountColMinW = isPhone ? 108 : (isNarrow ? 68 : 76);
  const shareColMinW = isPhone ? 56 : (isNarrow ? 46 : 54);

  return {
    ...layout,
    narrow: isNarrow,
    isPhone,
    tableLayout,
    amountColMinW,
    shareColMinW,
    frequencyColMinW: isNarrow ? 64 : 72,
    dateColMinW: isNarrow ? 72 : 88,
    /** @deprecated Use amountColMinW — kept for donut legend callers */
    amountColW: amountColMinW,
    /** @deprecated Use shareColMinW */
    shareColW: shareColMinW,
  };
}

/** Minimum width per ledger detail column key. */
export function ledgerColumnMinWidth(key, narrow = false) {
  switch (key) {
    case 'amount':
      return narrow ? 68 : 76;
    case 'frequency':
      return narrow ? 64 : 72;
    case 'date':
    case 'endDate':
    case 'nextPayment':
    case 'reminderDate':
    case 'reminderType':
      return narrow ? 72 : 88;
    case 'share':
      return narrow ? 46 : 54;
    case 'spent':
    case 'saved':
    case 'deficit':
    case 'budget':
      return narrow ? 88 : 112;
    case 'reminder':
      return narrow ? 168 : 196;
    default:
      return undefined;
  }
}
