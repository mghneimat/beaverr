import {
  computeCostReduction,
  snapshotCommittedBaseline,
} from '../../lib/costReductionProgress';

jest.mock('../../lib/storage', () => ({
  getData: jest.fn(),
  setData: jest.fn(),
}));

const { getData, setData } = require('../../lib/storage');

describe('computeCostReduction', () => {
  test('returns zero when no baseline', () => {
    const result = computeCostReduction({
      fixedCosts: 30000,
      debtPayments: 5000,
      budget: {},
    });
    expect(result.hasBaseline).toBe(false);
    expect(result.reduced).toBe(0);
    expect(result.current).toBe(35000);
  });

  test('computes reduction vs baseline', () => {
    const result = computeCostReduction({
      fixedCosts: 28000,
      debtPayments: 4864,
      budget: { committedBaseline: 40000 },
    });
    expect(result.reduced).toBe(40000 - 32864);
    expect(result.hasBaseline).toBe(true);
  });

  test('never returns negative reduction', () => {
    const result = computeCostReduction({
      fixedCosts: 45000,
      debtPayments: 0,
      budget: { committedBaseline: 40000 },
    });
    expect(result.reduced).toBe(0);
  });
});

describe('snapshotCommittedBaseline', () => {
  beforeEach(() => {
    getData.mockReset();
    setData.mockReset();
  });

  test('writes baseline when missing', async () => {
    getData.mockResolvedValue({});
    const baseline = await snapshotCommittedBaseline(34864);
    expect(baseline).toBe(34864);
    expect(setData).toHaveBeenCalledWith('beaverr_budget', { committedBaseline: 34864 });
  });

  test('preserves existing baseline', async () => {
    getData.mockResolvedValue({ committedBaseline: 40000 });
    const baseline = await snapshotCommittedBaseline(30000);
    expect(baseline).toBe(40000);
    expect(setData).not.toHaveBeenCalled();
  });
});
