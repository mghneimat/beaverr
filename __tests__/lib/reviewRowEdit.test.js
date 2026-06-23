import { buildReviewRowEditRoute, REVIEW_SECTION_REGISTRY } from '../../lib/reviewRowEdit';

describe('reviewRowEdit', () => {
  it('maps review sections to registry ids', () => {
    expect(REVIEW_SECTION_REGISTRY.health).toBe('health');
    expect(REVIEW_SECTION_REGISTRY.childrenCosts).toBe('childrenCosts');
  });

  it('builds focused section edit route', () => {
    expect(buildReviewRowEditRoute('health', 'user')).toEqual({
      pathname: '/(onboarding)/review-edit/section/health',
      params: {
        focus: 'user',
        returnTo: '/(onboarding)/review',
      },
    });
  });

  it('includes focus label when provided', () => {
    expect(buildReviewRowEditRoute('health', 'partner', { focusLabel: 'Jana' })).toEqual({
      pathname: '/(onboarding)/review-edit/section/health',
      params: {
        focus: 'partner',
        focusLabel: 'Jana',
        returnTo: '/(onboarding)/review',
      },
    });
  });
});
