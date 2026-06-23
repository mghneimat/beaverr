import {
  buildInsightFullText,
  getInsightCollapsedLineBudget,
  insightTextExceedsLineBudget,
} from '../../components/dashboard/useInsightTextExpansion';

describe('useInsightTextExpansion helpers', () => {
  test('buildInsightFullText joins non-empty paragraphs', () => {
    expect(buildInsightFullText(['One line', '', 'Two lines'])).toBe('One line\n\nTwo lines');
    expect(buildInsightFullText([])).toBe('');
  });

  test('standalone collapses after four lines', () => {
    expect(getInsightCollapsedLineBudget('standalone')).toBe(4);
    expect(insightTextExceedsLineBudget(4, 'standalone')).toBe(false);
    expect(insightTextExceedsLineBudget(5, 'standalone')).toBe(true);
  });

  test('embedded collapses after two lines', () => {
    expect(getInsightCollapsedLineBudget('embedded')).toBe(2);
    expect(insightTextExceedsLineBudget(2, 'embedded')).toBe(false);
    expect(insightTextExceedsLineBudget(3, 'embedded')).toBe(true);
  });
});
