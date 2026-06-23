import {
  buildCoverageLimits,
  buildDefaultCoverage,
  buildEditableCoverageRows,
  normalizeCoverageForSave,
  sumCoverage,
  validateCoverage,
} from '../../lib/overspendCoverage';

describe('overspendCoverage', () => {
  it('builds default waterfall ending in external', () => {
    const rows = buildDefaultCoverage({
      deficit: 5000,
      cycleSavingsRemaining: 500,
      rolloverBalance: 1000,
      looseMoneyBalance: 0,
      generalSavingsBalance: 2000,
    });
    expect(rows).toEqual([
      { amount: 500, source: 'cycleSavings' },
      { amount: 1000, source: 'rollover' },
      { amount: 2000, source: 'generalSavings' },
      { amount: 1500, source: 'external', externalType: 'other' },
    ]);
  });

  it('validates coverage sum and per-source limits', () => {
    const limits = buildCoverageLimits({
      cycleSavingsRemaining: 500,
      rolloverBalance: 1000,
      generalSavingsBalance: 2000,
      looseMoneyBalance: 0,
    });
    const rows = normalizeCoverageForSave([
      { source: 'rollover', amount: 1000 },
      { source: 'external', amount: 500, externalType: 'creditCard', trackObligation: true },
    ]);
    expect(validateCoverage(rows, 1500, limits)).toEqual({ valid: true });
    expect(validateCoverage(rows, 1600, limits)).toEqual({ valid: false, code: 'sum' });
    expect(validateCoverage([
      { source: 'rollover', amount: 2000 },
    ], 2000, limits)).toEqual({ valid: false, code: 'limit' });
  });

  it('builds editable rows for all buckets with capacity plus external', () => {
    const defaults = buildDefaultCoverage({
      deficit: 3000,
      cycleSavingsRemaining: 0,
      rolloverBalance: 1000,
      looseMoneyBalance: 500,
      generalSavingsBalance: 0,
    });
    const limits = buildCoverageLimits({
      cycleSavingsRemaining: 0,
      rolloverBalance: 1000,
      looseMoneyBalance: 500,
      generalSavingsBalance: 0,
    });
    const editable = buildEditableCoverageRows(defaults, limits, 3000);
    expect(editable.map((r) => r.source)).toEqual(['rollover', 'looseMoney', 'external']);
    expect(sumCoverage(editable)).toBe(3000);
  });
});
