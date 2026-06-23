import { buildReminderTableRows, buildReminderExpenseEditRoute } from '../../lib/reminderTableRows';

const t = (key) => key;

describe('reminderTableRows', () => {
  it('builds expense rows with end date and next payment columns', () => {
    const rows = buildReminderTableRows(
      {
        household: { type: 'solo' },
        subscriptions: [
          {
            name: 'netflix',
            cost: 15,
            frequency: 'monthly',
            renewalDate: '15/06/2026',
            chargeDay: 15,
          },
        ],
      },
      [],
      { type: 'solo' },
      t,
    );

    const netflix = rows.find((row) => row.id === 'rec-sub-0');
    expect(netflix).toBeTruthy();
    expect(netflix.cells.endDate).toBe('15/06/2026');
    expect(netflix.hasNextPayment).toBe(true);
    expect(netflix.cells.nextPayment).not.toBe('dashboard.expensesScreen.noDate');
  });

  it('includes transport MOT rows not present in expense panels', () => {
    const rows = buildReminderTableRows(
      {
        transport: {
          hasVehicle: true,
          vehicles: [{ motDate: '01/07/2026' }],
        },
      },
      [],
      null,
      t,
    );

    expect(rows.some((row) => row.id === 'mot-0')).toBe(true);
    expect(rows.find((row) => row.id === 'mot-0').cells.nextPayment).toBe('01/07/2026');
  });

  it('builds deep link to edit expense on Costs tab', () => {
    const route = buildReminderExpenseEditRoute({
      id: 'rec-sub-0',
      iconSectionKey: 'subscriptions',
      actionRoute: '/(app)/costs',
    });

    expect(route).toEqual({
      pathname: '/(app)/costs',
      params: {
        primary: 'recurring',
        sub: 'subscriptions',
        editRow: 'rec-sub-0',
      },
    });
  });
});
