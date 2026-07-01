import { parseChatResponseJson } from '../../../lib/advice/parseChatResponse';

describe('parseChatResponseJson', () => {
  it('parses reply and filters used_kb_ids to allowed set', () => {
    const result = parseChatResponseJson(
      { reply: 'Your income is 62,000 CZK.', used_kb_ids: ['cz_official#taxes', 'bogus'] },
      ['cz_official#taxes'],
    );

    expect(result.ok).toBe(true);
    expect(result.reply).toBe('Your income is 62,000 CZK.');
    expect(result.used_kb_ids).toEqual(['cz_official#taxes']);
  });

  it('accepts empty used_kb_ids for snapshot-only answers', () => {
    const result = parseChatResponseJson(
      { reply: 'Your income is 62,000 CZK.', used_kb_ids: [] },
      ['cz_official#renting'],
    );

    expect(result.ok).toBe(true);
    expect(result.used_kb_ids).toEqual([]);
  });

  it('rejects missing reply', () => {
    expect(parseChatResponseJson({ used_kb_ids: [] }, []).ok).toBe(false);
  });
});
