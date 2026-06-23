import { useWindowDimensions } from 'react-native';
import { C, ONBOARDING_ILLUSTRATION, S } from '../constants/onboarding-theme';

/** Content-driven breakpoints for onboarding surfaces */
export const B = {
  narrow: 400,
  compact: 520,
};

/**
 * @param {number} width - Viewport width in px
 * @returns {Object} Layout flags and derived sizes
 */
export function getOnboardingLayout(width) {
  const isNarrow = width < B.narrow;
  const isCompact = width < B.compact && !isNarrow;
  const pagePadH = isNarrow ? 16 : S.pagePadH;
  const contentWidth = Math.max(0, width - pagePadH * 2);
  const targetIllustrationWidth = isNarrow
    ? ONBOARDING_ILLUSTRATION.widthNarrow
    : ONBOARDING_ILLUSTRATION.width;

  return {
    width,
    isNarrow,
    isCompact,
    stackAmount: isNarrow,
    pagePadH,
    amountColumnWidth: isNarrow ? 0 : isCompact ? 108 : 140,
    previewFontSize: isNarrow ? 28 : 32,
    questionTitleSize: isNarrow ? 22 : 24,
    illustrationWidth: Math.min(targetIllustrationWidth, contentWidth),
    /** Legacy estimate — only used before onLayout on splash screens */
    footerReserve: isNarrow ? 72 : 132,
  };
}

export function useOnboardingLayout() {
  const { width } = useWindowDimensions();
  return getOnboardingLayout(width);
}

export function getRowDirection(layout) {
  return layout.stackAmount ? 'column' : 'row';
}

/**
 * Label column styles for the budget summary table.
 */
export function getLabelCellStyle(layout, { paddingVertical = 12, indent = 0 } = {}) {
  if (layout.stackAmount) {
    return {
      paddingTop: paddingVertical,
      paddingBottom: 4,
      paddingHorizontal: 16,
      paddingLeft: 16 + indent,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
    };
  }

  return {
    flex: 1,
    minWidth: 0,
    paddingVertical,
    paddingLeft: 16 + indent,
    paddingRight: 10,
    justifyContent: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: C.divider,
    flexDirection: 'row',
    alignItems: 'center',
  };
}
