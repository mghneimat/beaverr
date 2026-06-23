/** Square control card — matches original pay-cycle tile footprint */
export const PAY_CYCLE_CARD_LAYOUT = {
  width: '48%',
  maxWidth: 220,
  minWidth: 160,
  aspectRatio: 1,
  alignSelf: 'flex-start',
};

/** Four-up row on cycle control — equal width, fills container */
export const CYCLE_CONTROL_TILE_LAYOUT = {
  flex: 1,
  flexBasis: 0,
  minWidth: 0,
  width: 0,
  aspectRatio: 1,
  alignSelf: 'stretch',
};

/** Quick links row — two tiles at ~50% width each */
export const QUICK_LINKS_TILE_LAYOUT = {
  width: '48%',
  flexGrow: 1,
  flexShrink: 1,
  minWidth: 140,
  minHeight: 88,
  alignSelf: 'flex-start',
};
