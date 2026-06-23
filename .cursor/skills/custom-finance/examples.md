# Finance Examples — Beaverr

Import from `lib/finance.js` only. Pair with `getData` from `lib/storage.js` for persisted values.

## Live monthly preview (income screen)

```jsx
import { toMonthly, formatCurrency } from '../../lib/finance';

function monthlyPreview(amount, freq, currency) {
  const num = parseFloat(amount);
  if (!num) return null;
  const monthly = toMonthly(num, freq);
  return formatCurrency(monthly, currency);
}

// In JSX:
{monthlyPreview(amount, frequency, currency)}
```

## Income rollup (budget / review)

Storage shapes vary by screen age — normalize then convert:

```jsx
import { toMonthly } from '../../lib/finance';

// Schema-aligned (review.jsx)
const userMonthly = toMonthly(inc?.user?.amount || 0, inc?.user?.frequency || 'monthly');
const partnerMonthly = toMonthly(inc?.partner?.amount || 0, inc?.partner?.frequency || 'monthly');
const otherMonthly = (inc?.otherSources || []).reduce(
  (sum, s) => sum + toMonthly(s.amount || 0, s.frequency || 'monthly'),
  0,
);
const totalIncome = userMonthly + partnerMonthly + otherMonthly;

// Legacy field names (budget.jsx loader)
const userMonthly = toMonthly(inc?.amount || 0, inc?.frequency || 'monthly');
const partnerMonthly = toMonthly(inc?.partnerAmount || 0, inc?.partnerFrequency || 'monthly');
const otherMonthly = (inc?.otherIncomeRows || []).reduce(
  (sum, s) => sum + toMonthly(s.amount || 0, s.frequency || 'monthly'),
  0,
);
```

## Flatten storage → cost array → monthly total

Pattern from `budget.jsx`: map each section to `{ amount, frequency, label }`, push to `allCosts`, then:

```jsx
import { totalMonthlyCosts, availableBudget } from '../../lib/finance';

// Example: subscription row from storage
subs.forEach(sub => {
  if (sub.cost) {
    allCosts.push({
      label: sub.service,
      amount: parseFloat(sub.cost),
      frequency: sub.frequency || 'monthly',
    });
  }
});

const fixedCosts = totalMonthlyCosts(allCosts);

const debtPayments = debts.reduce(
  (sum, d) => sum + parseFloat(d.minPayment || 0),
  0,
);

const flexible = availableBudget(totalIncome, fixedCosts, debtPayments);
setMonthlyFlexible(String(Math.round(flexible)));
```

## Review row display

```jsx
import { toMonthly, formatCurrency } from '../../lib/finance';

<DataRow
  label={t('onboarding.review.review.labels.yourIncome')}
  value={formatCurrency(userMonthly, 'CZK') + '/mo'}
/>

<DataRow
  label={t('onboarding.review.review.labels.minPayment')}
  value={formatCurrency(d.minPayment, 'CZK') + '/mo'}
/>
```

Frequency suffix (`/mo`, `/annual`) belongs in UI copy — not inside `formatCurrency`.

## Budget table — amount without symbol

```jsx
// budget.jsx uses empty currency for compact table cells
{formatCurrency(row.amount, '')}
{row.amount >= 0 ? formatCurrency(row.amount, '') : `-${formatCurrency(Math.abs(row.amount), '')}`}
```

## Subscriptions flag text

```jsx
const streamingMonthlyTotal = subscriptions
  .filter(s => s.category === 'streaming')
  .reduce((sum, s) => sum + toMonthly(parseFloat(s.cost) || 0, s.frequency), 0);

t('onboarding.subscriptions.serviceSelection.streamingFlag', {
  count: streamingCount,
  amount: formatCurrency(streamingMonthlyTotal, 'CZK'),
});
```

## Debt payoff (future UI)

```jsx
import { debtPayoff, formatCurrency } from '../../lib/finance';

const { months, totalInterest, payoffDate } = debtPayoff(
  balance,
  minPayment,
  apr,
);

if (months === Infinity) {
  // Show "payment too low" message via t()
} else {
  // formatCurrency(totalInterest, currency), payoffDate.toISOString().slice(0, 7)
}
```

## Daily allowance (future dashboard)

```jsx
import { dailyAllowance, formatCurrency } from '../../lib/finance';

const daysInMonth = new Date(year, month + 1, 0).getDate();
const daily = dailyAllowance(monthlyFlexible, daysInMonth);
formatCurrency(daily, currency);
```

## Adding a new helper to lib/finance.js

```js
// lib/finance.js
/**
 * Sum minimum debt payments (already monthly).
 * @param {Array<{ minPayment: number }>} debts
 * @returns {number}
 */
export function totalDebtPayments(debts) {
  if (!Array.isArray(debts)) return 0;
  return debts.reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);
}
```

Add tests, then replace inline `.reduce` in budget.jsx when touching that file.

## Test snippet for new multiplier behaviour

```js
// __tests__/lib/finance.test.js
test('converts biweekly alias if added', () => {
  expect(toMonthly(100, 'fortnightly')).toBeCloseTo(217, 0);
});
```
