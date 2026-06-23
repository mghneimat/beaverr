import { useWindowDimensions } from 'react-native';
import { S } from '../constants/onboarding-theme';

/** Standard vertical gap between stacked dashboard tab sections. */
export const tabSectionStackStyle = { gap: S.tabSectionGap };

/** Smaller gap for related blocks within a section group. */
export const tabSectionTightStackStyle = { gap: S.tabSectionTightGap };

/** Matches app shell — sidebar drawer + stacked dashboard layouts below this width. */
export const DASHBOARD_WIDE_BREAKPOINT = 768;

export function useIsDashboardNarrow() {
  const { width } = useWindowDimensions();
  return width < DASHBOARD_WIDE_BREAKPOINT;
}

/**
 * Breakdown table columns — name flexes; amount/share keep data-sized minimums.
 * Table fills card content width and shrinks with the viewport until cols hit mins.
 */
export function useBreakdownTableColumns() {
  const { width } = useWindowDimensions();
  const narrow = width < DASHBOARD_WIDE_BREAKPOINT;

  const amountColMinW = narrow ? 68 : 76;
  const shareColMinW = narrow ? 46 : 54;

  return {
    narrow,
    amountColMinW,
    shareColMinW,
    frequencyColMinW: narrow ? 64 : 72,
    dateColMinW: narrow ? 72 : 88,
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
    case 'reminder':
      return narrow ? 168 : 196;
    default:
      return undefined;
  }
}
