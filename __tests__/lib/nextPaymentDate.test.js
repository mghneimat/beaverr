import { computeNextPaymentDate, formatDateDMY } from '../../lib/nextPaymentDate';

describe('nextPaymentDate', () => {
  it('computes next monthly payment from charge day', () => {
    const from = new Date(2026, 5, 8); // 8 Jun 2026
    const result = computeNextPaymentDate({
      chargeDay: 15,
      frequency: 'monthly',
      fromDate: from,
    });
    expect(result).toBe('15/06/2026');
  });

  it('rolls monthly payment to next month when day passed', () => {
    const from = new Date(2026, 5, 20);
    const result = computeNextPaymentDate({
      chargeDay: 15,
      frequency: 'monthly',
      fromDate: from,
    });
    expect(result).toBe('15/07/2026');
  });

  it('returns null without charge day', () => {
    expect(computeNextPaymentDate({ chargeDay: '', frequency: 'monthly' })).toBeNull();
  });

  it('formats DMY', () => {
    expect(formatDateDMY(new Date(2026, 2, 5))).toBe('05/03/2026');
  });
});
