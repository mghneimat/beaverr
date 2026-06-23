import {
  clearReviewUiState,
  isReviewSectionEditing,
  isReviewSectionExpanded,
  setReviewSectionEditing,
  setReviewSectionExpanded,
} from '../../lib/reviewUiState';

describe('reviewUiState', () => {
  beforeEach(() => {
    clearReviewUiState();
  });

  it('tracks expanded and editing sections independently', () => {
    expect(isReviewSectionExpanded('household')).toBe(false);
    expect(isReviewSectionEditing('household')).toBe(false);

    setReviewSectionEditing('household', true);
    expect(isReviewSectionEditing('household')).toBe(true);
    expect(isReviewSectionExpanded('household')).toBe(true);

    setReviewSectionEditing('household', false);
    expect(isReviewSectionEditing('household')).toBe(false);
    expect(isReviewSectionExpanded('household')).toBe(true);
  });

  it('clears expanded state when collapsed', () => {
    setReviewSectionExpanded('location', true);
    setReviewSectionEditing('location', true);

    setReviewSectionExpanded('location', false);
    expect(isReviewSectionExpanded('location')).toBe(false);
    expect(isReviewSectionEditing('location')).toBe(true);
  });

  it('clears all session state', () => {
    setReviewSectionEditing('budget', true);
    clearReviewUiState();
    expect(isReviewSectionExpanded('budget')).toBe(false);
    expect(isReviewSectionEditing('budget')).toBe(false);
  });
});
