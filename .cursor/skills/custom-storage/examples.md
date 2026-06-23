# Storage Examples — Beaverr

All payloads must match `@typedef` in `lib/schema.js`. See [reference.md](reference.md) for key → type map and legacy drift.

## Typed load + save (onboarding screen)

```jsx
// app/(onboarding)/household.jsx
import { getData, setData } from '../../lib/storage';

/**
 * @typedef {import('../../lib/schema').Household} Household
 * @typedef {import('../../lib/schema').OnboardingState} OnboardingState
 */

useEffect(() => {
  async function loadData() {
    /** @type {Household|null} */
    const saved = await getData('beaverr_household');
    if (saved) {
      setHouseholdType(saved.type || '');
      setPartnerName(saved.partnerName || '');
      if (saved.children?.length) {
        setHasChildren(true);
        setChildren(saved.children);
      }
    }
  }
  loadData();
}, []);

const saveAndContinue = async () => {
  /** @type {Household} */
  const householdData = {
    type: householdType,
    partnerName: householdType === 'partner' ? partnerName : null,
    children: hasChildren ? children : [],
  };

  /** @type {OnboardingState} */
  const progress = {
    completed: false,
    currentStep: 'household',
    percentComplete: 20,
  };

  await setData('beaverr_household', householdData);
  await setData('beaverr_onboarding', progress);
  router.replace('/(onboarding)/splash-location');
};
```

## Schema-first: adding a new domain

**1. `lib/schema.js`**

```js
/**
 * @typedef {Object} MyFeature
 * @property {boolean} enabled
 * @property {string[]} tags
 */
```

**2. Screen**

```jsx
/** @type {import('../../lib/schema').MyFeature} */
const payload = { enabled: true, tags: [] };
await setData('beaverr_my_feature', payload);
```

**3. `lib/storage.js` — `clearAllData` keys array**

```js
'beaverr_my_feature',
```

## Skip path — schema-valid empty state

```jsx
/**
 * @typedef {import('../../lib/schema').Debts} Debts
 */

/** @type {Debts} */
const emptyDebts = { hasDebts: false, debts: [] };
await setData('beaverr_debts', emptyDebts);
```

Prefer wrapper objects over bare `[]` when schema defines a wrapper.

## Legacy-tolerant read (debts)

```jsx
/**
 * @typedef {import('../../lib/schema').Debts} Debts
 * @typedef {import('../../lib/schema').DebtEntry} DebtEntry
 */

const raw = await getData('beaverr_debts');
/** @type {DebtEntry[]} */
const debts = Array.isArray(raw) ? raw : (raw?.debts ?? []);
setDebts(debts);
```

## Cross-screen dependency read

```jsx
/** @type {import('../../lib/schema').Location|null} */
const loc = await getData('beaverr_location');
if (loc?.currency) setCurrency(loc.currency);

/** @type {import('../../lib/schema').Income|null} */
const saved = await getData('beaverr_income');
```

## Settings merge

```jsx
/** @typedef {import('../lib/schema').Settings} Settings */

const settings = (await getData('beaverr_settings')) || {};
/** @type {Settings} */
await setData('beaverr_settings', { ...settings, language: newLocale });
```

## Budget aggregation

Load each section by schema type; normalize legacy arrays before summing:

```jsx
const housing = (await getData('beaverr_housing')) || {};
const transport = (await getData('beaverr_transport')) || {};
const health = (await getData('beaverr_health')) || {};
const childrenCosts = (await getData('beaverr_children_costs')) || { children: [] };

const rawPets = await getData('beaverr_pets');
const pets = Array.isArray(rawPets) ? rawPets : (rawPets?.pets ?? []);

const rawSubs = await getData('beaverr_subscriptions');
const subs = Array.isArray(rawSubs) ? rawSubs : (rawSubs?.items ?? []);
// → monthly totals via lib/finance.js toMonthly(amount, frequency)
```

## Complete onboarding

```jsx
/** @type {import('../../lib/schema').OnboardingState} */
await setData('beaverr_onboarding', {
  completed: true,
  currentStep: 'review',
  percentComplete: 100,
});
```

## Testing

Mock at the storage boundary:

```js
jest.mock('../lib/storage', () => ({
  getData: jest.fn(),
  setData: jest.fn(),
}));
```

Assert saved payloads against shapes documented in `lib/schema.js`.
