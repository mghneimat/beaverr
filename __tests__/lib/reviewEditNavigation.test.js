import {
  buildReviewEditRoute,
  buildReviewAlertEditRoute,
  REVIEW_SECTION_EDIT_TARGETS,
} from '../../lib/reviewEditNavigation';

describe('reviewEditNavigation', () => {
  it('routes subscriptions to review expense subsection', () => {
    const route = buildReviewEditRoute('subscriptions');
    expect(route).toBe('/(onboarding)/review-edit/section/subscriptions');
  });

  it('routes income to section editor', () => {
    expect(buildReviewEditRoute('income')).toBe(
      '/(onboarding)/review-edit/section/income',
    );
  });

  it('routes zero-income alert to section editor', () => {
    expect(buildReviewAlertEditRoute('zero-income')).toBe(
      '/(onboarding)/review-edit/section/income',
    );
  });

  it('routes health alert to section editor', () => {
    expect(buildReviewAlertEditRoute('health-unconfirmed')).toBe(
      '/(onboarding)/review-edit/section/health',
    );
  });

  it('routes household to section editor', () => {
    expect(buildReviewEditRoute('household')).toBe(
      '/(onboarding)/review-edit/section/household',
    );
  });

  it('routes location to section editor', () => {
    expect(buildReviewEditRoute('location')).toBe(
      '/(onboarding)/review-edit/section/location',
    );
  });

  it('maps app dashboard deep link for transport', () => {
    const route = buildReviewEditRoute('transport', { fromApp: true });
    expect(route).toEqual({
      pathname: '/(app)/costs',
      params: { primary: 'recurring', sub: 'transport' },
    });
  });

  it('defines targets for all review expense sections', () => {
    expect(REVIEW_SECTION_EDIT_TARGETS.subscriptions.type).toBe('section');
    expect(REVIEW_SECTION_EDIT_TARGETS.budget.type).toBe('section');
    expect(REVIEW_SECTION_EDIT_TARGETS.income.type).toBe('section');
    expect(REVIEW_SECTION_EDIT_TARGETS.transport.type).toBe('section');
  });
});
