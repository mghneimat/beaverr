---
name: custom-storage
description: >-
  Manages Beaverr local persistence via lib/storage.js and lib/schema.js —
  getData/setData keys, JSDoc data shapes, onboarding progress, cross-screen reads,
  clearAllData registry. MUST apply when adding or editing screens that save/load
  user data, data models, onboarding steps, settings, budget aggregation, review
  screen, or app routing — even if the user does not mention storage, schema,
  localStorage, or AsyncStorage.
---

# Beaverr Custom Storage Layer

Beaverr persists data through two paired modules:

| Module | Role |
|--------|------|
| `lib/storage.js` | Read/write API (`getData`, `setData`, …) |
| `lib/schema.js` | **Single source of truth** for all data shapes (JSDoc `@typedef`) |

**Docs:** [onboarding-flow-documentation.md §6](../../docs/onboarding-flow-documentation.md#6-data-storage)

## Mandatory — apply without being asked

Any task that **reads, writes, or changes persisted user/financial data** is also a storage + schema task. Complete both in one pass:

1. Use `getData` / `setData` from `lib/storage.js` — never platform APIs directly
2. Match payloads to the `@typedef` in `lib/schema.js` for that key
3. Update `beaverr_onboarding` when the user advances onboarding
4. Register new keys in `clearAllData()`; add new types to `lib/schema.js` first

This applies to new onboarding screens, schema changes, dashboard settings, aggregators (budget, review), and launch routing — regardless of what the user explicitly requested.

## Before writing code

1. **Read `lib/schema.js`** — find the `@typedef` for your storage key before building save/load logic.
2. **Grep existing keys** — `grep beaverr_ lib/` and `app/` before inventing a new key.
3. **One key per screen domain** — e.g. `beaverr_housing` → `Housing` type.
4. **JSON only** — `getData`/`setData` auto `JSON.parse`/`JSON.stringify`; store plain objects/arrays.
5. **Do not use `beaverr_costs`** — legacy/unused; cost data lives in per-section keys.
6. **Legacy drift** — some screens store raw arrays where schema defines wrapper objects (see [reference.md](reference.md)). **New code and refactors must follow `schema.js`.**

## API quick reference

| Export | Use when |
|--------|----------|
| `getData(key)` | Load parsed object/array; returns `null` if missing or parse error |
| `setData(key, value)` | Persist serializable value; **throws** on write failure |
| `removeData(key)` | Delete one key |
| `clearAllData()` | Wipe all registered app keys |

```jsx
import { getData, setData } from '../../lib/storage';

/**
 * @typedef {import('../../lib/schema').Household} Household
 */

useEffect(() => {
  async function loadData() {
    /** @type {Household|null} */
    const saved = await getData('beaverr_household');
    if (saved) setHouseholdType(saved.type || '');
  }
  loadData();
}, []);

/** @type {Household} */
const householdData = { type: householdType, partnerName: null, children: [] };
await setData('beaverr_household', householdData);
await setData('beaverr_onboarding', {
  completed: false,
  currentStep: 'household',
  percentComplete: 20,
});
```

### Error behaviour

| Operation | On failure |
|-----------|------------|
| `getData` | Logs error, returns `null` — treat as empty state |
| `setData` / `removeData` / `clearAllData` | Logs error, rethrows |

## Key → schema mapping

| Storage key | `@typedef` in `lib/schema.js` |
|-------------|-------------------------------|
| `beaverr_onboarding` | `OnboardingState` |
| `beaverr_household` | `Household` |
| `beaverr_location` | `Location` |
| `beaverr_occupation` | `Occupation` |
| `beaverr_income` | `Income` |
| `beaverr_housing` | `Housing` |
| `beaverr_transport` | `Transport` |
| `beaverr_health` | `HealthInsurance` |
| `beaverr_children_costs` | `ChildrenCosts` |
| `beaverr_pets` | `Pets` |
| `beaverr_subscriptions` | `Subscriptions` |
| `beaverr_other_costs` | `OtherCosts` |
| `beaverr_debts` | `Debts` |
| `beaverr_budget` | `Budget` |
| `beaverr_settings` | `Settings` |
| `beaverr_daily_log` | `DailyLog[]` |
| `beaverr_alerts` | `Alert[]` |
| `beaverr_costs` | `Cost[]` — **unused, do not write** |

Shared enums/unions: `Frequency`, `AgeGroup`, `HouseholdType`, `RolloverStrategy`, `DebtType`, `PetType`, etc. — all defined in `lib/schema.js`.

## Standard onboarding screen workflow

```
Task Progress:
- [ ] Read lib/schema.js — identify @typedef for this screen's key
- [ ] Grep for existing key or similar screen pattern
- [ ] useEffect: getData('<key>') → hydrate local state (handle legacy shape if reading old data)
- [ ] On continue/skip: build object matching schema, setData('<key>', payload)
- [ ] setData('beaverr_onboarding', { completed: false, currentStep, percentComplete })
- [ ] If screen reads another screen: getData dependency keys in same useEffect
- [ ] If new domain: add @typedef to lib/schema.js, then key to clearAllData()
- [ ] Update budget.jsx / review.jsx aggregators if totals or summary need the data
```

### `OnboardingState` (`beaverr_onboarding`)

```js
{ completed: false, currentStep: 'housing', percentComplete: 65 }
```

Review sets `completed: true`. `app/index.jsx` routes on `onboarding?.completed === true`.

## Adding a new storage key

1. **Add `@typedef` (and any enums) to `lib/schema.js` first** — this is the contract.
2. Pick `beaverr_<routeName>` matching the screen file.
3. Implement save/load in the screen using that type shape.
4. Add key to `clearAllData()` in `lib/storage.js`.
5. Wire into `budget.jsx` / `review.jsx` if applicable.
6. Add row to `docs/onboarding-flow-documentation.md` §6 (key + type name only — fields live in schema.js).

## Rules

| Rule | Detail |
|------|--------|
| Schema first | Never invent ad-hoc field names in screens — add/extend `@typedef` in `lib/schema.js` |
| Single import path | `from '../../lib/storage'` — never duplicate storage logic |
| No direct platform storage | No `localStorage.*`, no raw AsyncStorage in screens |
| Serializable values only | No functions, Dates (use ISO strings), circular refs |
| Settings merge | `const s = await getData('beaverr_settings') \|\| {}; await setData('beaverr_settings', { ...s, language })` |
| Skip paths persist | Write schema-valid empty state (`{ hasDebts: false, debts: [] }`, not ambiguous `[]`) |
| Frequency values | Use `Frequency` union: `daily`, `weekly`, `fortnightly`, `monthly`, `quarterly`, `annual` |

## Anti-patterns

- Saving without checking `lib/schema.js` for field names and wrapper shape
- Duplicating shape docs in comments instead of updating `schema.js`
- `localStorage.setItem(...)` in screen components
- Storing UI-only state (step index, validation errors, modal open)
- Using `beaverr_costs` — never written
- Adding a key without `clearAllData()` + `@typedef` entries

## Additional resources

- Key registry, legacy drift, enum reference: [reference.md](reference.md)
- Copy-paste screen patterns: [examples.md](examples.md)
