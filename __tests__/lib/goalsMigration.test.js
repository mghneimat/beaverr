import { migrateGoalsFromLegacy } from '../../lib/goals/goalsMigration';

const t = (key) => (key === 'dashboard.goalsScreen.emergencyDefaultName' ? 'Emergency' : key);

describe('goalsMigration', () => {
  test('creates Emergency goal from income target', () => {
    const income = {
      goalType: 'saveMoney',
      saveMode: 'target',
      goalAmount: 30000,
      goalDate: '31/12/2026',
      savingsBalance: 25500,
    };
    const { goals, changed } = migrateGoalsFromLegacy([], income, [], t);
    expect(changed).toBe(true);
    expect(goals).toHaveLength(1);
    expect(goals[0].type).toBe('savings');
    expect(goals[0].targetAmount).toBe(30000);
    expect(goals[0].currentAmount).toBe(25500);
  });
});
