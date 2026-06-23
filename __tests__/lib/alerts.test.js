import { parseAlertDate, daysUntil, scanAlerts, scanReminderAlerts } from '../../lib/alerts';
import { buildReminderRows } from '../../lib/reminderSchedule';

const t = (key, params = {}) => {
  let s = key;
  Object.entries(params).forEach(([k, v]) => {
    s = s.replace(`{{${k}}}`, String(v));
  });
  return s;
};

describe('parseAlertDate', () => {
  test('parses DD/MM/YYYY', () => {
    const d = parseAlertDate('15/06/2026');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(15);
  });
});

describe('scanAlerts', () => {
  test('flags high APR debt', () => {
    const alerts = scanAlerts({
      subs: [],
      health: {},
      debts: [{ type: 'creditCard', apr: '24', balance: '10000', minPayment: '300' }],
      transport: {},
    }, t);
    expect(alerts.some((a) => a.type === 'debt_high_apr')).toBe(true);
  });
});

describe('scanReminderAlerts', () => {
  test('flags subscription renewal within lead window', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    const day = String(soon.getDate()).padStart(2, '0');
    const month = String(soon.getMonth() + 1).padStart(2, '0');
    const rows = buildReminderRows({
      subs: [{ name: 'netflix', cost: '10', frequency: 'monthly', renewalDate: `${day}/${month}/${soon.getFullYear()}` }],
      housing: {},
      transport: {},
      health: {},
      childrenCosts: {},
      pets: [],
      otherCosts: [],
    }, [], null, t);
    const alerts = scanReminderAlerts(rows, {}, 7, t);
    expect(alerts.some((a) => a.type === 'expense_date_reminder')).toBe(true);
  });
});

describe('daysUntil', () => {
  test('returns positive days for future date', () => {
    const from = new Date(2026, 5, 1);
    const target = new Date(2026, 5, 8);
    expect(daysUntil(target, from)).toBe(7);
  });
});
