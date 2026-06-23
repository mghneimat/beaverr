# Finance Reference — Beaverr

## Module contract (`lib/finance.js`)

Header comment: *"All functions preserve original amount + frequency"* — storage and forms keep raw values; conversion happens at calculation/display time via `toMonthly`.

---

## `toMonthly(amount, frequency)`

**Input:** `number` (coerced), `Frequency` string (case-insensitive)  
**Output:** `number` — monthly equivalent, `0` if invalid amount

### Multipliers (do not duplicate elsewhere)

```js
daily:       30.44   // avg days/month
weekly:      4.33    // avg weeks/month
fortnightly: 2.17    // avg fortnights/month
monthly:     1
quarterly:   1/3
annual:      1/12
```

### Edge cases

| Input | Result |
|-------|--------|
| `0`, negative, NaN | `0` |
| Unknown frequency | Warns, returns amount unchanged (treated as monthly) |
| `'MONTHLY'` | Works (lowercased) |

---

## `formatCurrency(amount, currency = 'Kč')`

**Output:** `"12 500 Kč"` style — space thousands separator, symbol suffix

| Input | Output |
|-------|--------|
| `12500` | `"12 500 Kč"` |
| `123.67` | `"124 Kč"` (rounded) |
| `null` / `undefined` | `"—"` (em dash) |
| `1000, '€'` | `"1 000 €"` |

**Note:** Second arg is display suffix only — no ISO code mapping. Screens variously pass `'CZK'`, `'Kč'`, or `''` (number only in budget table).

---

## `totalMonthlyCosts(costs)`

**Input:** `Array<{ amount: number, frequency: string }>`  
**Output:** Sum of `toMonthly(cost.amount, cost.frequency)`; `0` if empty/non-array

Each item must already be normalized — function does not know about housing/transport schema shapes.

---

## `availableBudget(monthlyIncome, fixedCosts, debtPayments)`

**Formula:** `monthlyIncome - fixedCosts - debtPayments`

- No clamping — negative means overspent vs income
- All three args should already be **monthly** totals
- Debt leg: sum of `minPayment` fields, not balance × APR

---

## `debtPayoff(balance, monthlyPayment, apr)`

**Input:** balance, monthly payment, APR as percent (e.g. `19.9` for 19.9%)

**Returns:**

```js
{ months: number, totalInterest: number, payoffDate: Date | null }
```

| Case | `months` | `totalInterest` | `payoffDate` |
|------|----------|-----------------|--------------|
| Zero balance | `0` | `0` | `new Date()` |
| Zero/negative payment | `Infinity` | `Infinity` | `null` |
| Payment ≤ interest charge | `Infinity` | `Infinity` | `null` |
| APR 0 (interest-free) | `ceil(balance / payment)` | `0` | Date + months |
| With APR | Iterative amortization | Rounded total interest | Date + months |

Safety cap: 600 months (50 years) loop limit.

**Not yet used in onboarding screens** — ready for debts summary / dashboard.

---

## `dailyAllowance(monthlyBudget, daysInMonth = 30)`

**Formula:** `monthlyBudget / daysInMonth`  
Returns `0` for zero/negative budget.

**Not yet used in screens** — intended for dashboard daily spend widget.

---

## Relationship to `lib/schema.js`

- Every `frequency` field should use `Frequency` union values
- Cost-like types (`IncomeSource`, `Cost`, `HousingCostItem`, etc.) store `{ amount, frequency }` — map to finance inputs without reshaping frequency names

---

## Primary consumers

| File | Functions used |
|------|----------------|
| `app/(onboarding)/budget.jsx` | `toMonthly`, `formatCurrency`, `totalMonthlyCosts`, `availableBudget` |
| `app/(onboarding)/review.jsx` | `toMonthly`, `formatCurrency` |
| `app/(onboarding)/income.jsx` | `toMonthly`, `formatCurrency` (live monthly preview) |
| `app/(onboarding)/subscriptions.jsx` | `toMonthly`, `formatCurrency` (streaming total flag) |
| `app/(onboarding)/transport.jsx` | `formatCurrency` |

---

## Testing

```bash
npm test -- __tests__/lib/finance.test.js
```

Required when changing multipliers, edge-case behaviour, or adding exports. Use `toBeCloseTo` for multiplier-derived values.

---

## When to extend the library

Add a new export when:

- Same calculation appears in 2+ screens
- Logic involves frequency conversion, amortization, or budget rules
- Unit tests can lock expected behaviour

Keep in the screen when:

- One-off mapping from schema → `{ amount, frequency }[]` (document in examples.md)
- Pure UI layout of already-computed numbers
