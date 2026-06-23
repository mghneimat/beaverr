---
name: custom-finance
description: >-
  Manages Beaverr financial math via lib/finance.js — toMonthly frequency conversion,
  formatCurrency display, totalMonthlyCosts, availableBudget, debtPayoff, dailyAllowance.
  MUST apply when adding or editing income/cost/budget/debt calculations, monthly totals,
  currency formatting, payoff timelines, or daily spend — even if the user does not mention
  finance.js, toMonthly, or formatCurrency.
---

# Beaverr Custom Financial Calculation Library

All monetary math and currency display goes through **`lib/finance.js`** — not inline multipliers, not `Intl.NumberFormat` in screens, not duplicated helpers.

**Core file:** `lib/finance.js`  
**Frequency union:** `Frequency` in `lib/schema.js` (`daily` | `weekly` | `fortnightly` | `monthly` | `quarterly` | `annual`)  
**Tests:** `__tests__/lib/finance.test.js`

**Docs:** [onboarding-flow-documentation.md §7](../../docs/onboarding-flow-documentation.md#7-financial-utilities)

## Mandatory — apply without being asked

Any task that **converts frequencies, sums costs, formats money, or computes budget/debt figures** is also a finance task:

1. Import from `lib/finance.js` — never reimplement conversion or formatting
2. Normalize storage payloads to `{ amount, frequency }` before `totalMonthlyCosts`
3. Run `npm test -- __tests__/lib/finance.test.js` after changing `lib/finance.js`
4. New reusable math → add to `lib/finance.js` (SRP), not scattered in screens

Pairs with [custom-storage](../custom-storage/SKILL.md) (load data) and [custom-i18n](../custom-i18n/SKILL.md) (labels only — amounts come from finance helpers).

## API quick reference

| Export | Purpose |
|--------|---------|
| `toMonthly(amount, frequency)` | Convert any frequency → monthly equivalent |
| `roundMoney(amount)` | Round to 2 decimal places at parse/save boundaries |
| `formatCurrency(amount, currency?)` | Display: always 2dp, comma decimal, space thousands (e.g. `12 500,00 Kč`) |
| `sanitizeAmountInput(text)` | Live input filter — digits + optional `,`/`.`, max 2 fractional digits |
| `formatAmountInput(amount)` | Input blur display without symbol (e.g. `123,45`) |
| `totalMonthlyCosts(costs)` | Sum `{ amount, frequency }[]` via `toMonthly` |
| `availableBudget(income, fixedCosts, debtPayments)` | `income − fixedCosts − debtPayments` (may be negative) |
| `debtPayoff(balance, monthlyPayment, apr)` | Amortization timeline; `Infinity` if unpayable |
| `divideMoney(numerator, divisor)` | Full-precision division — use in pace/jar/split math; never round mid-chain |
| `dailyAllowance(monthlyBudget, daysInMonth?)` | `divideMoney(monthlyBudget, daysInMonth)` (default 30 days) |

```jsx
import { toMonthly, formatCurrency, totalMonthlyCosts, availableBudget } from '../../lib/finance';

const items = [{ amount: 1200, frequency: 'annual' }, { amount: 500, frequency: 'monthly' }];
const fixedCosts = totalMonthlyCosts(items);
const income = toMonthly(userAmount, userFrequency);
const flexible = availableBudget(income, fixedCosts, debtMinPayments);

<Text>{formatCurrency(flexible, 'CZK')}</Text>
```

## `toMonthly` — the only frequency converter

| Frequency | Multiplier |
|-----------|------------|
| `daily` | × 30.44 |
| `weekly` | × 4.33 |
| `fortnightly` | × 2.17 |
| `monthly` | × 1 |
| `quarterly` | × 1/3 |
| `annual` | × 1/12 |

Behaviour:

- Coerces with `Number(amount)`; returns `0` for zero, negative, or NaN
- Case-insensitive frequency string
- Unknown frequency → `console.warn`, treats as monthly (returns raw amount)

**Never** hardcode these multipliers in screens. If a new frequency is needed, extend `lib/finance.js` + tests + `Frequency` in `schema.js`.

## Standard workflows

### Display a stored amount

```
- [ ] Parse amount from storage (parseFloat if string)
- [ ] toMonthly(amount, frequency) when showing monthly equivalent
- [ ] formatCurrency(value, currencyFromLocation) for UI
- [ ] Append '/mo' or frequency suffix in t() string, not inside formatCurrency
```

### Budget / review aggregation

```
- [ ] Load section keys via getData (custom-storage skill)
- [ ] Map each section → flat { amount, frequency }[] (screen-specific normalizer)
- [ ] totalMonthlyCosts(allItems) for fixed costs
- [ ] Sum debt minPayment fields separately (already monthly)
- [ ] availableBudget(totalIncome, fixedCosts, debtPayments)
```

See [examples.md](examples.md) for budget.jsx-style normalizers.

### Add new financial logic

1. Check if `toMonthly` / `totalMonthlyCosts` / composable helpers already cover it
2. If not, add function to `lib/finance.js` with JSDoc
3. Add tests in `__tests__/lib/finance.test.js`
4. Import in screens — do not copy the implementation

## Rules

| Rule | Detail |
|------|--------|
| Single home for math | All frequency conversion lives in `toMonthly` |
| Preserve original + frequency | Storage keeps raw amount + frequency; convert at read/display/calc time |
| Debt payments | `minPayment` is treated as monthly — do not run through `toMonthly` unless schema says otherwise |
| Negative budget OK | `availableBudget` can return negative — UI shows red/warning, do not clamp to 0 silently |
| `debtPayoff` edge cases | Handle `months === Infinity` and `payoffDate === null` in UI |
| Currency symbol | `formatCurrency(12500, 'CZK')` → `"12 500 CZK"` — symbol is opaque string; app often uses `'CZK'` or `'Kč'` |
| Empty amounts | `formatCurrency(null)` → `"—"`; use for missing data rows |
| Rounding policy (A) | **No** `Math.round` inside calculation chains. Use `divideMoney` for splits; `roundMoney` only at input parse, storage writes, jar `dayEndHistory`, and `formatCurrency` display |

## Anti-patterns

- `amount * 12` or `amount / 3` inline for annual/quarterly
- `new Intl.NumberFormat(...)` in JSX for Beaverr money display
- Summing raw amounts with mixed frequencies without `toMonthly`
- Duplicating income rollup in multiple files — extract normalizer or reuse budget pattern
- Adding finance logic to `lib/storage.js` or `lib/schema.js`
- Changing multipliers in one screen but not `lib/finance.js`

## Additional resources

- Multipliers, edge cases, `debtPayoff` return shape: [reference.md](reference.md)
- Screen patterns (income preview, budget table, review rows): [examples.md](examples.md)
