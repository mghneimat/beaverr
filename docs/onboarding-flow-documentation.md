# PocketOS Onboarding Flow — Complete Documentation

> **Purpose**: This document describes the entire onboarding flow for the PocketOS mobile application. It is intended to be consumed by an AI service to generate UI screens.
>
> **Tech Stack**: React Native (Expo Router) · Gluestack UI v1.1.73 · react-native-svg · AsyncStorage
>
> **Last Updated**: 2026-06-06

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Navigation & Screen Order](#2-navigation--screen-order)
3. [Shared Components](#3-shared-components)
4. [Design Tokens](#4-design-tokens)
5. [i18n System](#5-i18n-system)
6. [Data Storage](#6-data-storage)
7. [Financial Utilities](#7-financial-utilities)
8. [Screen-by-Screen Documentation](#8-screen-by-screen-documentation)
   - [8.1 Welcome](#81-welcome)
   - [8.2 Consent](#82-consent)
   - [8.3 Household](#83-household)
   - [8.4 Splash: Location](#84-splash-location)
   - [8.5 Location](#85-location)
   - [8.6 Occupation](#86-occupation)
   - [8.7 Splash: Income](#87-splash-income)
   - [8.8 Income](#88-income)
   - [8.9 Splash: Housing](#89-splash-housing)
   - [8.10 Housing](#810-housing)
   - [8.11 Splash: Transport](#811-splash-transport)
   - [8.12 Transport](#812-transport)
   - [8.13 Splash: Health](#813-splash-health)
   - [8.14 Health](#814-health)
   - [8.15 Splash: Children Costs](#815-splash-children-costs)
   - [8.16 Children Costs](#816-children-costs)
   - [8.17 Splash: Pets](#817-splash-pets)
   - [8.18 Pets](#818-pets)
   - [8.19 Splash: Subscriptions](#819-splash-subscriptions)
   - [8.20 Subscriptions](#820-subscriptions)
   - [8.21 Splash: Other Costs](#821-splash-other-costs)
   - [8.22 Other Costs](#822-other-costs)
   - [8.23 Splash: Debts](#823-splash-debts)
   - [8.24 Debts](#824-debts)
   - [8.25 Splash: Budget](#825-splash-budget)
   - [8.26 Budget](#826-budget)
   - [8.27 Splash: Review](#827-splash-review)
   - [8.28 Review](#828-review)
9. [Progress Tracking](#9-progress-tracking)
10. [Complete i18n Key Map](#10-complete-i18n-key-map)

---

## 1. Architecture Overview

### Project Structure

```
pocket-os/
├── app/
│   └── (onboarding)/          # Expo Router group for onboarding
│       ├── _layout.jsx         # Stack navigator (headerShown: false)
│       ├── welcome.jsx         # Brand splash / entry point
│       ├── consent.jsx         # Consent screen
│       ├── household.jsx       # Household composition (multi-step)
│       ├── splash-location.jsx
│       ├── location.jsx        # Country + city + currency
│       ├── occupation.jsx      # Employment status
│       ├── splash-income.jsx
│       ├── income.jsx          # Income sources (multi-step)
│       ├── splash-housing.jsx
│       ├── housing.jsx         # Housing costs (multi-step)
│       ├── splash-transport.jsx
│       ├── transport.jsx       # Transport costs (multi-step)
│       ├── splash-health.jsx
│       ├── health.jsx          # Health insurance (per-member tabs)
│       ├── splash-children.jsx
│       ├── children-costs.jsx  # Children costs (per-child tabs)
│       ├── splash-pets.jsx
│       ├── pets.jsx            # Pets (multi-step)
│       ├── splash-subscriptions.jsx
│       ├── subscriptions.jsx   # Subscriptions (quick-add)
│       ├── splash-other-costs.jsx
│       ├── other-costs.jsx     # Other costs (quick-add)
│       ├── splash-debts.jsx
│       ├── debts.jsx           # Debts (multi-step)
│       ├── splash-budget.jsx
│       ├── budget.jsx          # Budget & rollover (multi-step)
│       ├── splash-review.jsx
│       └── review.jsx          # Final review & complete
├── components/
│   └── onboarding/
│       ├── QuestionScreen.jsx  # Shared question screen wrapper
│       └── SplashScreen.jsx    # Shared splash screen wrapper
├── constants/
│   └── onboarding-theme.js     # Design tokens
├── lib/
│   ├── i18n.js                 # i18n system
│   ├── storage.js              # AsyncStorage wrapper
│   ├── finance.js              # Financial calculation utilities
│   └── schema.js               # Data schema definitions
└── locales/
    ├── en.json                 # English locale
    └── cs.json                 # Czech locale
```

### Key Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `expo-router` | ~4.x | File-based routing (Stack navigator) |
| `@gluestack-ui/themed` | 1.1.73 | UI component library |
| `@gluestack-ui/icon` | — | Icon system (ArrowLeftIcon, etc.) |
| `react-native-svg` | — | SVG rendering for splash illustrations |
| `@react-native-async-storage/async-storage` | — | Local persistence |
| `react-native-reanimated` | — | Animations (FadeUpView, AnimatedSlideIn) |

---

## 2. Navigation & Screen Order

The onboarding flow is a **linear stack** with 28 screens. Users progress forward by tapping "Continue" and can go back via the back arrow in the top navbar.

### Complete Screen Sequence

```
welcome
  → consent
    → household
      → splash-location
        → location
          → occupation
            → splash-income
              → income
                → splash-housing
                  → housing
                    → splash-transport
                      → transport
                        → splash-health
                          → health
                            → splash-children
                              → children-costs
                                → splash-pets
                                  → pets
                                    → splash-subscriptions
                                      → subscriptions
                                        → splash-other-costs
                                          → other-costs
                                            → splash-debts
                                              → debts
                                                → splash-budget
                                                  → budget
                                                    → splash-review
                                                      → review
                                                        → (complete → dashboard)
```

### Navigation Pattern

- **Forward**: `router.push('/onboarding/next-screen')` — via `onContinue` handler
- **Backward**: `router.back()` — via back arrow in top navbar (provided by `QuestionScreen` or `SplashScreen`)
- **Skip**: Some screens offer a skip option that navigates to the next screen without saving data

---

## 3. Shared Components

### 3.1 `QuestionScreen.jsx` — Question Screen Wrapper

**File**: [`components/onboarding/QuestionScreen.jsx`](../components/onboarding/QuestionScreen.jsx)

This is the **primary wrapper** used by all onboarding question screens. It provides a consistent layout:

```
┌─────────────────────────────┐
│  ← (arrow)    CHAPTER       │  ← Top navbar (56px)
├─────────────────────────────┤
│  ████████████░░░░  XX%      │  ← Progress bar (3px height, 44px panel)
├─────────────────────────────┤
│                             │
│   Scrollable Content Area   │  ← Children rendered here
│   (FadeUpView animated)     │
│                             │
├─────────────────────────────┤
│  [      Continue      ]     │  ← Bottom bar (fixed)
│  [Skip] (optional)          │
└─────────────────────────────┘
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `chapter` | `string` | No | Chapter label shown in top navbar (uppercase, accent color) |
| `title` | `string` | No | Question title rendered above children |
| `helper` | `string` | No | Helper text rendered below title |
| `children` | `ReactNode` | Yes | The question content (inputs, options, etc.) |
| `onContinue` | `function` | Yes | Called when Continue is tapped |
| `onBack` | `function` | No | Called when back arrow is tapped (defaults to `router.back()`) |
| `onSkip` | `function` | No | If provided, shows a "Skip" link below Continue |
| `validationError` | `string` | No | Error message shown below Continue button |
| `continueDisabled` | `boolean` | No | Disables Continue button when true |
| `progress` | `number` | No | Progress percentage (0–100) for the progress bar |
| `progressLabel` | `string` | No | Text label next to progress bar (e.g., "Step 2 of 5") |
| `animationKey` | `string` | No | Key to trigger re-animation of content on change |

#### Top Navbar Structure

```
<View style={navBar}>
  <Pressable onPress={handleBack} style={backButton}>
    <Icon as={ArrowLeftIcon} color="#7A7770" size="xs" />
  </Pressable>
  <Box style={titleContainer}>
    {chapter && <Text style={chapterLabel}>{chapter}</Text>}
  </Box>
</View>
```

- Back button: 56×56px Pressable with hover/press state backgrounds
- Arrow: Gluestack `ArrowLeftIcon` at `xs` size, color `#7A7770` (muted text)
- Chapter title: Centered with `paddingRight: 56` to balance the back button width
- Chapter style: `fontSize: 16, fontWeight: '400', letterSpacing: 0.5, color: '#E8825A', textTransform: 'uppercase'`

#### Bottom Bar Structure

```
<View style={bottomBar}>
  <Animated.View entering={FadeInUp.duration(400)}>
    <TouchableOpacity
      onPress={onContinue}
      disabled={continueDisabled}
      style={continueButton(continueDisabled)}
    >
      <Text style={btnPrimary}>{t('common.continue')}</Text>
    </TouchableOpacity>
  </Animated.View>
  {onSkip && (
    <TouchableOpacity onPress={onSkip} style={skipButton}>
      <Text style={btnSkip}>{t('common.skip')}</Text>
    </TouchableOpacity>
  )}
</View>
```

- Continue button: Full width, `backgroundColor: '#1D3557'` (primary), disabled state `#B0B0B0`
- Skip link: Below Continue, centered, `color: '#7A7770'` (muted)
- Both wrapped in `Animated.View` with `FadeInUp` entrance animation

#### Progress Bar

```
<View style={progressPanel}>
  <View style={progressTrack}>
    <Animated.View style={progressFill(progress)} />
  </View>
  {progressLabel && <Text style={progressLabelText}>{progressLabel}</Text>}
</View>
```

- Track: Full width, 3px height, `backgroundColor: '#E4E2DC'` (border)
- Fill: Animated width percentage, `backgroundColor: '#1D3557'` (primary)
- Panel height: 44px (includes label below bar)

### 3.2 `SplashScreen.jsx` — Splash Screen Wrapper

**File**: [`components/onboarding/SplashScreen.jsx`](../components/onboarding/SplashScreen.jsx)

Used for **section intro screens** between major onboarding sections. Provides a full-screen layout with illustration.

```
┌─────────────────────────────┐
│  ← (arrow)    CHAPTER       │  ← Top navbar
├─────────────────────────────┤
│  ████████████░░░░  XX%      │  ← Progress bar
├─────────────────────────────┤
│                             │
│        EYEBROW TEXT         │
│                             │
│       HEADING TEXT          │
│                             │
│       BODY TEXT             │
│                             │
│      [SVG Illustration]     │
│                             │
├─────────────────────────────┤
│  [← Back]   [  Continue  ]  │  ← Bottom bar (side-by-side)
└─────────────────────────────┘
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | Yes | SVG illustration content |
| `eyebrow` | `string` | Yes | Small uppercase label above heading |
| `heading` | `string` | Yes | Main heading text |
| `body` | `string` | Yes | Descriptive body text |
| `cta` | `string` | Yes | Continue button label |
| `onContinue` | `function` | Yes | Forward navigation handler |
| `chapter` | `string` | No | Chapter label in navbar |
| `onBack` | `function` | No | Back navigation handler |
| `progress` | `number` | No | Progress percentage |
| `progressLabel` | `string` | No | Progress label text |

#### Bottom Bar (SplashScreen)

- Back button: Left side, `← Back` text style
- Continue button: Right side, primary style
- Both side-by-side in a row

---

## 4. Design Tokens

**File**: [`constants/onboarding-theme.js`](../constants/onboarding-theme.js)

### Colors (`C`)

| Token | Value | Usage |
|-------|-------|-------|
| `C.bg` | `#F4F3EF` | Page background |
| `C.surface` | `#FDFCFA` | Card/surface background |
| `C.primary` | `#1D3557` | Primary buttons, progress fill, headings |
| `C.accent` | `#E8825A` | Chapter labels, accent elements |
| `C.positive` | `#3A8C6E` | Positive indicators, success |
| `C.danger` | `#D14040` | Errors, warnings, delete |
| `C.text` | `#1A1A1A` | Primary text |
| `C.muted` | `#7A7770` | Secondary/muted text |
| `C.border` | `#E4E2DC` | Borders, dividers |
| `C.divider` | `#D8D5CE` | Section dividers |
| `C.white` | `#FFFFFF` | White surfaces |
| `C.optionBg` | `#FDFCFA` | Option card background |
| `C.optionBorder` | `#E4E2DC` | Option card border |
| `C.optionSelected` | `#1D3557` | Selected option border |
| `C.chipBg` | `#F4F3EF` | Chip/tag background |
| `C.chipSelected` | `#1D3557` | Selected chip background |
| `C.chipText` | `#1A1A1A` | Chip text color |
| `C.chipTextSelected` | `#FFFFFF` | Selected chip text |
| `C.inputBg` | `#FDFCFA` | Input background |
| `C.inputBorder` | `#E4E2DC` | Input border |
| `C.inputFocus` | `#1D3557` | Input focus border |
| `C.placeholder` | `#A09E98` | Placeholder text |
| `C.disabled` | `#B0B0B0` | Disabled elements |
| `C.overlay` | `rgba(0,0,0,0.5)` | Modal overlay |
| `C.splashBg` | `#1D3557` | Splash screen background |
| `C.splashText` | `#FFFFFF` | Splash screen text |
| `C.splashAccent` | `#E8825A` | Splash accent elements |
| `C.splashMuted` | `rgba(255,255,255,0.7)` | Splash muted text |

### Radius (`R`)

| Token | Value | Usage |
|-------|-------|-------|
| `R.input` | `10` | Text inputs |
| `R.card` | `10` | Cards, option cards |
| `R.button` | `10` | Buttons |
| `R.pill` | `99` | Pills, frequency selectors |
| `R.chip` | `12` | Chips, tags |

### Typography (`T`)

| Token | Values | Usage |
|-------|--------|-------|
| `T.questionTitle` | `{ fontSize: 24, fontWeight: '700', color: '#1A1A1A', lineHeight: 32 }` | Question titles |
| `T.helper` | `{ fontSize: 15, fontWeight: '400', color: '#7A7770', lineHeight: 22 }` | Helper text |
| `T.splashHeading` | `{ fontSize: 32, fontWeight: '700', color: '#FFFFFF', lineHeight: 40 }` | Splash headings |
| `T.splashBody` | `{ fontSize: 16, fontWeight: '400', color: 'rgba(255,255,255,0.7)', lineHeight: 24 }` | Splash body |
| `T.eyebrow` | `{ fontSize: 13, fontWeight: '600', color: '#E8825A', letterSpacing: 1.5, textTransform: 'uppercase' }` | Section labels |
| `T.fieldLabel` | `{ fontSize: 14, fontWeight: '500', color: '#1A1A1A', lineHeight: 20 }` | Form field labels |
| `T.caption` | `{ fontSize: 12, fontWeight: '400', color: '#7A7770', lineHeight: 16 }` | Captions |
| `T.inputText` | `{ fontSize: 16, fontWeight: '400', color: '#1A1A1A' }` | Input text |
| `T.inputLarge` | `{ fontSize: 20, fontWeight: '600', color: '#1A1A1A' }` | Large input (currency) |
| `T.btnPrimary` | `{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }` | Primary button text |
| `T.btnSkip` | `{ fontSize: 14, fontWeight: '400', color: '#7A7770' }` | Skip link text |
| `T.btnAdd` | `{ fontSize: 14, fontWeight: '500', color: '#1D3557' }` | Add button text |
| `T.pillLabel` | `{ fontSize: 14, fontWeight: '500', color: '#1A1A1A' }` | Pill/frequency labels |
| `T.backBtn` | `{ fontSize: 16, fontWeight: '400', color: '#7A7770' }` | Back button text |
| `T.chapterLabel` | `{ fontSize: 16, fontWeight: '400', letterSpacing: 0.5, color: '#E8825A', textTransform: 'uppercase' }` | Chapter labels |
| `T.progressLabel` | `{ fontSize: 11, fontWeight: '500', color: '#7A7770' }` | Progress labels |

### Spacing (`S`)

| Token | Value | Usage |
|-------|-------|-------|
| `S.pagePadH` | `20` | Page horizontal padding |
| `S.pagePadV` | `32` | Page vertical padding |
| `S.cardPad` | `14` | Card inner padding |
| `S.navHeight` | `56` | Navbar height |
| `S.progressHeight` | `3` | Progress bar height |
| `S.progressPanel` | `44` | Progress panel height |
| `S.maxWidth` | `560` | Max content width |

### Button Factory Functions

```js
btnPrimary(disabled) => {
  backgroundColor: disabled ? '#B0B0B0' : '#1D3557',
  paddingVertical: 16,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  opacity: disabled ? 0.6 : 1,
}

btnAdd() => {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  borderWidth: 1,
  borderColor: '#1D3557',
  borderStyle: 'dashed',
  borderRadius: 10,
  gap: 6,
}
```

---

## 5. i18n System

**File**: [`lib/i18n.js`](../lib/i18n.js)

### How It Works

- **Locale files**: JSON files in `lib/locales/` (e.g., `en.json`, `cs.json`)
- **Dot notation keys**: e.g., `onboarding.welcome.title`
- **Parameter interpolation**: `{{param}}` syntax in strings, e.g., `"Hello {{name}}"`
- **Pluralization**: Not implemented (uses explicit keys for singular/plural)
- **Usage**: `t('onboarding.welcome.title')` or `t('onboarding.income.q5', { name: 'John' })`

### Locale Structure

```json
{
  "app": { ... },
  "common": {
    "continue": "Continue",
    "back": "Back",
    "skip": "Skip for now",
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "done": "Done",
    "add": "Add",
    "remove": "Remove",
    "yes": "Yes",
    "no": "No",
    "other": "Other",
    "search": "Search",
    "loading": "Loading..."
  },
  "onboarding": {
    "welcome": { ... },
    "consent": { ... },
    "household": { ... },
    "s2": { ... },
    "location": { ... },
    "occupation": { ... },
    "s3": { ... },
    "income": { ... },
    "s4": { ... },
    "housing": { ... },
    "s5": { ... },
    "transport": { ... },
    "s6": { ... },
    "health": { ... },
    "s7": { ... },
    "childrenCosts": { ... },
    "s8": { ... },
    "pets": { ... },
    "s9": { ... },
    "subscriptions": { ... },
    "s10": { ... },
    "otherCosts": { ... },
    "s11": { ... },
    "debts": { ... },
    "s12": { ... },
    "budget": { ... },
    "s13": { ... },
    "review": { ... },
    "progress": { ... }
  },
  "dashboard": { ... },
  "settings": { ... }
}
```

---

## 6. Data Storage

**File**: [`lib/storage.js`](../lib/storage.js)

### Storage API

```js
import { getData, setData } from '../lib/storage';

// Save data
await setData('pocketos_household', { type: 'solo', ... });

// Load data
const data = await getData('pocketos_household');
```

### Storage Keys

| Key | Screen(s) | Data Shape |
|-----|-----------|------------|
| `pocketos_household` | household | `{ type, partnerName, hasChildren, numChildren, children: [{ name, ageGroup }] }` |
| `pocketos_location` | location | `{ country, city, currency }` |
| `pocketos_occupation` | occupation | `{ user: { status, otherText }, partner: { status, otherText } \| null }` |
| `pocketos_income` | income | `{ income: [{ amount, frequency }], partnerIncome: [{ amount, frequency }], otherIncome: [{ source, amount, frequency }], savings, financialGoal }` |
| `pocketos_housing` | housing | `{ status, rentAmount, rentFrequency, utilities, internet, mortgageAmount, mortgageFrequency, otherCosts, familyContributions, governmentTaxes }` |
| `pocketos_transport` | transport | `{ hasVehicle, counts: { passenger, motorcycle, bicycle }, vehicles: [{ category, fuelType, fuelCost, fuelFreq, insuranceCost, insuranceFreq, parkingCost, parkingFreq, maintenanceCost, maintenanceFreq }], publicTransport }` |
| `pocketos_health` | health | `{ user: { type, ... }, partner: { type, ... }, children: [{ type, ... }] }` |
| `pocketos_children_costs` | children-costs | `{ children: [{ name, ageGroup, costs: [{ type, amount, frequency }] }] }` |
| `pocketos_pets` | pets | `{ hasPets, pets: [{ type, name, costs: { food, vet, grooming, other }, insurance, dogTax }] }` |
| `pocketos_subscriptions` | subscriptions | `{ subscriptions: [{ service, cost, frequency, autoRenews, renewalDate }] }` |
| `pocketos_other_costs` | other-costs | `{ costs: [{ type, amount, frequency, dueDate }] }` |
| `pocketos_debts` | debts | `{ hasDebts, debts: [{ type, balance, minPayment, apr, promoEndDate, paymentDueDay, notes }] }` |
| `pocketos_budget` | budget | `{ flexibleBudget: [{ category, amount }], rolloverStrategy: 'free' \| 'capped' \| 'reset', capMultiplier }` |
| `pocketos_onboarding` | review | `{ completed: true }` |

---

## 7. Financial Utilities

**File**: [`lib/finance.js`](../lib/finance.js)

### `toMonthly(amount, frequency)`

Converts an amount to its monthly equivalent based on frequency.

| Frequency | Multiplier |
|-----------|------------|
| `daily` | × 30.44 |
| `weekly` | × 4.33 |
| `fortnightly` | × 2.17 |
| `monthly` | × 1 |
| `quarterly` | × 1/3 |
| `annual` | × 1/12 |

### `formatCurrency(amount, currency)`

Formats a number with space-separated thousands and currency code.

```
formatCurrency(12500, 'CZK')  →  "12 500 Kč"
formatCurrency(4500, 'EUR')   →  "4 500 EUR"
```

### `totalMonthlyCosts(costs)`

Takes an array of `{ amount, frequency }` objects and returns the sum of monthly equivalents.

### `availableBudget(monthlyIncome, fixedCosts, debtPayments)`

Returns `monthlyIncome - fixedCosts - debtPayments`.

### `debtPayoff(balance, monthlyPayment, apr)`

Returns an object:
```js
{
  months: 24,           // Number of months to pay off
  totalInterest: 3200,  // Total interest paid
  payoffDate: '2028-06' // Estimated payoff date (YYYY-MM)
}
```

### `dailyAllowance(monthlyBudget, daysInMonth)`

Returns `monthlyBudget / daysInMonth`.

---

## 8. Screen-by-Screen Documentation

### 8.1 Welcome

**File**: [`app/(onboarding)/welcome.jsx`](../app/(onboarding)/welcome.jsx)

**Type**: Standalone screen (no QuestionScreen wrapper)

**Purpose**: Brand introduction and entry point to onboarding.

**Layout**:
```
┌─────────────────────────────┐
│                             │
│                             │
│        POCKETOS             │  ← Brand name
│                             │
│    Take Control of Your     │
│         Finances            │  ← Tagline
│                             │
│   PocketOS helps you track  │
│   expenses, set budgets,    │
│   and achieve your goals.   │  ← Description
│                             │
│                             │
│   ┌─────────────────────┐   │
│   │    Get Started       │   │  ← CTA button
│   └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**Components used**: `Box`, `Text` (Gluestack), `FadeUpView` (custom animated wrapper)

**Navigation**: `router.push('/onboarding/consent')`

**i18n keys**:
- `onboarding.welcome.title` → "PocketOS"
- `onboarding.welcome.tagline` → "Take Control of Your Finances"
- `onboarding.welcome.description` → "PocketOS helps you track expenses, set budgets, and achieve your financial goals."
- `onboarding.welcome.cta` → "Get Started"

---

### 8.2 Consent

**File**: [`app/(onboarding)/consent.jsx`](../app/(onboarding)/consent.jsx)

**Type**: Standalone screen (custom layout, not using QuestionScreen)

**Purpose**: Obtain user consent for data processing.

**Layout**:
```
┌─────────────────────────────┐
│  ← Back                     │  ← Custom back button
├─────────────────────────────┤
│                             │
│       Consent               │  ← Title
│                             │
│   We need your consent to   │
│   process your financial    │
│   data. This helps us       │
│   provide personalized      │
│   insights.                 │  ← Description
│                             │
│   ☐ I agree to the terms   │  ← Checkbox
│       and conditions        │
│                             │
│   ┌─────────────────────┐   │
│   │      Continue        │   │  ← Button (disabled until checked)
│   └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**Validation**: Checkbox must be checked before Continue is enabled.

**Navigation**: `router.push('/onboarding/household')`

**i18n keys**:
- `onboarding.consent.title` → "Consent"
- `onboarding.consent.description` → "We need your consent to process your financial data..."
- `onboarding.consent.checkbox` → "I agree to the terms and conditions"

---

### 8.3 Household

**File**: [`app/(onboarding)/household.jsx`](../app/(onboarding)/household.jsx)

**Type**: Multi-step (5 steps), uses `QuestionScreen` wrapper

**Steps**:

| Step | Question | Input Type | Options | Validation |
|------|----------|------------|---------|------------|
| 1 | "Who are you managing your finances for?" | OptionCard (single select) | `solo`, `partner`, `single_parent` | Required |
| 2 | "What's your partner's name?" | Text input | — | Required if partner/single_parent |
| 3 | "Do you have children?" | YesNoToggle | Yes / No | Required |
| 4 | "How many children do you have?" | Stepper | 1–10 | Required if hasChildren |
| 5 | Child details (per child) | Name input + Age group selector | Age groups: `0-2`, `3-5`, `6-15`, `16-18`, `18+` | Name required, age group required |

**Progress**: 10% → 20% → 30% → 40% → 50%

**Data shape**:
```js
{
  type: 'solo' | 'partner' | 'single_parent',
  partnerName: string,           // if type === 'partner' or 'single_parent'
  hasChildren: boolean,
  numChildren: number,           // 1-10
  children: [
    { name: string, ageGroup: '0-2' | '3-5' | '6-15' | '16-18' | '18+' }
  ]
}
```

**i18n keys**:
- `onboarding.household.q1` → "Who are you managing your finances for?"
- `onboarding.household.solo` → "Just me"
- `onboarding.household.partner` → "Me and my partner"
- `onboarding.household.single_parent` → "Me and my children"
- `onboarding.household.q2` → "What's your partner's name?"
- `onboarding.household.q3` → "Do you have children?"
- `onboarding.household.q4` → "How many children do you have?"
- `onboarding.household.q5` → "Tell us about your children"
- `onboarding.household.childName` → "Child's name"
- `onboarding.household.ageGroup` → "Age group"
- `onboarding.household.ageGroups.0-2` → "0–2 years"
- `onboarding.household.ageGroups.3-5` → "3–5 years"
- `onboarding.household.ageGroups.6-15` → "6–15 years"
- `onboarding.household.ageGroups.16-18` → "16–18 years"
- `onboarding.household.ageGroups.18+` → "18+ years"

**Components used**: `OptionCard`, `LabeledInput`, `YesNoToggle`, `Stepper`

---

### 8.4 Splash: Location

**File**: [`app/(onboarding)/splash-location.jsx`](../app/(onboarding)/splash-location.jsx)

**Type**: Splash screen (uses `SplashScreen` wrapper)

**Section**: 2 — "Location & Currency"

**Navigation**: Back → `household`, Forward → `location`

**Progress**: 15%

**Content**:
- Eyebrow: `onboarding.s2.eyebrow` → "Section 2"
- Heading: `onboarding.s2.heading` → "Location & Currency"
- Body: `onboarding.s2.body` → "Tell us where you're based so we can set the right currency and tailor suggestions to your region."
- CTA: `onboarding.s2.cta` → "Set my location"

**SVG**: Globe/map illustration using `C.splashBg`, `C.splashAccent`, `C.splashMuted`

---

### 8.5 Location

**File**: [`app/(onboarding)/location.jsx`](../app/(onboarding)/location.jsx)

**Type**: Single screen (uses `QuestionScreen` wrapper)

**Purpose**: Select country (auto-sets currency) and enter city.

**Questions**:

| # | Question | Input Type | Options | Validation |
|---|----------|------------|---------|------------|
| 1 | "Where do you live?" | Country picker (modal with search) | 30+ countries with flag emojis | Required |
| 2 | "Which city?" | Text input | — | Required |
| 3 | Currency | Auto-set from country selection | Display only | Auto |

**Country list** (30+ countries with flag emojis and currency codes):
```
🇦🇺 Australia (AUD), 🇦🇹 Austria (EUR), 🇧🇪 Belgium (EUR), 🇧🇬 Bulgaria (BGN),
🇨🇦 Canada (CAD), 🇭🇷 Croatia (EUR), 🇨🇿 Czech Republic (CZK), 🇩🇰 Denmark (DKK),
🇪🇪 Estonia (EUR), 🇫🇮 Finland (EUR), 🇫🇷 France (EUR), 🇩🇪 Germany (EUR),
🇬🇷 Greece (EUR), 🇭🇺 Hungary (HUF), 🇮🇸 Iceland (ISK),
🇮🇪 Ireland (EUR), 🇮🇱 Israel (ILS), 🇮🇹 Italy (EUR), 🇯🇵 Japan (JPY),
🇱🇻 Latvia (EUR), 🇱🇹 Lithuania (EUR), 🇱🇺 Luxembourg (EUR), 🇲🇹 Malta (EUR),
🇳🇱 Netherlands (EUR), 🇳🇿 New Zealand (NZD), 🇳🇴 Norway (NOK), 🇵🇱 Poland (PLN),
🇵🇹 Portugal (EUR), 🇷🇴 Romania (RON), 🇸🇰 Slovakia (EUR), 🇸🇮 Slovenia (EUR),
🇪🇸 Spain (EUR), 🇸🇪 Sweden (SEK), 🇨🇭 Switzerland (CHF), 🇬🇧 United Kingdom (GBP),
🇺🇸 United States (USD)
```

**Progress**: 20%

**Data shape**:
```js
{
  country: string,
  city: string,
  currency: string
}
```

**i18n keys**:
- `onboarding.location.q1` → "Where do you live?"
- `onboarding.location.q2` → "Which city?"
- `onboarding.location.currency` → "Currency"

**Components used**: `CountryPickerModal` (custom modal with search + FlatList), `LabeledInput`

---

### 8.6 Occupation

**File**: [`app/(onboarding)/occupation.jsx`](../app/(onboarding)/occupation.jsx)

**Type**: Multi-step (2 steps), uses `QuestionScreen` wrapper

**Steps**:

| Step | Question | Input Type | Options | Validation |
|------|----------|------------|---------|------------|
| 1 | "What's your employment status?" | OptionCard (single select) | `employee`, `selfEmployed`, `student`, `notWorking`, `other` | Required |
| 2 | "What's your partner's employment status?" | OptionCard (single select) | Same options | Required if partner exists |

**Conditional**: Step 2 only shown if `household.type` is `partner` or `single_parent`.

**Other option**: If `other` selected, shows text input for custom description.

**Progress**: 30% → 40%

**Data shape**:
```js
{
  user: { status, otherText },
  partner: { status, otherText } | null
}
```

**i18n keys**:
- `onboarding.occupation.q1` → "What's your employment status?"
- `onboarding.occupation.q2` → "What's your partner's employment status?"
- `onboarding.occupation.employee` → "Employed"
- `onboarding.occupation.selfEmployed` → "Self-employed (OSVČ)"
- `onboarding.occupation.student` → "Student"
- `onboarding.occupation.notWorking` → "Not currently working"
- `onboarding.occupation.other` → "Other"
- `onboarding.occupation.otherPlaceholder` → "Describe your situation"

**Components used**: `OptionCard`, `LabeledInput`

---

### 8.7 Splash: Income

**File**: [`app/(onboarding)/splash-income.jsx`](../app/(onboarding)/splash-income.jsx)

**Type**: Splash screen (uses `SplashScreen` wrapper)

**Section**: 3 — "Income & Savings"

**Navigation**: Back → `occupation`, Forward → `income`

**Progress**: 35%

**Content**:
- Eyebrow: `onboarding.s3.eyebrow` → "Section 3"
- Heading: `onboarding.s3.heading` → "Income & Savings"
- Body: `onboarding.s3.body` → "Now let's look at what's coming in. We'll ask about your income, savings, and financial goals."
- CTA: `onboarding.s3.cta` → "Add my income"

**SVG**: Income/growth illustration

---

### 8.8 Income

**File**: [`app/(onboarding)/income.jsx`](../app/(onboarding)/income.jsx)

**Type**: Multi-step (5 steps), uses `QuestionScreen` wrapper

**Steps**:

| Step | Key | Question | Input Type | Validation |
|------|-----|----------|------------|------------|
| 1 | `q5` | "What's your monthly income?" | Dynamic rows: amount + frequency | At least 1 row, amount > 0 |
| 2 | `q5a` | "What's your partner's monthly income?" | Dynamic rows: amount + frequency | Required if partner exists |
| 3 | `q5b` | "Do you have any other income sources?" | Dynamic rows: source + amount + frequency | Optional |
| 4 | `q5c` | "Do you have any savings?" | Amount input | Optional |
| 5 | `q5d` | "What's your financial goal?" | Text input | Optional |

**Frequency options**: `daily`, `weekly`, `fortnightly`, `monthly`

**Dynamic rows**: Users can add/remove multiple income entries using `AddAnotherButton` and `RemoveButton`.

**Components used**: `AnimatedSlideIn`, `AnimatedRow`, `AddAnotherButton`, `RemoveButton`, `FrequencyPills`, `LabeledInput`, `DatePicker`

**Progress**: 45% → 48% → 50% → 53% → 55%

**Data shape**:
```js
{
  income: [{ amount, frequency }],
  partnerIncome: [{ amount, frequency }],
  otherIncome: [{ source, amount, frequency }],
  savings: number,
  financialGoal: string
}
```

**i18n keys**:
- `onboarding.income.q5` → "What's your monthly income?"
- `onboarding.income.q5a` → "What's your partner's monthly income?"
- `onboarding.income.q5b` → "Do you have any other income sources?"
- `onboarding.income.q5c` → "Do you have any savings?"
- `onboarding.income.q5d` → "What's your financial goal?"
- `onboarding.income.amount` → "Amount"
- `onboarding.income.source` → "Source"
- `onboarding.income.addIncome` → "Add another income"
- `onboarding.income.addSource` → "Add another source"
- `onboarding.income.savingsPlaceholder` → "Enter savings amount"
- `onboarding.income.goalPlaceholder` → "e.g., Save for a house, pay off debt..."
- `common.frequencies.daily` → "Daily"
- `common.frequencies.weekly` → "Weekly"
- `common.frequencies.fortnightly` → "Fortnightly"
- `common.frequencies.monthly` → "Monthly"

---

### 8.9 Splash: Housing

**File**: [`app/(onboarding)/splash-housing.jsx`](../app/(onboarding)/splash-housing.jsx)

**Type**: Splash screen (uses `SplashScreen` wrapper)

**Section**: 4 — "Housing"

**Navigation**: Back → `income`, Forward → `housing`

**Progress**: 55%

**Content**:
- Eyebrow: `onboarding.s4.eyebrow` → "Section 4"
- Heading: `onboarding.s4.heading` → "Housing"
- Body: `onboarding.s4.body` → "Let's look at your housing situation. We'll ask about rent, utilities, and other housing-related costs."
- CTA: `onboarding.s4.cta` → "Add housing costs"

**SVG**: House illustration

---

### 8.10 Housing

**File**: [`app/(onboarding)/housing.jsx`](../app/(onboarding)/housing.jsx)

**Type**: Multi-step (8 steps), uses `QuestionScreen` wrapper

**Steps**:

| Step | Key | Question | Input Type | Options | Validation |
|------|-----|----------|------------|---------|------------|
| 1 | `q6` | "What's your housing situation?" | OptionCard | `rent`, `own`, `family` | Required |
| 2 | `q6a` | "How much is your rent?" | Amount + frequency | — | Required if rent |
| 3 | `q6b` | "How much are your utilities?" | Amount + frequency | — | Optional |
| 4 | `q6c` | "How much is your internet?" | Amount + frequency | — | Optional |
| 5 | `q6d` | "Do you have a mortgage?" | YesNoToggle | Yes / No | Required if own |
| 6 | `q6e` | "How much is your mortgage?" | Amount + frequency | — | Required if mortgage |
| 7 | `q6f` | "Any other housing costs?" | Amount + frequency | — | Optional |
| 8 | `q6g` | "Do you receive any housing contributions?" | Amount + frequency | — | Optional |

**Frequency options**: `monthly`, `annual`

**Progress**: 62%

**Data shape**:
```js
{
  status: 'rent' | 'own' | 'family',
  rentAmount, rentFrequency,
  utilities, utilitiesFrequency,
  internet, internetFrequency,
  mortgageAmount, mortgageFrequency,
  otherCosts, otherCostsFrequency,
  familyContributions, familyContributionsFrequency,
  governmentTaxes, governmentTaxesFrequency
}
```

**i18n keys**:
- `onboarding.housing.q6` → "What's your housing situation?"
- `onboarding.housing.rent` → "Renting"
- `onboarding.housing.own` → "I own my home"
- `onboarding.housing.family` → "Living with family"
- `onboarding.housing.q6a` → "How much is your rent?"
- `onboarding.housing.q6b` → "How much are your utilities?"
- `onboarding.housing.q6c` → "How much is your internet?"
- `onboarding.housing.q6d` → "Do you have a mortgage?"
- `onboarding.housing.q6e` → "How much is your mortgage?"
- `onboarding.housing.q6f` → "Any other housing costs?"
- `onboarding.housing.q6g` → "Do you receive any housing contributions?"
- `onboarding.housing.amount` → "Amount"

**Components used**: `OptionCard`, `YesNoToggle`, `LabeledInput`, `FrequencyPills`

---

### 8.11 Splash: Transport

**File**: [`app/(onboarding)/splash-transport.jsx`](../app/(onboarding)/splash-transport.jsx)

**Type**: Splash screen (uses `SplashScreen` wrapper)

**Section**: 5 — "Transport"

**Navigation**: Back → `housing`, Forward → `transport`

**Progress**: 62%

**Content**:
- Eyebrow: `onboarding.s5.eyebrow` → "Section 5"
- Heading: `onboarding.s5.heading` → "Transport"
- Body: `onboarding.s5.body` → "Now let's look at your transport costs — vehicles, fuel, insurance, and public transport."
- CTA: `onboarding.s5.cta` → "Add transport costs"

**SVG**: Vehicle/transport illustration

---

### 8.12 Transport

**File**: [`app/(onboarding)/transport.jsx`](../app/(onboarding)/transport.jsx)

**Type**: Multi-step (7+ steps), uses `QuestionScreen` wrapper

**Steps**:

| Step | Key | Question | Input Type | Options | Validation |
|------|-----|----------|------------|---------|------------|
| 1 | `q7` | "Do you have any vehicles?" | YesNoToggle | Yes / No | Required |
| 2 | `q7Count` | "How many vehicles do you have?" | Count inputs per category | passenger, motorcycle, bicycle | Sum > 0 |
| 3 | `q7a` | "How much do you spend on fuel?" | Amount + frequency + fuel type | petrol/diesel/electric/hybrid/lpg/cng | Per vehicle (skip bicycle) |
| 4 | `q7b` | "How much is your insurance?" | Amount + frequency | — | Per vehicle (skip bicycle) |
| 5 | `q7c` | "How much do you spend on parking?" | Amount + frequency | — | Per vehicle (skip bicycle) |
| 6 | `q7d` | "How much do you spend on maintenance?" | Amount + frequency | — | Per vehicle (all types) |
| 7 | `q7e` | "How much do you spend on public transport?" | Amount + frequency | — | Optional |

**Vehicle categories**: `passenger` (car), `motorcycle`, `bicycle`

**Fuel types**: `petrol`, `diesel`, `electric`, `hybrid`, `lpg`, `cng`

**Per-vehicle iteration**: Steps q7a–q7d iterate over each vehicle using `vehicleIndex`. Bicycles skip q7a (fuel), q7b (insurance), q7c (parking) — only show q7d (maintenance).

**Frequency options**: `monthly`, `annual`

**Progress**: 70%

**Data shape**:
```js
{
  hasVehicle: boolean,
  counts: { passenger, motorcycle, bicycle },
  vehicles: [{ category, fuelType, fuelCost, fuelFreq, insuranceCost, insuranceFreq, parkingCost, parkingFreq, maintenanceCost, maintenanceFreq }],
  publicTransport, publicTransportFreq
}
```

**i18n keys**:
- `onboarding.transport.q7` → "Do you have any vehicles?"
- `onboarding.transport.q7Count` → "How many vehicles do you have?"
- `onboarding.transport.passenger` → "Car"
- `onboarding.transport.motorcycle` → "Motorcycle"
- `onboarding.transport.bicycle` → "Bicycle"
- `onboarding.transport.q7a` → "How much do you spend on fuel?"
- `onboarding.transport.q7b` → "How much is your insurance?"
- `onboarding.transport.q7c` → "How much do you spend on parking?"
- `onboarding.transport.q7d` → "How much do you spend on maintenance?"
- `onboarding.transport.q7e` → "How much do you spend on public transport?"
- `onboarding.transport.fuelType` → "Fuel type"
- `onboarding.transport.fuelTypes.petrol` → "Petrol"
- `onboarding.transport.fuelTypes.diesel` → "Diesel"
- `onboarding.transport.fuelTypes.electric` → "Electric"
- `onboarding.transport.fuelTypes.hybrid` → "Hybrid"
- `onboarding.transport.fuelTypes.lpg` → "LPG"
- `onboarding.transport.fuelTypes.cng` → "CNG"

**Components used**: `YesNoToggle`, `LabeledInput`, `FrequencyPills`, `OptionCard`

---

### 8.13 Splash: Health

**File**: [`app/(onboarding)/splash-health.jsx`](../app/(onboarding)/splash-health.jsx)

**Type**: Splash screen (uses `SplashScreen` wrapper)

**Section**: 6 — "Health Insurance"

**Navigation**: Back → `transport`, Forward → `health`

**Progress**: 70%

**Content**:
- Eyebrow: `onboarding.s6.eyebrow` → "Section 6"
- Heading: `onboarding.s6.heading` → "Health Insurance"
- Body: `onboarding.s6.body` → "Let's look at your health insurance coverage."
- CTA: `onboarding.s6.cta` → "Add health insurance"

**SVG**: Health/medical illustration

---

### 8.14 Health

**File**: [`app/(onboarding)/health.jsx`](../app/(onboarding)/health.jsx)

**Type**: Single screen with per-member tabs, uses `QuestionScreen` wrapper

**Purpose**: Collect health insurance information for each household member.

**Tabs**: One tab per household member (user, partner if exists, each child)

**Options per member**:

| Option | Label | Next Step |
|--------|-------|-----------|
| `coveredByEmployer` | "Covered by employer" | No further input |
| `payPrivately` | "I pay privately" | Show premium fields |
| `skip` | "Skip / Not applicable" | No further input |

**If "pay privately" selected**:

| Field | Input Type | Validation |
|-------|------------|------------|
| Premium amount | Number input | Required, > 0 |
| Frequency | Frequency pills | Required |
| Renewal date | Date picker | Required |
| Contract type | OptionCard | `ongoing` or `fixed` |
| Custom frequency months | Number input | If frequency is custom |

**Progress**: 75%

**Data shape**:
```js
{
  user: { type, premium, frequency, customMonths, renewalDate, contractType },
  partner: { ... } | null,
  children: [{ ... }]
}
```

**i18n keys**:
- `onboarding.health.title` → "Health Insurance"
- `onboarding.health.coveredByEmployer` → "Covered by employer"
- `onboarding.health.payPrivately` → "I pay privately"
- `onboarding.health.skip` → "Skip / Not applicable"
- `onboarding.health.premium` → "Premium amount"
- `onboarding.health.renewalDate` → "Renewal date"
- `onboarding.health.contractType` → "Contract type"
- `onboarding.health.ongoing` → "Ongoing"
- `onboarding.health.fixed` → "Fixed term"

**Components used**: `OptionCard`, `LabeledInput`, `FrequencyPills`, `DatePicker`, tab bar (custom)

---

### 8.15 Splash: Children Costs

**File**: [`app/(onboarding)/splash-children.jsx`](../app/(onboarding)/splash-children.jsx)

**Type**: Splash screen (uses `SplashScreen` wrapper)

**Section**: 7 — "Children's Costs"

**Navigation**: Back → `health`, Forward → `children-costs`

**Progress**: 75%

**Content**:
- Eyebrow: `onboarding.s7.eyebrow` → "Section 7"
- Heading: `onboarding.s7.heading` → "Children's Costs"
- Body: `onboarding.s7.body` → "Now let's look at costs related to your children."
- CTA: `onboarding.s7.cta` → "Add children's costs"

**SVG**: Children/family illustration

---

### 8.16 Children Costs

**File**: [`app/(onboarding)/children-costs.jsx`](../app/(onboarding)/children-costs.jsx)

**Type**: Single screen with per-child tabs, uses `QuestionScreen` wrapper

**Purpose**: Collect costs for each child, with suggestion chips based on age group.

**Tabs**: One tab per child

**Age group → Suggested cost chips**:

| Age Group | Suggested Cost Types |
|-----------|---------------------|
| `0-2` | `daycare`, `nanny`, `nappies`, `babySupplies` |
| `3-5` | `kindergarten`, `afterHours`, `extracurricular` |
| `6-15` | `schoolFees`, `schoolSupplies`, `afterSchool`, `tutoring` |
| `16-18` | `schoolFees`, `schoolSupplies`, `afterSchool`, `tutoring`, `drivingLessons`, `uniFees` |
| `18+` | `uniFees`, `other` |

**Each cost entry**: `{ type, amount, frequency }`

**Custom fields**: Users can add custom "other" cost types with add/remove buttons.

**Progress**: 78%

**Data shape**:
```js
{
  children: [{ name, ageGroup, costs: [{ type, amount, frequency }] }]
}
```

**i18n keys**:
- `onboarding.childrenCosts.title` → "Children's Costs"
- `onboarding.childrenCosts.costTypes.daycare` → "Daycare"
- `onboarding.childrenCosts.costTypes.nanny` → "Nanny"
- `onboarding.childrenCosts.costTypes.nappies` → "Nappies & diapers"
- `onboarding.childrenCosts.costTypes.babySupplies` → "Baby supplies"
- `onboarding.childrenCosts.costTypes.kindergarten` → "Kindergarten"
- `onboarding.childrenCosts.costTypes.afterHours` → "After-school care"
- `onboarding.childrenCosts.costTypes.extracurricular` → "Extracurricular activities"
- `onboarding.childrenCosts.costTypes.schoolFees` → "School fees"
- `onboarding.childrenCosts.costTypes.schoolSupplies` → "School supplies"
- `onboarding.childrenCosts.costTypes.afterSchool` → "After-school programs"
- `onboarding.childrenCosts.costTypes.tutoring` → "Tutoring"
- `onboarding.childrenCosts.costTypes.drivingLessons` → "Driving lessons"
- `onboarding.childrenCosts.costTypes.uniFees` → "University fees"
- `onboarding.childrenCosts.costTypes.other` → "Other"
- `onboarding.childrenCosts.amount` → "Amount"
- `onboarding.childrenCosts.addCost` → "Add another cost"

**Components used**: Tab bar, suggestion chips (Pressable), `LabeledInput`, `FrequencyPills`, `AddAnotherButton`, `RemoveButton`

---

### 8.17 Splash: Pets

**File**: [`app/(onboarding)/splash-pets.jsx`](../app/(onboarding)/splash-pets.jsx)

**Type**: Splash screen (uses `SplashScreen` wrapper)

**Section**: 8 — "Pets"

**Navigation**: Back → `children-costs`, Forward → `pets`

**Progress**: 80%

**Content**:
- Eyebrow: `onboarding.s8.eyebrow` → "Section 8"
- Heading: `onboarding.s8.heading` → "Pets"
- Body: `onboarding.s8.body` → "Do you have any pets? Let's add their costs."
- CTA: `onboarding.s8.cta` → "Add pets"

**SVG**: Pet/animal illustration

---

### 8.18 Pets

**File**: [`app/(onboarding)/pets.jsx`](../app/(onboarding)/pets.jsx)

**Type**: Multi-step (2 steps), uses `QuestionScreen` wrapper

**Steps**:

| Step | Key | Question | Input Type | Options | Validation |
|------|-----|----------|------------|---------|------------|
| 1 | `q10` | "Do you have any pets?" | YesNoToggle | Yes / No | Required |
| 2 | `q10a` | "Tell us about your pets" | Dynamic pet cards | — | At least 1 pet |

**Pet form fields**:

| Field | Input Type | Options |
|-------|------------|---------|
| Pet type | OptionCard | `dog`, `cat`, `bird`, `other` |
| Pet name | Text input | — |
| Food cost | Amount + frequency | Toggle pill |
| Vet cost | Amount + frequency | Toggle pill |
| Grooming cost | Amount + frequency | Toggle pill |
| Other cost | Amount + frequency | Toggle pill |
| Insurance | Amount + frequency | Optional |
| Dog tax | Amount (pre-filled 1500 Kč) | CZ-specific |

**Cost sections**: Each cost type (food, vet, grooming, otherCost) has a toggle pill to show/hide the amount + frequency fields.

**Dog tax**: Pre-filled at 1500 Kč for Czech Republic users. Can be modified.

**Progress**: 80% → 83%

**Data shape**:
```js
{
  hasPets: boolean,
  pets: [{ type, name, costs: { food: { amount, frequency }, vet: { amount, frequency }, grooming: { amount, frequency }, otherCost: { amount, frequency } }, insurance: { amount, frequency }, dogTax: number }]
}
```

**i18n keys**:
- `onboarding.pets.q10` → "Do you have any pets?"
- `onboarding.pets.q10a` → "Tell us about your pets"
- `onboarding.pets.dog` → "Dog"
- `onboarding.pets.cat` → "Cat"
- `onboarding.pets.bird` → "Bird"
- `onboarding.pets.other` → "Other"
- `onboarding.pets.name` → "Pet's name"
- `onboarding.pets.food` → "Food"
- `onboarding.pets.vet` → "Veterinary"
- `onboarding.pets.grooming` → "Grooming"
- `onboarding.pets.otherCost` → "Other costs"
- `onboarding.pets.insurance` → "Insurance"
- `onboarding.pets.dogTax` → "Dog tax"
- `onboarding.pets.addPet` → "Add another pet"

**Components used**: `YesNoToggle`, `OptionCard`, `LabeledInput`, `FrequencyPills`, toggle pills, `AddAnotherButton`, `RemoveButton`

---

### 8.19 Splash: Subscriptions

**File**: [`app/(onboarding)/splash-subscriptions.jsx`](../app/(onboarding)/splash-subscriptions.jsx)

**Type**: Splash screen (uses `SplashScreen` wrapper)

**Section**: 9 — "Subscriptions"

**Navigation**: Back → `pets`, Forward → `subscriptions`

**Progress**: 83%

**Content**:
- Eyebrow: `onboarding.s9.eyebrow` → "Section 9"
- Heading: `onboarding.s9.heading` → "Subscriptions"
- Body: `onboarding.s9.body` → "Let's look at your monthly subscriptions."
- CTA: `onboarding.s9.cta` → "Add subscriptions"

**SVG**: Subscription/media illustration

---

### 8.20 Subscriptions

**File**: [`app/(onboarding)/subscriptions.jsx`](../app/(onboarding)/subscriptions.jsx)

**Type**: Single screen, uses `QuestionScreen` wrapper

**Purpose**: Quick-add subscription services with predefined chips.

**Predefined services** (18+ with service icons): Netflix, Prime Video, Disney+, HBO Max, Apple TV+, Spotify, Apple Music, YouTube Premium, Xbox Game Pass, PlayStation Plus, Nintendo Switch Online, iCloud, Google Drive, Dropbox, Microsoft 365, Adobe Creative Cloud, Gym membership, Other

**Each subscription card**:

| Field | Input Type | Validation |
|-------|------------|------------|
| Cost | Number input | Required, > 0 |
| Frequency | Frequency pills | Required |
| Auto-renews | Toggle (Yes/No) | Optional |
| Renewal date | Date picker | Optional |

**Streaming flag**: If user has 3+ streaming services (Netflix, Prime Video, Disney+, HBO Max, Apple TV+), a note is shown suggesting they review usage.

**Progress**: 85%

**Data shape**:
```js
{
  subscriptions: [{ service, cost, frequency, autoRenews, renewalDate }]
}
```

**i18n keys**:
- `onboarding.subscriptions.title` → "Subscriptions"
- `onboarding.subscriptions.services.netflix` → "Netflix"
- `onboarding.subscriptions.services.primeVideo` → "Prime Video"
- `onboarding.subscriptions.services.disney` → "Disney+"
- `onboarding.subscriptions.services.hbo` → "HBO Max"
- `onboarding.subscriptions.services.appleTV` → "Apple TV+"
- `onboarding.subscriptions.services.spotify` → "Spotify"
- `onboarding.subscriptions.services.appleMusic` → "Apple Music"
- `onboarding.subscriptions.services.youtubePremium` → "YouTube Premium"
- `onboarding.subscriptions.services.xbox` → "Xbox Game Pass"
- `onboarding.subscriptions.services.playstation` → "PlayStation Plus"
- `onboarding.subscriptions.services.nintendo` → "Nintendo Switch Online"
- `onboarding.subscriptions.services.icloud` → "iCloud"
- `onboarding.subscriptions.services.googleDrive` → "Google Drive"
- `onboarding.subscriptions.services.dropbox` → "Dropbox"
- `onboarding.subscriptions.services.microsoft365` → "Microsoft 365"
- `onboarding.subscriptions.services.adobe` → "Adobe Creative Cloud"
- `onboarding.subscriptions.services.gym` → "Gym membership"
- `onboarding.subscriptions.services.other` → "Other"
- `onboarding.subscriptions.cost` → "Cost"
- `onboarding.subscriptions.autoRenews` → "Auto-renews"
- `onboarding.subscriptions.renewalDate` → "Renewal date"
- `onboarding.subscriptions.streamingWarning` → "You have 3+ streaming services. Consider reviewing your usage."

**Components used**: Service chips (Pressable with icon), subscription cards, `LabeledInput`, `FrequencyPills`, `YesNoToggle`, `DatePicker`

---

### 8.21 Splash: Other Costs

**File**: [`app/(onboarding)/splash-other-costs.jsx`](../app/(onboarding)/splash-other-costs.jsx)

**Type**: Splash screen (uses `SplashScreen` wrapper)

**Section**: 10 — "Other Costs"

**Navigation**: Back → `subscriptions`, Forward → `other-costs`

**Progress**: 86%

**Content**:
- Eyebrow: `onboarding.s10.eyebrow` → "Section 10"
- Heading: `onboarding.s10.heading` → "Other Costs"
- Body: `onboarding.s10.body` → "Let's capture any other regular costs we haven't covered yet."
- CTA: `onboarding.s10.cta` → "Add other costs"

**SVG**: Miscellaneous/other illustration

---

### 8.22 Other Costs

**File**: [`app/(onboarding)/other-costs.jsx`](../app/(onboarding)/other-costs.jsx)

**Type**: Single screen, uses `QuestionScreen` wrapper

**Purpose**: Quick-add any remaining regular costs not covered in previous sections.

**Predefined cost types**: groceries, mobilePhone, lifeInsurance, homeInsurance, gym, hairSalon, laundry, charity, education, pension, other

**OSVČ auto-prompt**: If user selected `selfEmployed` in occupation, a prompt appears suggesting they add social and health insurance contributions.

**Each cost card**:

| Field | Input Type | Validation |
|-------|------------|------------|
| Amount | Number input | Required, > 0 |
| Frequency | Frequency pills | Required |
| Due date | Date picker | Optional |

**Progress**: 88%

**Data shape**:
```js
{
  costs: [{ type, amount, frequency, dueDate }]
}
```

**i18n keys**:
- `onboarding.otherCosts.title` → "Other Costs"
- `onboarding.otherCosts.costTypes.groceries` → "Groceries"
- `onboarding.otherCosts.costTypes.mobilePhone` → "Mobile phone"
- `onboarding.otherCosts.costTypes.lifeInsurance` → "Life insurance"
- `onboarding.otherCosts.costTypes.homeInsurance` → "Home insurance"
- `onboarding.otherCosts.costTypes.gym` → "Gym"
- `onboarding.otherCosts.costTypes.hairSalon` → "Hair salon"
- `onboarding.otherCosts.costTypes.laundry` → "Laundry"
- `onboarding.otherCosts.costTypes.charity` → "Charity"
- `onboarding.otherCosts.costTypes.education` → "Education"
- `onboarding.otherCosts.costTypes.pension` → "Pension contribution"
- `onboarding.otherCosts.costTypes.other` → "Other"
- `onboarding.otherCosts.osvcPrompt` → "As a self-employed person (OSVČ), don't forget to include your social and health insurance contributions."
- `onboarding.otherCosts.amount` → "Amount"
- `onboarding.otherCosts.dueDate` → "Due date"

**Components used**: Cost chips (Pressable), cost cards, `LabeledInput`, `FrequencyPills`, `DatePicker`

---

### 8.23 Splash: Debts

**File**: [`app/(onboarding)/splash-debts.jsx`](../app/(onboarding)/splash-debts.jsx)

**Type**: Splash screen (uses `SplashScreen` wrapper)

**Section**: 11 — "Debts"

**Navigation**: Back → `other-costs`, Forward → `debts`

**Progress**: 90%

**Content**:
- Eyebrow: `onboarding.s11.eyebrow` → "Section 11"
- Heading: `onboarding.s11.heading` → "Debts"
- Body: `onboarding.s11.body` → "Let's look at any debts you may have."
- CTA: `onboarding.s11.cta` → "Add debts"

**SVG**: Debt/financial illustration

---

### 8.24 Debts

**File**: [`app/(onboarding)/debts.jsx`](../app/(onboarding)/debts.jsx)

**Type**: Multi-step (2 steps), uses `QuestionScreen` wrapper

**Steps**:

| Step | Key | Question | Input Type | Options | Validation |
|------|-----|----------|------------|---------|------------|
| 1 | `q13` | "Do you have any debts?" | YesNoToggle | Yes / No | Required |
| 2 | `q13a` | "Tell us about your debts" | Dynamic debt cards | — | At least 1 debt |

**Debt types**: `creditCard`, `personalLoan`, `carLoan`, `studentLoan`, `medical`, `family`, `bnpl` (Buy Now Pay Later), `other`

**Each debt card**:

| Field | Input Type | Validation |
|-------|------------|------------|
| Type | OptionCard (select) | Required |
| Balance | Number input | Required, > 0 |
| Minimum payment | Number input | Required, > 0 |
| APR (%) | Number input | Required, 0–100 |
| Promo end date | Date picker | If APR = 0 |
| Payment due day | DayPicker (1–31) | Optional |
| Notes | Text input | Optional |

**High APR warning**: If APR > 20%, a warning message is displayed.

**Promo end date**: Shown only when APR = 0 (indicating a promotional period).

**Custom DayPicker component**: A horizontal scrollable picker for days 1–31.

**Progress**: 90% → 93%

**Data shape**:
```js
{
  hasDebts: boolean,
  debts: [{ type, balance, minPayment, apr, promoEndDate, paymentDueDay, notes }]
}
```

**i18n keys**:
- `onboarding.debts.q13` → "Do you have any debts?"
- `onboarding.debts.q13a` → "Tell us about your debts"
- `onboarding.debts.types.creditCard` → "Credit card"
- `onboarding.debts.types.personalLoan` → "Personal loan"
- `onboarding.debts.types.carLoan` → "Car loan"
- `onboarding.debts.types.studentLoan` → "Student loan"
- `onboarding.debts.types.medical` → "Medical debt"
- `onboarding.debts.types.family` → "Family/friends"
- `onboarding.debts.types.bnpl` → "Buy Now Pay Later"
- `onboarding.debts.types.other` → "Other"
- `onboarding.debts.balance` → "Balance"
- `onboarding.debts.minPayment` → "Minimum payment"
- `onboarding.debts.apr` → "APR (%)"
- `onboarding.debts.promoEndDate` → "Promotional end date"
- `onboarding.debts.paymentDueDay` → "Payment due day"
- `onboarding.debts.notes` → "Notes"
- `onboarding.debts.addDebt` → "Add another debt"
- `onboarding.debts.highAprWarning` → "This is a high-interest debt. Consider prioritizing it."

**Components used**: `YesNoToggle`, `OptionCard`, `LabeledInput`, `DatePicker`, `DayPicker` (custom 1–31 horizontal picker), `AddAnotherButton`, `RemoveButton`

---

### 8.25 Splash: Budget

**File**: [`app/(onboarding)/splash-budget.jsx`](../app/(onboarding)/splash-budget.jsx)

**Type**: Splash screen (uses `SplashScreen` wrapper)

**Section**: 12 — "Budget"

**Navigation**: Back → `debts`, Forward → `budget`

**Progress**: 93%

**Content**:
- Eyebrow: `onboarding.s12.eyebrow` → "Section 12"
- Heading: `onboarding.s12.heading` → "Budget"
- Body: `onboarding.s12.body` → "Now let's set up your budget. We'll help you allocate your remaining income."
- CTA: `onboarding.s12.cta` → "Set up my budget"

**SVG**: Budget/financial planning illustration

---

### 8.26 Budget

**File**: [`app/(onboarding)/budget.jsx`](../app/(onboarding)/budget.jsx)

**Type**: Multi-step (2 steps), uses `QuestionScreen` wrapper

**Steps**:

| Step | Key | Question | Input Type | Validation |
|------|-----|----------|------------|------------|
| 1 | `q14` | "How would you like to budget your remaining income?" | Flexible budget with expandable summary table | Amounts must not exceed available budget |
| 2 | `q14a` | "What happens to unspent money at the end of the month?" | OptionCard (rollover strategy) | Required |

**Step 1 — Flexible Budget**:

- Shows an **expandable summary table** with:
  - **Income breakdown**: Total monthly income from `pocketos_income`
  - **Fixed costs by category**: Housing, transport, health, children, pets, subscriptions, other costs
  - **Debt payments**: From `pocketos_debts`
  - **Available budget**: Calculated via `availableBudget()` utility
- Users can allocate remaining income into flexible budget categories
- Each category: `{ category: string, amount: number }`
- Expand/collapse all with animated heights

**Step 2 — Rollover Strategy**:

| Option | Key | Description |
|--------|-----|-------------|
| "Keep it all" | `free` | Unspent money rolls over to next month |
| "Keep some" | `capped` | Unspent money rolls over up to a cap (×2, ×3, or ×4 of monthly budget) |
| "Start fresh" | `reset` | Unspent money goes to savings, budget resets |

**Cap multiplier options** (if `capped`): ×2, ×3, ×4

**Progress**: 95% → 96%

**Data shape**:
```js
{
  flexibleBudget: [{ category: string, amount: number }],
  rolloverStrategy: 'free' | 'capped' | 'reset',
  capMultiplier: 2 | 3 | 4  // only if rolloverStrategy === 'capped'
}
```

**i18n keys**:
- `onboarding.budget.q14` → "How would you like to budget your remaining income?"
- `onboarding.budget.q14a` → "What happens to unspent money at the end of the month?"
- `onboarding.budget.incomeBreakdown` → "Income"
- `onboarding.budget.fixedCosts` → "Fixed costs"
- `onboarding.budget.debtPayments` → "Debt payments"
- `onboarding.budget.availableBudget` → "Available for flexible spending"
- `onboarding.budget.rollover.free` → "Keep it all — rolls over to next month"
- `onboarding.budget.rollover.capped` → "Keep some — up to a cap"
- `onboarding.budget.rollover.reset` → "Start fresh — unspent goes to savings"
- `onboarding.budget.capMultiplier` → "Cap multiplier"

**Components used**: Expandable table (custom with `Animated.View` height animations), `LabeledInput`, `OptionCard`

---

### 8.27 Splash: Review

**File**: [`app/(onboarding)/splash-review.jsx`](../app/(onboarding)/splash-review.jsx)

**Type**: Splash screen (uses `SplashScreen` wrapper)

**Section**: 13 — "Review"

**Navigation**: Back → `budget`, Forward → `review`

**Progress**: 96%

**Content**:
- Eyebrow: `onboarding.s13.eyebrow` → "Section 13"
- Heading: `onboarding.s13.heading` → "Review"
- Body: `onboarding.s13.body` → "Let's review everything you've entered before we finalize."
- CTA: `onboarding.s13.cta` → "Review my data"

**SVG**: Review/checklist illustration

---

### 8.28 Review

**File**: [`app/(onboarding)/review.jsx`](../app/(onboarding)/review.jsx)

**Type**: Single screen (standalone, custom layout)

**Purpose**: Final review of all entered data before completing onboarding.

**Layout**:
```
┌─────────────────────────────┐
│  ← (arrow)    CHAPTER       │  ← Top navbar
├─────────────────────────────┤
│  ██████████████████  100%   │  ← Progress bar
├─────────────────────────────┤
│                             │
│    Review Your Information  │  ← Title
│                             │
│  ┌─ Household ────────────┐ │
│  │ Type: Solo             │ │  ← Collapsible section
│  │ Children: None         │ │
│  └────────────────────────┘ │
│                             │
│  ┌─ Location ─────────────┐ │
│  │ Country: Czech Republic│ │
│  │ City: Prague           │ │
│  └────────────────────────┘ │
│                             │
│  ┌─ Income ───────────────┐ │
│  │ ...                    │ │
│  └────────────────────────┘ │
│        (all sections)       │
│                             │
│  ┌─────────────────────┐   │
│  │    Looks good        │   │  ← Primary CTA
│  └─────────────────────┘   │
│                             │
│  I'll finish this later     │  ← Secondary link
│                             │
└─────────────────────────────┘
```

**Collapsible sections**: One `ReviewSection` component per data category (household, location, occupation, income, housing, transport, health, children-costs, pets, subscriptions, other-costs, debts, budget).

**Data loading**: Loads all data from AsyncStorage using all storage keys.

**Actions**:
- "Looks good" → Sets `pocketos_onboarding.completed = true`, navigates to dashboard
- "I'll finish this later" → Sets `pocketos_onboarding.completed = true`, navigates to dashboard

**Progress**: 100%

**Data shape**:
```js
{
  completed: true
}
```

**i18n keys**:
- `onboarding.review.title` → "Review Your Information"
- `onboarding.review.looksGood` → "Looks good"
- `onboarding.review.finishLater` → "I'll finish this later"
- `onboarding.review.sections.household` → "Household"
- `onboarding.review.sections.location` → "Location"
- `onboarding.review.sections.occupation` → "Occupation"
- `onboarding.review.sections.income` → "Income"
- `onboarding.review.sections.housing` → "Housing"
- `onboarding.review.sections.transport` → "Transport"
- `onboarding.review.sections.health` → "Health Insurance"
- `onboarding.review.sections.childrenCosts` → "Children's Costs"
- `onboarding.review.sections.pets` → "Pets"
- `onboarding.review.sections.subscriptions` → "Subscriptions"
- `onboarding.review.sections.otherCosts` → "Other Costs"
- `onboarding.review.sections.debts` → "Debts"
- `onboarding.review.sections.budget` → "Budget"

**Components used**: `ReviewSection` (collapsible with expand/collapse toggle), `ScrollView`

---

## 9. Progress Tracking

### Progress Percentages by Screen

| Screen | Progress % | Cumulative |
|--------|-----------|------------|
| welcome | — | 0% |
| consent | — | 0% |
| household (step 1) | 10% | 10% |
| household (step 2) | 20% | 20% |
| household (step 3) | 30% | 30% |
| household (step 4) | 40% | 40% |
| household (step 5) | 50% | 50% |
| splash-location | 15% | 15% |
| location | 20% | 20% |
| occupation (step 1) | 30% | 30% |
| occupation (step 2) | 40% | 40% |
| splash-income | 35% | 35% |
| income (q5) | 45% | 45% |
| income (q5a) | 48% | 48% |
| income (q5b) | 50% | 50% |
| income (q5c) | 53% | 53% |
| income (q5d) | 55% | 55% |
| splash-housing | 55% | 55% |
| housing | 62% | 62% |
| splash-transport | 62% | 62% |
| transport | 70% | 70% |
| splash-health | 70% | 70% |
| health | 75% | 75% |
| splash-children | 75% | 75% |
| children-costs | 78% | 78% |
| splash-pets | 80% | 80% |
| pets (q10) | 80% | 80% |
| pets (q10a) | 83% | 83% |
| splash-subscriptions | 83% | 83% |
| subscriptions | 85% | 85% |
| splash-other-costs | 86% | 86% |
| other-costs | 88% | 88% |
| splash-debts | 90% | 90% |
| debts (q13) | 90% | 90% |
| debts (q13a) | 93% | 93% |
| splash-budget | 93% | 93% |
| budget (q14) | 95% | 95% |
| budget (q14a) | 96% | 96% |
| splash-review | 96% | 96% |
| review | 100% | 100% |

### Progress Bar Implementation

- **Track**: Full width, 3px height, `backgroundColor: '#E4E2DC'` (border color)
- **Fill**: Animated width percentage, `backgroundColor: '#1D3557'` (primary color)
- **Animation**: Uses `react-native-reanimated` `withTiming` for smooth width transitions
- **Label**: Below the bar, `fontSize: 11, fontWeight: '500', color: '#7A7770'`
- **Panel**: 44px total height (bar + label spacing)

---

## 10. Complete i18n Key Map

### Common Keys

| Key | EN Value |
|-----|----------|
| `common.continue` | "Continue" |
| `common.back` | "Back" |
| `common.skip` | "Skip for now" |
| `common.save` | "Save" |
| `common.cancel` | "Cancel" |
| `common.confirm` | "Confirm" |
| `common.done` | "Done" |
| `common.add` | "Add" |
| `common.remove` | "Remove" |
| `common.yes` | "Yes" |
| `common.no` | "No" |
| `common.other` | "Other" |
| `common.search` | "Search" |
| `common.loading` | "Loading..." |
| `common.frequencies.daily` | "Daily" |
| `common.frequencies.weekly` | "Weekly" |
| `common.frequencies.fortnightly` | "Fortnightly" |
| `common.frequencies.monthly` | "Monthly" |
| `common.frequencies.annual` | "Annual" |
| `common.frequencies.quarterly` | "Quarterly" |

### Onboarding Section Splash Keys

| Key | EN Value |
|-----|----------|
| `onboarding.s2.eyebrow` | "Section 2" |
| `onboarding.s2.heading` | "Location & Currency" |
| `onboarding.s2.body` | "Tell us where you're based so we can set the right currency and tailor suggestions to your region." |
| `onboarding.s2.cta` | "Set my location" |
| `onboarding.s3.eyebrow` | "Section 3" |
| `onboarding.s3.heading` | "Income & Savings" |
| `onboarding.s3.body` | "Now let's look at what's coming in." |
| `onboarding.s3.cta` | "Add my income" |
| `onboarding.s4.eyebrow` | "Section 4" |
| `onboarding.s4.heading` | "Housing" |
| `onboarding.s4.body` | "Let's look at your housing situation." |
| `onboarding.s4.cta` | "Add housing costs" |
| `onboarding.s5.eyebrow` | "Section 5" |
| `onboarding.s5.heading` | "Transport" |
| `onboarding.s5.body` | "Now let's look at your transport costs." |
| `onboarding.s5.cta` | "Add transport costs" |
| `onboarding.s6.eyebrow` | "Section 6" |
| `onboarding.s6.heading` | "Health Insurance" |
| `onboarding.s6.body` | "Let's look at your health insurance coverage." |
| `onboarding.s6.cta` | "Add health insurance" |
| `onboarding.s7.eyebrow` | "Section 7" |
| `onboarding.s7.heading` | "Children's Costs" |
| `onboarding.s7.body` | "Now let's look at costs related to your children." |
| `onboarding.s7.cta` | "Add children's costs" |
| `onboarding.s8.eyebrow` | "Section 8" |
| `onboarding.s8.heading` | "Pets" |
| `onboarding.s8.body` | "Do you have any pets? Let's add their costs." |
| `onboarding.s8.cta` | "Add pets" |
| `onboarding.s9.eyebrow` | "Section 9" |
| `onboarding.s9.heading` | "Subscriptions" |
| `onboarding.s9.body` | "Let's look at your monthly subscriptions." |
| `onboarding.s9.cta` | "Add subscriptions" |
| `onboarding.s10.eyebrow` | "Section 10" |
| `onboarding.s10.heading` | "Other Costs" |
| `onboarding.s10.body` | "Let's capture any other regular costs we haven't covered yet." |
| `onboarding.s10.cta` | "Add other costs" |
| `onboarding.s11.eyebrow` | "Section 11" |
| `onboarding.s11.heading` | "Debts" |
| `onboarding.s11.body` | "Let's look at any debts you may have." |
| `onboarding.s11.cta` | "Add debts" |
| `onboarding.s12.eyebrow` | "Section 12" |
| `onboarding.s12.heading` | "Budget" |
| `onboarding.s12.body` | "Now let's set up your budget." |
| `onboarding.s12.cta` | "Set up my budget" |
| `onboarding.s13.eyebrow` | "Section 13" |
| `onboarding.s13.heading` | "Review" |
| `onboarding.s13.body` | "Let's review everything you've entered before we finalize." |
| `onboarding.s13.cta` | "Review my data" |

### Progress Labels

| Key | EN Value |
|-----|----------|
| `onboarding.progress.step` | "Step {{current}} of {{total}}" |
| `onboarding.progress.complete` | "Complete!" |
| `onboarding.progress.section` | "Section {{number}}" |

---

> **End of Documentation**
>
> This document covers all 28 onboarding screens, their questions, options, validation rules, data models, navigation flow, progress tracking, design tokens, i18n keys, and financial utilities. Use this as a complete specification for UI generation.

