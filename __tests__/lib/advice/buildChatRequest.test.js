import { buildChatRequest } from '../../../lib/advice/buildChatRequest';

const snapshot = {
  v: 1,
  locale: 'en',
  tab_key: 'budget',
  location: { country_code: 'CZ' },
  household: { adults: 2, children: 0, has_partner: true },
  ledger: { income_m: 50000, fix_ratio: 0.7 },
};

describe('buildChatRequest', () => {
  it('wraps first message with full context', () => {
    const { systemPrompt, contents, promptVersion, kbChunkIds } = buildChatRequest({
      snapshot,
      triggered_rules: [{ id: 'fixed_cost_ratio_tight' }],
      locale: 'en',
      tab_key: 'budget',
      coach_paragraphs: ['Good paragraph', 'Concern paragraph'],
      kb_chunks: [{ id: 'cz_official#taxes', excerpt: 'tax info' }],
      history: [],
      message: 'What about my taxes?',
    });

    expect(systemPrompt).toContain('CHAT MODE');
    expect(promptVersion).toBe('v3');
    expect(kbChunkIds).toEqual(['cz_official#taxes']);
    expect(contents).toHaveLength(1);
    expect(contents[0].role).toBe('user');
    expect(contents[0].parts[0].text).toContain('What about my taxes?');
    expect(contents[0].parts[0].text).toContain('coach_paragraphs');
  });

  it('maps history roles and appends context reminder', () => {
    const { contents } = buildChatRequest({
      snapshot,
      triggered_rules: [],
      locale: 'en',
      history: [
        { role: 'user', content: 'First question' },
        { role: 'assistant', content: 'First answer' },
      ],
      message: 'Follow up',
    });

    expect(contents).toHaveLength(3);
    expect(contents[0].role).toBe('user');
    expect(contents[1].role).toBe('model');
    expect(contents[2].parts[0].text).toContain('Reminder');
    expect(contents[2].parts[0].text).toContain('Follow up');
  });
});
