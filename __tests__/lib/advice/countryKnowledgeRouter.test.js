import { selectCountryKnowledgeChunks } from '../../../lib/advice/countryKnowledgeRouter';

describe('countryKnowledgeRouter', () => {
  it('returns empty for non-CZ country', () => {
    const chunks = selectCountryKnowledgeChunks({
      country_code: 'DE',
      tabKey: 'expenses',
    });
    expect(chunks).toEqual([]);
  });

  it('prefers expenses tab chunks for CZ', () => {
    const chunks = selectCountryKnowledgeChunks({
      country_code: 'CZ',
      tabKey: 'expenses',
    });
    expect(chunks.length).toBeLessThanOrEqual(2);
    expect(chunks.some((c) => c.id.includes('renting') || c.id.includes('utilities'))).toBe(
      true,
    );
  });

  it('maps health_coverage_gap rule to health insurance chunk', () => {
    const chunks = selectCountryKnowledgeChunks({
      country_code: 'CZ',
      tabKey: 'alerts',
      triggered_rules: [{ id: 'health_coverage_gap' }],
    });
    expect(chunks.some((c) => c.id === 'cz_official#health_insurance')).toBe(true);
  });

  it('matches user message keywords for permits', () => {
    const chunks = selectCountryKnowledgeChunks({
      country_code: 'CZ',
      tabKey: 'home',
      userMessage: 'How do I get a residence permit from MOI?',
    });
    expect(chunks.some((c) => c.id === 'cz_official#permits')).toBe(true);
  });

  it('includes official_url metadata on chunks', () => {
    const chunks = selectCountryKnowledgeChunks({
      country_code: 'CZ',
      tabKey: 'budget',
    });
    chunks.forEach((chunk) => {
      expect(chunk.official_url).toMatch(/^https:\/\//);
      expect(chunk.title).toBeTruthy();
    });
  });
});
