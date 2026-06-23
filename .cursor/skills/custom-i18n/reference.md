# i18n Reference — Beaverr

## File map

| File | Role |
|------|------|
| `lib/i18n.js` | Provider, hook, `translate()`, standalone `t()` |
| `lib/locales/en.json` | English (source of truth for structure) |
| `lib/locales/cs.json` | Czech |
| `__tests__/lib/i18n.test.js` | Unit tests for `translate()` |
| `app/_layout.jsx` | Wraps app in `<I18nProvider>` |
| `components/HamburgerMenu.jsx` | `setLocale()` language picker |

## translate() internals

```js
translate(locale, key, params)
// 1. Resolves key via dot notation: 'onboarding.welcome.title'
// 2. Missing key → console.warn + returns key string
// 3. Interpolates {{word}} placeholders from params object
```

Supported locales: `en`, `cs` (defined in `translations` object in `lib/i18n.js`).

Locale loads from `getData('beaverr_settings')?.language` on mount; `setLocale` writes back via `setData`.

## Full namespace tree

```
app
common
  ├── datePicker.{day,month,year}
  └── months.{january…december}
onboarding
  ├── welcome, consent
  ├── household.{type,partnerName,children,numChildren,childDetails}
  ├── s2, location, occupation
  ├── s3, income.{q5,q5a,q5b,q5c,q5d}
  ├── s4, housing.{q6,q6a…q6h,q6g}
  ├── s5, transport.{q7,q7Count,q7a…q7e,q7bicycle}
  ├── s6, health.{title,helper,…,q8}
  ├── s7, childrenCosts.{q9}
  ├── s8, pets.{q10,q10a}
  ├── s9, subscriptions.{q11}
  ├── s10, otherCosts.{q12}
  ├── s11, debts.{q13,q13a}
  ├── s12, budget.{q14,q14a}
  ├── s13, review.{q15}
  └── progress
dashboard
settings
```

## Onboarding screen → namespace map

| Route file | Primary namespace |
|------------|-------------------|
| `welcome.jsx` | `onboarding.welcome` |
| `consent.jsx` | `onboarding.consent` |
| `household.jsx` | `onboarding.household` |
| `location.jsx` | `onboarding.location` |
| `occupation.jsx` | `onboarding.occupation` |
| `income.jsx` | `onboarding.income` |
| `housing.jsx` | `onboarding.housing` |
| `transport.jsx` | `onboarding.transport` |
| `health.jsx` | `onboarding.health` |
| `children-costs.jsx` | `onboarding.childrenCosts` |
| `pets.jsx` | `onboarding.pets` |
| `subscriptions.jsx` | `onboarding.subscriptions` |
| `other-costs.jsx` | `onboarding.otherCosts` |
| `debts.jsx` | `onboarding.debts` |
| `budget.jsx` | `onboarding.budget` |
| `review.jsx` | `onboarding.review` |
| `splash-*.jsx` | `onboarding.s<N>` |

## Common reusable keys

Prefer these over screen-specific duplicates:

| Key | EN value |
|-----|----------|
| `common.continue` | Continue |
| `common.back` | Back |
| `common.skip` | Skip for now |
| `common.yes` / `common.no` | Yes / No |
| `common.save` / `common.cancel` | Save / Cancel |
| `common.monthly` / `common.annual` | Monthly / Annual |
| `common.frequency` | Frequency |
| `common.loading` | Loading... |
| `common.error` | Something went wrong |

## Czech translation notes

- Maintain formal address ("vaše", "vyberte", "zadejte") — match tone of existing `cs.json`.
- Keep currency amounts and symbols as-is (`Kč`, `1 500 Kč`).
- Czech-specific legal/tax labels (waste tax, TV licence, dog tax) already have established CS copy in housing/pets sections — copy that style.
- Month names: `common.months.*` (nominative case for picker labels).

## Testing

```bash
npm test -- __tests__/lib/i18n.test.js
```

When adding interpolation keys, add a test case mirroring existing `onboarding.progress` pattern.

## Validating locale parity

Quick check — both files should parse and share the same key paths:

```bash
node -e "
const en = require('./lib/locales/en.json');
const cs = require('./lib/locales/cs.json');
function keys(o,p=''){return Object.entries(o).flatMap(([k,v])=>typeof v==='object'?keys(v,p+k+'.'):[p+k]);}
const ek=new Set(keys(en)), ck=new Set(keys(cs));
const missingInCs=[...ek].filter(k=>!ck.has(k));
const missingInEn=[...ck].filter(k=>!ek.has(k));
console.log('Missing in cs:', missingInCs.length, missingInCs.slice(0,5));
console.log('Missing in en:', missingInEn.length, missingInEn.slice(0,5));
"
```
