---
name: custom-i18n
description: >-
  Automatically manages PocketOS i18n for every UI change — adds EN+CS keys,
  wires useI18n/t(), enforces locale parity. MUST apply when creating or editing
  screens, components, forms, buttons, labels, placeholders, validation, alerts,
  or any user-facing copy — even if the user does not mention i18n, translations,
  localization, en.json, or cs.json.
---

# PocketOS Custom i18n

PocketOS uses a **lightweight in-house i18n system** — not i18next, not expo-localization. All user-facing copy lives in JSON locale files and is rendered via `useI18n()`.

**Core files:** `lib/i18n.js` · `lib/locales/en.json` · `lib/locales/cs.json`

**Docs:** [onboarding-flow-documentation.md §5](../../docs/onboarding-flow-documentation.md#5-i18n-system)

## Mandatory — apply without being asked

Any task that introduces or changes **visible UI text** is also an i18n task. Complete both in one pass:

1. Add/reuse keys in `en.json` **and** `cs.json`
2. Replace hardcoded strings with `t('...')` in the component
3. Do **not** defer translations, leave English-only keys, or ask whether to translate

This applies to new screens, new buttons, tweaked copy, new form fields, validation messages, and placeholder changes — regardless of what the user explicitly requested.

## Before writing code

1. **Never hardcode user-facing strings** in JSX/JS — always use `t('namespace.key')`.
2. **Check existing keys first** — grep `lib/locales/en.json` before adding duplicates. Reuse `common.*` for shared labels (Continue, Back, Yes, No, frequency labels, etc.).
3. **Both locales required** — every new key must appear in `en.json` **and** `cs.json` with the same nested path.
4. **Run tests** after changes: `npm test -- __tests__/lib/i18n.test.js`

## API quick reference

| Export | Use when |
|--------|----------|
| `useI18n()` | Inside React components — returns `{ t, locale, setLocale }` |
| `translate(locale, key, params)` | Tests or non-hook logic with explicit locale |
| `t(key, params)` | Outside React — **always defaults to `'en'`**; avoid in UI |
| `I18nProvider` | Root layout only (`app/_layout.jsx`) |

```jsx
// components or screens
import { useI18n } from '../lib/i18n';

export default function MyScreen() {
  const { t } = useI18n();
  return <Text>{t('onboarding.welcome.title')}</Text>;
}
```

### Interpolation

Use `{{paramName}}` in JSON; pass values as the second argument:

```jsx
t('onboarding.progress', { percent: 50 })        // "50% complete"
t('onboarding.household.childDetails.title', { n: 2 })
t('onboarding.income.q5a.title', { name: partnerName })
```

Missing params leave the placeholder literal (`{{percent}}`).

### Language switching

Locale persists to `beaverr_settings.language` via `setLocale('en' | 'cs')`. Language picker lives in `components/HamburgerMenu.jsx`.

## Key naming conventions

| Namespace | Purpose | Example |
|-----------|---------|---------|
| `app.*` | Branding, global copy | `app.tagline` |
| `common.*` | Reusable UI labels | `common.continue`, `common.monthly` |
| `onboarding.<screen>.*` | Onboarding flow copy | `onboarding.housing.q6.title` |
| `onboarding.s<N>.*` | Section splash screens | `onboarding.s4.heading` |
| `dashboard.*` | Main app tabs | `dashboard.title` |
| `settings.*` | Settings screen | `settings.language` |

**Per-screen shape** (follow existing screens):

```
title          — primary heading
helper         — subtitle / explanation
validation     — inline error message
placeholder    — input placeholder
yes / no       — binary choices
<field>Label   — form field labels
```

Question screens use `q<N>` keys (`q6`, `q6a`, `q7b`). Splash sections use `s<N>` (`s4`, `s5`).

**No pluralization engine** — use explicit keys or interpolation (`{{count}}`, `{{n}}`, `{{total}}`).

## Workflows

### Add a new string

```
Task Progress:
- [ ] Grep en.json for an existing key to reuse
- [ ] Add key to lib/locales/en.json (correct namespace)
- [ ] Add same key path to lib/locales/cs.json (Czech translation)
- [ ] Replace hardcoded text with t('...') in component
- [ ] Pass interpolation params if string contains {{...}}
- [ ] Run i18n tests
```

### Add a new screen's copy block

1. Pick namespace: `onboarding.<screenName>` (camelCase, matches route file name).
2. Mirror structure of a similar screen (e.g. `housing`, `transport`).
3. Add section splash keys under `onboarding.s<N>` if the screen has a splash predecessor.
4. Document keys in `docs/onboarding-flow-documentation.md` if adding a full onboarding step.

### Add a third locale

1. Create `lib/locales/<code>.json` (copy `en.json` structure).
2. Import and register in `lib/i18n.js` `translations` object.
3. Add entry to `languages` array in `components/HamburgerMenu.jsx`.
4. Extend `translate()` tests for the new locale.

## Rules

| Rule | Detail |
|------|--------|
| Locale parity | `en.json` and `cs.json` must have identical key trees |
| Leaf values only | JSON leaves are strings; nesting is for organization |
| No ICU / no plurals | Use `{{count}}` in string or separate keys |
| Component locale | Use `useI18n()` — not standalone `t()` — so UI respects user language |
| Validation copy | Store in `validation` key, render on error state |
| Brand names | Keep untranslated (Netflix, PocketOS) unless Czech has an established form |
| Czech tone | Formal "vy" form, consistent with existing `cs.json` |

## Anti-patterns

- Importing `i18next`, `react-intl`, or `expo-localization` for copy
- Inline strings: `<Text>Continue</Text>` instead of `t('common.continue')`
- Adding key to `en.json` only
- Dynamic key construction (`t(\`onboarding.${screen}.title\`)`) — breaks grep-ability; use explicit keys or a lookup map
- Using standalone `t()` in components (ignores saved locale)

## Additional resources

- Key tree and screen mapping: [reference.md](reference.md)
- Copy-paste examples: [examples.md](examples.md)
