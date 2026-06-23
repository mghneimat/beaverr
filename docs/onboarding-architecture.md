# Onboarding architecture

This document describes how multi-step onboarding screens share navigation, persistence, and resume behavior.

## Step registry (`lib/onboardingStepRegistry.js`)

Each questionnaire route that has sub-steps registers an entry in `ONBOARDING_STEP_REGISTRY`:

| Field | Purpose |
|-------|---------|
| `routeName` | Expo route file name (e.g. `income`, `housing`) |
| `storageKey` | Beaverr storage key for section draft data |
| `stepField` | Optional field on saved data holding last sub-step |
| `steps` | Ordered semantic sub-step ids (kebab-case) |
| `resolveReturnPoint` | Maps saved data → `{ step, childIndex?, subject? }` |
| `buildResumeRoute` | Builds `/(onboarding)/…` href for resume |
| `navParams` | URL params for `useOnboardingScreen` history |

`STEPS_BY_ROUTE` is derived from the registry and feeds section progress in `lib/onboardingProgress.js`.

## Step aliases (`lib/onboardingStepAliases.js`)

Legacy `q*` step ids from earlier builds map to semantic kebab-case ids per route via `LEGACY_STEP_ALIASES_BY_ROUTE`. Use `normalizeOnboardingStep(route, step)` when reading URL params or storage.

`migrateStoredStepFields()` rewrites persisted `*OnboardingStep` fields using the registry.

## Section resume (`lib/onboardingResume.js`)

Section splashes use `navigateBackFromSectionSplash(splashRoute)` to pop the splash and reopen the **previous section** at its storage-resolved sub-step:

1. `getPreviousSectionLastRoute` finds the last question route in the prior `ONBOARDING_SECTIONS` block.
2. Registry entry loads saved data + context (household, occupation, location).
3. `navigateBackWithTarget` pops splash and `router.replace`s the resume href.

## Multi-step hook (`lib/useOnboardingMultiStep.js`)

Screens with internal steps call:

```js
const { step, setStep, childIndex } = useOnboardingMultiStep('income', {
  defaultStep: 'your-income',
  onFocus: loadSectionData,
  loadStepFromStorage: (saved) => ({ step: saved?.incomeOnboardingStep }),
});
```

The hook:

- Normalizes URL `?step=` via aliases
- Registers nav history through `useOnboardingScreen`
- Optionally reloads sub-step from storage on focus when URL has no step

## Flow modules (step logic)

Pure step graphs live beside screens — UI stays in `app/(onboarding)/`:

| Screen | Flow module |
|--------|-------------|
| Income | `lib/income/incomeFlow.js` |
| Housing | `lib/housing/housingFlow.js` |
| Transport | `lib/transport/transportFlow.js` |

Each exports `resolve*Continue`, `resolve*Back`, and `build*Payload` helpers. Screens map validation results to localized strings; flow modules return structural results only.

## Navigation history (`lib/onboardingNavigation.js`)

`recordVisit` / `navigateBack` maintain an in-memory stack (persisted on `beaverr_onboarding.navHistory`) so `router.replace` forward navigation still allows reliable back. `ONBOARDING_BACK_FALLBACK` covers incomplete stacks from legacy saves.

## Progress (`lib/onboardingProgress.js`)

`ONBOARDING_SECTIONS` lists ordered routes per chapter. Sections with multi-step screens attach `stepsByRoute` from `STEPS_BY_ROUTE`. Progress percent is monotonic within a session and never decreases when revisiting earlier routes.
