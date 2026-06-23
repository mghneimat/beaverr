import { buildIncomeBurnRate, buildBurnRateSegments } from '../../lib/burnRate';

describe('burnRate', () => {
  test('buildIncomeBurnRate splits income into committed, saved, and to spend', () => {
    const result = buildIncomeBurnRate({
      income: 62000,
      committed: 35731,
      saved: 5000,
      showSaved: true,
      toSpend: 21269,
    });

    expect(result.income).toBe(62000);
    expect(result.segments.find((s) => s.key === 'committed')?.value).toBe(35731);
    expect(result.segments.find((s) => s.key === 'saved')?.value).toBe(5000);
    expect(result.segments.find((s) => s.key === 'toSpend')?.value).toBe(21269);
    expect(result.segments.find((s) => s.key === 'unallocated')).toBeUndefined();
  });

  test('buildIncomeBurnRate adds unallocated slice when income exceeds allocation', () => {
    const result = buildIncomeBurnRate({
      income: 62000,
      committed: 30000,
      saved: 0,
      showSaved: false,
      toSpend: 20000,
    });

    expect(result.segments.find((s) => s.key === 'unallocated')?.value).toBe(12000);
  });

  test('buildIncomeBurnRate drops dust unallocated that would display as 0 Kč', () => {
    const result = buildIncomeBurnRate({
      income: 62000,
      committed: 35731,
      saved: 5000,
      showSaved: true,
      toSpend: 21268.6,
    });

    expect(result.segments.find((s) => s.key === 'unallocated')).toBeUndefined();
    expect(result.barScale).toBeGreaterThan(1);
  });

  test('buildBurnRateSegments legacy wrapper uses income base', () => {
    const result = buildBurnRateSegments({
      totalIncome: 50000,
      fixedCosts: 20000,
      debtPayments: 5000,
      monthlyFlexible: 15000,
    });

    expect(result.income).toBe(50000);
    expect(result.segments.find((s) => s.key === 'committed')?.value).toBe(25000);
  });
});
