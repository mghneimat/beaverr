/** Review section id → section edit registry id */
export const REVIEW_SECTION_REGISTRY = {
  household: 'household',
  location: 'location',
  budget: 'budget',
  income: 'income',
  health: 'health',
  transport: 'transport',
  childrenCosts: 'childrenCosts',
  subscriptions: 'subscriptions',
  otherCosts: 'other-costs',
  pets: 'pets',
  debts: 'debts',
};

const RETURN_TO_REVIEW = '/(onboarding)/review';

/**
 * @param {string} sectionId
 * @param {string} editKey
 * @param {{ returnTo?: string, focusLabel?: string }} [options]
 * @returns {{ pathname: string, params: Record<string, string> } | null}
 */
export function buildReviewRowEditRoute(sectionId, editKey, options = {}) {
  const registryId = REVIEW_SECTION_REGISTRY[sectionId];
  if (!registryId || !editKey) return null;

  const { returnTo = RETURN_TO_REVIEW, focusLabel = '' } = options;
  return {
    pathname: `/(onboarding)/review-edit/section/${registryId}`,
    params: {
      focus: editKey,
      ...(focusLabel ? { focusLabel } : {}),
      returnTo,
    },
  };
}

/**
 * @param {{ sectionId: string, editKey?: string | null, editable?: boolean, label?: string }} row
 * @param {{ returnTo?: string }} [options]
 */
export function buildReviewRowEditRouteFromRow(row, options = {}) {
  if (!row?.editable || !row.editKey || !row.sectionId) return null;
  return buildReviewRowEditRoute(row.sectionId, row.editKey, {
    ...options,
    focusLabel: row.label || '',
  });
}

/** @param {string} sectionId */
export function reviewSectionHasEditableRows(sectionId) {
  return Boolean(REVIEW_SECTION_REGISTRY[sectionId]);
}
