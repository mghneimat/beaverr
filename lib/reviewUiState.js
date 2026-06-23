/**
 * In-memory Review & Confirm UI state — survives refocus reloads and edit-modal navigation.
 */

/** @type {Set<string>} */
const expandedSections = new Set();

/** @type {Set<string>} */
const editingSections = new Set();

export function isReviewSectionExpanded(sectionId) {
  return expandedSections.has(sectionId);
}

export function setReviewSectionExpanded(sectionId, open) {
  if (!sectionId) return;
  if (open) expandedSections.add(sectionId);
  else expandedSections.delete(sectionId);
}

export function isReviewSectionEditing(sectionId) {
  return editingSections.has(sectionId);
}

export function setReviewSectionEditing(sectionId, editing) {
  if (!sectionId) return;
  if (editing) {
    editingSections.add(sectionId);
    expandedSections.add(sectionId);
  } else {
    editingSections.delete(sectionId);
  }
}

export function clearReviewUiState() {
  expandedSections.clear();
  editingSections.clear();
}
