import AIInsightSection from './AIInsightSection';

/**
 * Per-section commentary slot on Summary.
 * Phase 4: pass `aiNarrative` from DeepSeek; falls back to rule-based `insight`.
 */
export default function InsightSlot({ insight, aiNarrative = null, comingSoonLabel }) {
  const text = aiNarrative || insight;
  if (!text) return null;

  return (
    <AIInsightSection
      variant="embedded"
      paragraphs={[text]}
      titleOverride={comingSoonLabel}
    />
  );
}
