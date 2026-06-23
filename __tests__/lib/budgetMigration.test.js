import { migrateBudgetPolicy } from '../../lib/budgetMigration';

describe('migrateBudgetPolicy', () => {
  it('maps activity destination to spendingBoost', () => {
    const { budget, changed } = migrateBudgetPolicy({
      dailyJarDestination: 'activity',
    });
    expect(changed).toBe(true);
    expect(budget.dailyJarDestination).toBe('spendingBoost');
  });

  it('merges activity jar balance into piggy bank', () => {
    const { budget, changed } = migrateBudgetPolicy({
      activityJarBalance: 12000,
      looseMoneyBalance: 500,
      dailyJarDestination: 'spendingBoost',
    });
    expect(changed).toBe(true);
    expect(budget.looseMoneyBalance).toBe(12500);
    expect(budget.activityJarBalance).toBe(0);
  });

  it('migrates capped rollover to free', () => {
    const { budget, changed } = migrateBudgetPolicy({
      rolloverStrategy: 'capped',
      rolloverMultiplier: 2,
    });
    expect(changed).toBe(true);
    expect(budget.rolloverStrategy).toBe('free');
  });
});
