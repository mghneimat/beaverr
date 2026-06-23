import { buildStashBurnRate } from '../lib/stashBurnRate';

describe('buildStashBurnRate', () => {
  const goals = [{ id: 'g1', name: 'Emergency fund' }];

  it('returns empty when balance and outflows are zero', () => {
    const result = buildStashBurnRate({ balance: 0, movements: [], goals });
    expect(result.total).toBe(0);
    expect(result.segments).toEqual([]);
  });

  it('shows remaining balance when nothing has left the tab', () => {
    const result = buildStashBurnRate({ balance: 1000, movements: [], goals });
    expect(result.total).toBe(1000);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].key).toBe('remaining');
    expect(result.segments[0].value).toBe(1000);
  });

  it('splits goal outflows and remaining balance', () => {
    const result = buildStashBurnRate({
      balance: 800,
      goals,
      movements: [
        {
          id: 'm1',
          stashRef: 'looseCash',
          direction: 'out',
          type: 'goal_funding',
          goalId: 'g1',
          amount: 200,
          date: '2026-06-01',
        },
      ],
    });
    expect(result.total).toBe(1000);
    expect(result.totalOut).toBe(200);
    expect(result.segments.find((seg) => seg.key === 'goal:g1')?.value).toBe(200);
    expect(result.segments.find((seg) => seg.key === 'remaining')?.value).toBe(800);
  });

  it('groups transfers separately from goal funding', () => {
    const result = buildStashBurnRate({
      balance: 500,
      goals,
      movements: [
        {
          id: 'm1',
          stashRef: 'savings',
          direction: 'out',
          type: 'transfer_out',
          amount: 100,
          date: '2026-06-01',
        },
        {
          id: 'm2',
          stashRef: 'savings',
          direction: 'out',
          type: 'goal_funding',
          goalId: 'g1',
          amount: 50,
          date: '2026-06-02',
        },
      ],
    });
    expect(result.total).toBe(650);
    expect(result.segments.find((seg) => seg.key === 'transfer_out')?.value).toBe(100);
    expect(result.segments.find((seg) => seg.key === 'goal:g1')?.value).toBe(50);
  });
});
