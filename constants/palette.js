/**
 * Layer 1 primitives (P.light / P.dark) + Layer 2 semantics via buildSemanticColors().
 * No React Native imports — safe for tailwind.config.js and Node tooling.
 */

export const P = {
  light: {
    navy900: '#14274E',
    navy950: '#0D1B38',
    blue500: '#3B82F6',
    blue600: '#2563EB',
    teal600: '#0D9488',
    teal100: '#CCFBF1',
    coral500: '#F2994A',
    coral100: '#FDE8D2',
    green600: '#16A34A',
    red500: '#EF4444',
    amber500: '#F59E0B',
    amber600: '#D97706',
    slate400: '#8895AB',
    slate300: '#C7D2E8',
    slate200: '#E7ECF6',
    white: '#FFFFFF',
    bg: '#EFF4FB',
    surfaceTint: '#F3F6FC',
    green50: '#F0FDF4',
    green200: '#BBF7D0',
    red50: '#FEF2F2',
    red200: '#FECACA',
    amber50: '#FFFBEB',
    amber200: '#FDE68A',
    blue50: '#DBEAFE',
    blue300: '#93C5FD',
    blue800: '#1E40AF',
    gray300: '#D1D5DB',
    debt: '#6B4FA0',
    navWash: '#E8EDF5',
    insightBg: '#E4EDF8',
    insightBorder: '#B8CCE8',
    breakdownStripe: '#F6F4F0',
    breakdownHover: '#EDEAE4',
  },
  dark: {
    navy900dark: '#1B2D52',
    blue400: '#5B9BFF',
    blue600: '#3B82F6',
    teal400: '#2DD4BF',
    coral400: '#F4A968',
    green500: '#22C55E',
    red400: '#F87171',
    amber400: '#FBBF24',
    slate500: '#6B7894',
    slate600: '#3A4664',
    white: '#FFFFFF',
    bg: '#0B1220',
    surface: '#141D33',
    surfaceTint: '#1B2638',
    greenBg: '#11291D',
    greenBorder: '#1F4A30',
    greenText: '#4ADE80',
    redBg: '#321518',
    redBorder: '#5C2328',
    amberBg: '#3A2A0E',
    amberBorder: '#5C4214',
    blueBg: '#16243F',
    blueBorder: '#28406B',
    blueText: '#7DAEFF',
    debt: '#9B7FD4',
    insightBg: '#16243F',
    insightBorder: '#28406B',
    breakdownStripe: '#141D33',
    breakdownHover: '#1B2638',
  },
};

/** @typedef {'light' | 'dark'} ColorScheme */

/**
 * @param {ColorScheme} mode
 * @returns {Record<string, string>}
 */
