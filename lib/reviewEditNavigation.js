import { sectionEditPath } from './sectionEditPaths';

/**
 * Review edit targets — dashboard-style subsection editors (not full onboarding replay).
 * @typedef {'onboarding'|'expenses'|'income'|'section'|'app-expenses'|'app-income'|'app-section'} ReviewEditTargetType
 */

/** @type {Record<string, { type: ReviewEditTargetType, [key: string]: string }>} */
export const REVIEW_SECTION_EDIT_TARGETS = {
  household: { type: 'section', sectionId: 'household' },
  location: { type: 'section', sectionId: 'location' },
  budget: { type: 'section', sectionId: 'budget' },
  income: { type: 'section', sectionId: 'income' },
  health: { type: 'section', sectionId: 'health' },
  transport: { type: 'section', sectionId: 'transport' },
  childrenCosts: { type: 'section', sectionId: 'childrenCosts' },
  subscriptions: { type: 'section', sectionId: 'subscriptions' },
  otherCosts: { type: 'section', sectionId: 'other-costs' },
  pets: { type: 'section', sectionId: 'pets' },
  debts: { type: 'section', sectionId: 'debts' },
};

/** Alert-specific overrides (e.g. health confirmation → section editor). */
export const REVIEW_ALERT_EDIT_TARGETS = {
  'zero-income': { type: 'section', sectionId: 'income' },
  'zero-income-neutral': { type: 'section', sectionId: 'income' },
  'health-unconfirmed': { type: 'section', sectionId: 'health' },
};

const RETURN_TO_REVIEW = '/(onboarding)/review';

/**
 * Build an Expo Router href for editing a review section from Review & Confirm.
 * @param {string} sectionId
 * @param {{ fromApp?: boolean }} [options]
 * @returns {string | { pathname: string, params: Record<string, string> }}
 */
export function buildReviewEditRoute(sectionId, options = {}) {
  const target = REVIEW_SECTION_EDIT_TARGETS[sectionId];
  if (!target) return RETURN_TO_REVIEW;
  return buildEditTargetRoute(target, options);
}

/**
 * @param {string} alertId
 * @param {{ fromApp?: boolean }} [options]
 */
export function buildReviewAlertEditRoute(alertId, options = {}) {
  const target = REVIEW_ALERT_EDIT_TARGETS[alertId];
  if (!target) return RETURN_TO_REVIEW;
  return buildEditTargetRoute(target, options);
}

/**
 * @param {{ type: ReviewEditTargetType, [key: string]: string }} target
 * @param {{ fromApp?: boolean }} [options]
 */
export function buildEditTargetRoute(target, options = {}) {
  const { fromApp = false } = options;
  const returnTo = fromApp ? '' : RETURN_TO_REVIEW;

  switch (target.type) {
    case 'onboarding':
      return target.route;

    case 'section':
      if (fromApp) return sectionEditPath(target.sectionId);
      return `/(onboarding)/review-edit/section/${target.sectionId}`;

    case 'income':
      if (fromApp) {
        return {
          pathname: '/(app)/income',
          params: {
            tab: target.primaryTab || 'primary',
            sub: target.secondaryTab || '',
          },
        };
      }
      return {
        pathname: '/(onboarding)/review-edit/income',
        params: {
          tab: target.primaryTab || 'primary',
          sub: target.secondaryTab || '',
          ...(returnTo ? { returnTo } : {}),
        },
      };

    case 'expenses':
      if (fromApp) {
        return {
          pathname: '/(app)/costs',
          params: {
            primary: target.primaryTab || 'recurring',
            sub: target.secondaryTab || '',
            ...(target.editRow ? { editRow: target.editRow } : {}),
          },
        };
      }
      return {
        pathname: '/(onboarding)/review-edit/expenses',
        params: {
          primary: target.primaryTab || 'recurring',
          sub: target.secondaryTab || '',
          ...(target.editRow ? { editRow: target.editRow } : {}),
          ...(returnTo ? { returnTo } : {}),
        },
      };

    default:
      return RETURN_TO_REVIEW;
  }
}

/** Push helper — normalizes string vs object routes for expo-router. */
export function pushReviewEdit(router, sectionId, options = {}) {
  const route = buildReviewEditRoute(sectionId, options);
  router.push(route);
}
