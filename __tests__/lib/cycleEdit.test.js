import { updateActiveCycleStartDate, validateCycleStartDate } from '../../lib/cycleEdit';
import { getData, setData } from '../../lib/storage';

jest.mock('../../lib/storage', () => ({
  getData: jest.fn(),
  setData: jest.fn(),
}));

describe('cycleEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects future start dates', () => {
    expect(validateCycleStartDate('2026-06-20', '2026-06-15')).toBe('validationFuture');
    expect(validateCycleStartDate('2026-06-15', '2026-06-15')).toBeNull();
  });

  it('updates active cycle start and syncs lastClosedDay', async () => {
    const cycle = {
      id: 'c1',
      status: 'active',
      startedAt: '2026-06-10',
      budgetAmount: 5000,
    };
    getData.mockResolvedValue({ cycles: [cycle], activeCycleId: 'c1' });
    setData.mockResolvedValue(undefined);

    const updated = await updateActiveCycleStartDate({
      cycleId: 'c1',
      startedAt: '2026-06-08',
      budget: { lastClosedDay: '2026-06-07', cyclesEnabled: true },
    });

    expect(updated.startedAt).toBe('2026-06-08');
    expect(setData).toHaveBeenCalledWith('beaverr_budget_cycles', expect.objectContaining({
      activeCycleId: 'c1',
    }));
    expect(setData).toHaveBeenCalledWith('beaverr_budget', expect.objectContaining({
      lastClosedDay: '2026-06-07',
    }));
  });

  it('resets lastClosedDay to day before start when it was on or after new start', async () => {
    const cycle = {
      id: 'c1',
      status: 'active',
      startedAt: '2026-06-10',
      budgetAmount: 5000,
    };
    getData.mockResolvedValue({ cycles: [cycle], activeCycleId: 'c1' });
    setData.mockResolvedValue(undefined);

    await updateActiveCycleStartDate({
      cycleId: 'c1',
      startedAt: '2026-06-16',
      budget: { lastClosedDay: '2026-06-14', cyclesEnabled: true },
    });

    expect(setData).toHaveBeenCalledWith('beaverr_budget', expect.objectContaining({
      lastClosedDay: '2026-06-15',
    }));
  });
});
