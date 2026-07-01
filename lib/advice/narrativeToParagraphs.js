/**
 * @param {object} narrative
 * @returns {string[]}
 */
export function narrativeToParagraphs(narrative) {
  if (!narrative) return [];

  const fromV3 = Array.isArray(narrative.paragraphs)
    ? narrative.paragraphs.filter(Boolean).map((s) => String(s).trim()).filter(Boolean)
    : [];
  if (fromV3.length > 0) return fromV3;

  // v2 cache / undeployed edge: headline + bullets → display paragraphs
  const bullets = Array.isArray(narrative.bullets)
    ? narrative.bullets.filter(Boolean).map((s) => String(s).trim()).filter(Boolean)
    : [];
  if (typeof narrative.headline === 'string' && narrative.headline.trim()) {
    return [narrative.headline.trim(), ...bullets];
  }
  return bullets;
}
