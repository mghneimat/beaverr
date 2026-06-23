/**
 * @jest-environment node
 */
import { parseAlertDate, daysUntil } from '../../lib/alertDates';

describe('alertDates', () => {
  describe('parseAlertDate', () => {
    test('parses DD/MM/YYYY', () => {
      const d = parseAlertDate('15/06/2026');
      expect(d?.getFullYear()).toBe(2026);
      expect(d?.getMonth()).toBe(5);
      expect(d?.getDate()).toBe(15);
    });
  });

  describe('daysUntil', () => {
    test('counts calendar days', () => {
      const from = new Date(2026, 5, 1);
      const target = new Date(2026, 5, 8);
      expect(daysUntil(target, from)).toBe(7);
    });
  });
});
