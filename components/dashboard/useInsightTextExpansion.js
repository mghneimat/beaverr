import { useCallback, useMemo, useState } from 'react';

const STANDALONE_COLLAPSED_LINES = 4;
const EMBEDDED_COLLAPSED_LINES = 2;

export function getInsightCollapsedLineBudget(variant = 'standalone') {
  return variant === 'embedded' ? EMBEDDED_COLLAPSED_LINES : STANDALONE_COLLAPSED_LINES;
}

export function buildInsightFullText(paragraphs) {
  return (paragraphs || []).filter(Boolean).join('\n\n');
}

export function insightTextExceedsLineBudget(lineCount, variant = 'standalone') {
  return lineCount > getInsightCollapsedLineBudget(variant);
}

/**
 * Detects whether insight paragraphs exceed the collapsed line budget.
 * Uses a hidden full-text measure pass via onTextLayout on an unconstrained Text.
 */
export function useInsightTextExpansion(paragraphs, { variant = 'standalone' } = {}) {
  const collapsedLines = getInsightCollapsedLineBudget(variant);

  const fullText = useMemo(
    () => buildInsightFullText(paragraphs),
    [paragraphs],
  );

  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [glowToken, setGlowToken] = useState(0);

  const handleFullTextLayout = useCallback((event) => {
    const lineCount = event.nativeEvent.lines?.length ?? 0;
    setIsTruncated(insightTextExceedsLineBudget(lineCount, variant));
  }, [variant]);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
    setGlowToken((token) => token + 1);
  }, []);

  const showToggle = variant === 'standalone' && isTruncated;

  return {
    fullText,
    collapsedLines,
    expanded,
    isTruncated,
    showToggle,
    glowToken,
    toggleExpanded,
    handleFullTextLayout,
  };
}