export function buildSemanticColors(mode) {
  if (mode === 'dark') {
    const d = P.dark;
    const base = {
      bg: d.bg,
      surface: d.surface,
      surfaceTint: d.surfaceTint,

      primary: d.blue400,
      primaryPressed: d.blue600,
      accent: d.blue400,
      accentPressed: d.blue600,
      delight: d.coral400,

      positiveBg: d.greenBg,
      positiveBorder: d.greenBorder,
      positive: d.greenText,

      dangerBg: d.redBg,
      dangerBorder: d.redBorder,
      danger: d.red400,

      warningBg: d.amberBg,
      warningBorder: d.amberBorder,
      warning: d.amber400,
      cycleWarning: d.amber400,

      infoBg: d.blueBg,
      infoBorder: d.blueBorder,
      info: d.blueText,

      text: '#E8EDF7',
      muted: '#8694B0',
      border: '#2A3650',
      disabled: d.slate600,

      overlayHover: 'rgba(255,255,255,0.04)',
      overlayPressed: 'rgba(255,255,255,0.07)',
      overlaySelected: 'rgba(255,255,255,0.1)',

      selectedBg: d.blue400,
      selectedText: d.bg,

      progressTrack: '#2A3650',
      progressFill: d.blue400,

      tableHeaderBg: d.surfaceTint,
      tableRowBorder: '#2A3650',
      tableRowHover: d.surfaceTint,

      debt: d.debt,

      navSelectedBg: d.surfaceTint,
      navSelectedBorder: '#2A3650',
      infoWashBg: d.surfaceTint,
      infoWashBorder: '#2A3650',
      insightCardBg: d.insightBg,
      insightCardBorder: d.insightBorder,
      insightGlow: d.blue400,

      breakdownStripeBg: d.breakdownStripe,
      breakdownRowHover: d.breakdownHover,

      overlaySelectedDarker: 'rgba(255,255,255,0.15)',
      overlayHoverDarker: 'rgba(255,255,255,0.07)',
      overlayPressedDarker: 'rgba(255,255,255,0.12)',
    };
    return {
      ...base,
      heroIncomeBg: base.positiveBg,
      heroIncomeBorder: base.positiveBorder,
      heroIncomeBadge: base.positive,
      heroIncomeValue: base.positive,
      heroExpenseBg: base.dangerBg,
      heroExpenseBorder: base.dangerBorder,
      heroExpenseBadge: base.danger,
      heroExpenseValue: base.danger,
      heroWarningBg: base.warningBg,
      heroWarningBorder: base.warningBorder,
      heroWarningValue: base.warning,
      chipSelectedBg: base.selectedBg,
      chipSelectedBorder: base.primary,
      chipSelectedText: base.selectedText,
      pillSelectedBg: base.accent,
      pillSelectedPressed: base.accentPressed,
      pillSelectedText: base.selectedText,
      pillUnselectedBg: base.surface,
      pillUnselectedBorder: base.border,
      pillUnselectedText: base.muted,
      placeholder: base.muted,
      divider: base.border,
      infoText: base.info,
      budgetSplitSavings: base.accent,
      budgetSplitSpending: base.positive,
      addBorder: base.accent,
      addText: base.accent,
      addPressed: base.bg,
    };
  }

  const l = P.light;
  const base = {
    bg: l.bg,
    surface: l.white,
    surfaceTint: l.surfaceTint,

    primary: l.navy900,
    primaryPressed: l.navy950,
    accent: l.blue500,
    accentPressed: l.blue600,
    delight: l.coral500,

    positiveBg: l.green50,
    positiveBorder: l.green200,
    positive: l.green600,

    dangerBg: l.red50,
    dangerBorder: l.red200,
    danger: l.red500,

    warningBg: l.amber50,
    warningBorder: l.amber200,
    warning: l.amber600,
    cycleWarning: l.amber500,

    infoBg: l.blue50,
    infoBorder: l.blue300,
    info: l.blue800,

    text: l.navy900,
    muted: l.slate400,
    border: l.slate300,
    disabled: l.gray300,

    overlayHover: 'rgba(20,39,78,0.05)',
    overlayPressed: 'rgba(20,39,78,0.08)',
    overlaySelected: 'rgba(20,39,78,0.1)',

    selectedBg: l.navy900,
    selectedText: l.white,

    progressTrack: l.slate300,
    progressFill: l.blue500,

    tableHeaderBg: l.surfaceTint,
    tableRowBorder: l.slate200,
    tableRowHover: l.surfaceTint,

    debt: l.debt,

    navSelectedBg: l.navWash,
    navSelectedBorder: l.slate300,
    infoWashBg: l.surfaceTint,
    infoWashBorder: l.slate300,
    insightCardBg: l.insightBg,
    insightCardBorder: l.insightBorder,
    insightGlow: l.blue500,

    breakdownStripeBg: l.breakdownStripe,
    breakdownRowHover: l.breakdownHover,

    overlaySelectedDarker: 'rgba(20,39,78,0.15)',
    overlayHoverDarker: 'rgba(20,39,78,0.08)',
    overlayPressedDarker: 'rgba(20,39,78,0.12)',
  };
  return {
    ...base,
    heroIncomeBg: base.positiveBg,
    heroIncomeBorder: base.positiveBorder,
    heroIncomeBadge: base.positive,
    heroIncomeValue: base.positive,
    heroExpenseBg: base.dangerBg,
    heroExpenseBorder: base.dangerBorder,
    heroExpenseBadge: base.danger,
    heroExpenseValue: base.danger,
    heroWarningBg: base.warningBg,
    heroWarningBorder: base.warningBorder,
    heroWarningValue: base.warning,
    chipSelectedBg: base.selectedBg,
    chipSelectedBorder: base.primary,
    chipSelectedText: base.selectedText,
    pillSelectedBg: base.accent,
    pillSelectedPressed: base.accentPressed,
    pillSelectedText: base.selectedText,
    pillUnselectedBg: base.surface,
    pillUnselectedBorder: base.border,
    pillUnselectedText: base.muted,
    placeholder: base.muted,
    divider: base.border,
    infoText: base.info,
    budgetSplitSavings: base.accent,
    budgetSplitSpending: base.positive,
    addBorder: base.accent,
    addText: base.accent,
    addPressed: base.bg,
  };
}

export const PALETTES = {
  light: buildSemanticColors('light'),
  dark: buildSemanticColors('dark'),
};

/** Mutable active semantic colors — stable reference for `import { C }`. */
export const activeColors = { ...PALETTES.light };

/** @type {typeof activeColors} */
export const C = activeColors;

/**
 * Replace keys on the mutable C object in-place.
 * @param {ColorScheme} mode
 */
export function applyPaletteToActiveColors(mode) {
  const next = buildSemanticColors(mode);
  Object.keys(activeColors).forEach((key) => {
    if (!(key in next)) delete activeColors[key];
  });
  Object.assign(activeColors, next);
}
