import { buildFinancialSnapshot } from '../../lib/advice/buildFinancialSnapshot';
import { evaluateAdviceRules } from '../../lib/advice/evaluateAdviceRules';
import tightFixture from '../../lib/advice/__evals__/fixtures/tight_single_income_cs.json';
import overcommittedFixture from '../../lib/advice/__evals__/fixtures/overcommitted_high_apr_en.json';

describe('buildFinancialSnapshot', () => {
  const baseFinancials = {
    totalIncome: 52000,
    fixedCosts: 41000,
    debtPayments: 0,
    monthlyFlexible: 9000,
    effectiveMonthlyFlexible: 9000,
    currencyCode: 'CZK',
    income: { amount: 52000, frequency: 'monthly' },
    sections: {
      household: { type: 'partner', children: [{ ageGroup: '3-5' }] },
    },
    debts: [],
    byCategory: [],
    financialRisks: [],
  };

  it('matches eval fixture ledger shape for tight household', () => {
    const snapshot = buildFinancialSnapshot({ financials: baseFinancials, locale: 'cs' });
    expect(snapshot.v).toBe(1);
    expect(snapshot.locale).toBe('cs');
    expect(snapshot.household).toEqual({ adults: 2, children: 1, has_partner: true });
    expect(snapshot.ledger.income_m).toBe(52000);
    expect(snapshot.ledger.fixed_m).toBe(41000);
    expect(snapshot.ledger.flex_m).toBe(9000);
    expect(snapshot.ledger.surplus_m).toBe(2000);
    expect(snapshot.ledger.fix_ratio).toBe(0.79);
  });
});

describe('evaluateAdviceRules', () => {
  it('fires tight + single income rules when fix_ratio exceeds threshold', () => {
    const snapshot = {
      ...tightFixture.snapshot,
      ledger: {
        ...tightFixture.snapshot.ledger,
        fix_ratio: 0.81,
      },
    };
    const rules = evaluateAdviceRules(snapshot, {});
    const ids = rules.map((r) => r.id);
    expect(ids).toContain('fixed_cost_ratio_tight');
    expect(ids).toContain('single_income_household');
  });

  it('fires overcommitted, negative surplus, and high apr', () => {
    const rules = evaluateAdviceRules(overcommittedFixture.snapshot, {
      debts: [
        {
          type: 'credit_card',
          balance: 45000,
          apr: 24,
          minPayment: 4200,
        },
      ],
    });
    const ids = rules.map((r) => r.id);
    expect(ids).toContain('overcommitted');
    expect(ids).toContain('negative_surplus');
    expect(ids).toContain('high_apr');
    const highApr = rules.find((r) => r.id === 'high_apr');
    expect(highApr?.detail?.debts?.[0]?.ref).toBe('debt_1');
  });

  it('returns empty when household is healthy', () => {
    const rules = evaluateAdviceRules(
      {
        ledger: {
          income_m: 100000,
          fix_ratio: 0.5,
          surplus_m: 10000,
          debt_m: 5000,
          income_sources: [{ role: 'user', m: 60000 }, { role: 'partner', m: 40000 }],
        },
      },
      { debts: [], byCategory: [], sections: { health: { items: [{ amount: 2000 }] } } },
    );
    expect(rules).toHaveLength(0);
  });
});
