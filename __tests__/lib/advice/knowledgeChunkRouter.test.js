import { selectKnowledgeChunks } from '../../../lib/advice/knowledgeChunkRouter.js';

describe('knowledgeChunkRouter', () => {
  test('returns at most 2 chunks for triggered rules', () => {
    const chunks = selectKnowledgeChunks([
      { id: 'overcommitted', severity: 'critical' },
      { id: 'high_apr', severity: 'warning' },
    ], 'budget');
    expect(chunks.length).toBeLessThanOrEqual(2);
    expect(chunks[0]).toHaveProperty('id');
    expect(chunks[0]).toHaveProperty('excerpt');
  });

  test('prefers tab-specific chunks for expenses tab', () => {
    const chunks = selectKnowledgeChunks(
      [{ id: 'fixed_cost_ratio_tight', severity: 'warning' }],
      'expenses',
    );
    const ids = chunks.map((c) => c.id);
    expect(ids.some((id) => id.startsWith('tightwad#') || id.startsWith('ymyl#'))).toBe(true);
  });
});
