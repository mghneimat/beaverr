import { useSectionEditFocusOptional } from '../../lib/SectionEditFocusContext';

/**
 * Renders children when no focus is set (bulk edit) or when focusKey matches.
 */
export default function FocusGate({ focusKey, children }) {
  const ctx = useSectionEditFocusOptional();
  if (!ctx?.focusKey) return children;
  if (ctx.focusKey === focusKey) return children;
  return null;
}
