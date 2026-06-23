/**
 * Map daily spending destination to dashboard jar focus id.
 * @param {import('./dailySpendingStrategy').DailySpendingDestination|null|undefined} destination
 * @returns {string|null}
 */
export function dailyDestinationToJarId(destination) {
  switch (destination) {
    case 'looseMoney':
      return 'looseCash';
    case 'savings':
      return 'savings';
    default:
      return null;
  }
}

/**
 * Resolve deep-link target for cycle budget reduction banner.
 * @param {import('./dailySpendingStrategy').DailySpendingDestination|null|undefined} dailyDest
 * @returns {{ route: string, jarId: string|null }}
 */
export function resolveBannerJarFocus(dailyDest) {
  const jarId = dailyDestinationToJarId(dailyDest);
  if (dailyDest === 'savings') {
    return { route: 'savings', jarId: 'savings' };
  }
  if (jarId) {
    return { route: 'savings', jarId };
  }
  return { route: 'savings', jarId: null };
}
