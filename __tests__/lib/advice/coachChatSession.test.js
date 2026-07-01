import { buildCoachChatContextKey } from '../../../lib/advice/coachChatSession';

describe('buildCoachChatContextKey', () => {
  it('returns general for null context', () => {
    expect(buildCoachChatContextKey(null)).toBe('general');
  });

  it('includes tab and ledger totals', () => {
    const key = buildCoachChatContextKey({
      tabKey: 'home',
      snapshot: { ledger: { income_m: 62000, fix_ratio: 0.66 } },
      triggeredRules: [],
      coachParagraphs: [],
    });
    expect(key).toBe('home:62000:0.66:0');
  });
});
