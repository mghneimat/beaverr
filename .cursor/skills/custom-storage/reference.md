# Storage Reference — Beaverr

## Architecture

```
Screen / lib/i18n
       ↓ getData(key) / setData(key, value)
lib/storage.js          ← platform adapter (localStorage | in-memory)
       ↓ JSON.parse / JSON.stringify
localStorage / memory

lib/schema.js           ← @typedef contracts (read before read/write)
```

| Platform | Backend | Persistence |
|----------|---------|-------------|
| Web | `localStorage` | Survives refresh |
| iOS / Android | In-memory object | Lost on app kill (Phase 1) |
| Phase 2+ | AsyncStorage → Supabase | Change adapter in `storage.js` only |

---

## Data schema (`lib/schema.js`)

**Single source of truth** for all storage structures. JSDoc `@typedef` only — no runtime exports.

When editing persistence:

1. Open `lib/schema.js` and find the type for your key
2. Build save payloads that match every required property
3. If the shape is missing or wrong, **update schema.js first**, then screens

### Key → type map

| Key | Type | Notes |
|-----|------|-------|
| `beaverr_onboarding` | `OnboardingState` | `completed`, `currentStep`, `percentComplete` |
| `beaverr_household` | `Household` | `type`, `partnerName`, `children: Child[]` |
| `beaverr_location` | `Location` | `country`, `city`, `currency` |
| `beaverr_occupation` | `Occupation` | `user`, `partner` (strings) |
| `beaverr_income` | `Income` | `user`, `partner`, `otherSources`, `savingsBalance`, `savingsTarget`, `goal` |
| `beaverr_housing` | `Housing` | `type`, rent/own/family branches, `govtTaxes` |
| `beaverr_transport` | `Transport` | `hasVehicle`, `vehicle`, public transport fields |
| `beaverr_health` | `HealthInsurance` | `members: HealthInsuranceMember[]` |
| `beaverr_children_costs` | `ChildrenCosts` | `children: ChildCostsEntry[]` |
| `beaverr_pets` | `Pets` | `hasPets`, `pets: Pet[]` |
| `beaverr_subscriptions` | `Subscriptions` | `items: Subscription[]` |
| `beaverr_other_costs` | `OtherCosts` | `items: OtherCostItem[]` |
| `beaverr_debts` | `Debts` | `hasDebts`, `debts: DebtEntry[]` |
| `beaverr_budget` | `Budget` | `monthlyFlexible`, `rolloverStrategy`, `rolloverMultiplier`, `rolloverBalance` |
| `beaverr_settings` | `Settings` | `currency`, `theme`, `language`, `alertLeadDays` |
| `beaverr_daily_log` | `DailyLog[]` | `{ date, spent }` per entry |
| `beaverr_alerts` | `Alert[]` | `{ id, type, message, urgency, status, … }` |
| `beaverr_costs` | `Cost[]` | Generic cost model — **key unused in app** |

### Shared enums (schema.js)

| Typedef | Values |
|---------|--------|
| `Frequency` | `daily`, `weekly`, `fortnightly`, `monthly`, `quarterly`, `annual` |
| `HouseholdType` | `solo`, `partner`, `single_parent` |
| `AgeGroup` | `0-2`, `3-5`, `6-15`, `16-18` |
| `HousingType` | `renting`, `own`, `family` |
| `RolloverStrategy` | `free`, `capped`, `reset` |
| `DebtType` | `creditCard`, `personalLoan`, `carLoan`, `studentLoan`, `medical`, `family`, `bnpl`, `other` |
| `PetType` | `dog`, `cat`, `bird`, `fish`, `rabbit`, `other` |
| `Theme` | `light`, `dark` |
| `FuelType` | `petrol`, `diesel`, `electric`, `hybrid`, `lpg`, `cng` |
| `OccupationType` | `employee`, `selfEmployed`, `student`, `notWorking` |

Full field lists: read `lib/schema.js` directly — do not duplicate here.

### JSDoc usage in screens

```js
/**
 * @typedef {import('../../lib/schema').Debts} Debts
 * @typedef {import('../../lib/schema').DebtEntry} DebtEntry
 */

/** @type {Debts} */
const payload = { hasDebts: true, debts: entries };
await setData('beaverr_debts', payload);
```

---

## Legacy shape drift

Some screens predate the wrapper types in `schema.js`. **New saves must use schema shapes.** When reading, tolerate legacy data until migrated.

| Key | Schema expects | Legacy on disk (some users) |
|-----|----------------|----------------------------|
| `beaverr_debts` | `{ hasDebts, debts[] }` | raw `DebtEntry[]` or `[]` |
| `beaverr_pets` | `{ hasPets, pets[] }` | raw `Pet[]` or `[]` |
| `beaverr_subscriptions` | `{ items[] }` | raw `Subscription[]` |
| `beaverr_other_costs` | `{ items[] }` | raw array |
| `beaverr_occupation` | `{ user: string, partner }` | nested `{ user: { status, otherText } }` in some builds |
| `beaverr_income` | `Income` with `user`/`partner`/`otherSources` | alternate array field names in older screens |

Load pattern for migration-friendly reads:

```js
const raw = await getData('beaverr_debts');
const debts = Array.isArray(raw) ? raw : (raw?.debts ?? []);
const hasDebts = Array.isArray(raw) ? raw.length > 0 : (raw?.hasDebts ?? false);
```

---

## `clearAllData()` registry

Wiped keys in `lib/storage.js`:

```
beaverr_onboarding, beaverr_household, beaverr_location, beaverr_occupation,
beaverr_income, beaverr_costs, beaverr_debts, beaverr_budget,
beaverr_daily_log, beaverr_alerts, beaverr_settings
```

**Missing from registry** (used in app — add when touching `clearAllData`):

```
beaverr_housing, beaverr_transport, beaverr_health, beaverr_children_costs,
beaverr_pets, beaverr_subscriptions, beaverr_other_costs
```

---

## Consumers

| File | Reads / writes |
|------|----------------|
| `app/index.jsx` | `beaverr_onboarding` → routing |
| `lib/i18n.js` | `beaverr_settings.language` |
| `app/(onboarding)/budget.jsx` | Aggregates income, debts, all cost section keys |
| `app/(onboarding)/review.jsx` | Loads all domain keys for summary |

---

## Future Supabase migration

Phase 2 changes **only** `lib/storage.js` (and possibly maps schema types to DB columns). Screen code keeps `getData`/`setData`; `lib/schema.js` remains the shape contract.
