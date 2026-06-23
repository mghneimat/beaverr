# Beaverr — Phase 1, Increment 1

A household financial clarity tool built with Expo + React Native + NativeWind.

## What's Been Built (Increment 1)

✅ **Project Foundation**
- Expo project with React Native Web support
- NativeWind (Tailwind CSS for React Native) configured
- Design system with color tokens, typography, and spacing
- Babel configuration for NativeWind

✅ **i18n System**
- Translation helper with EN and CS language support
- Context provider for language switching
- Interpolation support for dynamic strings

✅ **Storage Layer**
- Abstraction for localStorage (web) and AsyncStorage (native)
- Type-safe data access with JSDoc schemas

✅ **Finance Utilities**
- `toMonthly()` - Convert any frequency to monthly equivalent
- `dailyAllowance()` - Calculate daily spending budget
- `debtPayoff()` - Calculate debt payoff timeline with interest
- `formatCurrency()` - Format amounts as "12 500 Kč"
- `totalMonthlyCosts()` - Sum costs from array
- `availableBudget()` - Calculate available spending after fixed costs

✅ **Routing & Navigation**
- Launch routing: checks onboarding status and redirects appropriately
- Onboarding flow with welcome screen
- Dashboard with 5-tab navigation (Dashboard, Costs, Budget, Alerts, Summary)
- Language toggle (EN/CS)
- "Redo Setup" functionality

✅ **Design System**
- All color tokens defined in Tailwind config
- Inline SVG illustrations using design token colors
- Responsive layout foundation

✅ **Testing**
- Unit tests for i18n system (translation, interpolation)
- Unit tests for all finance utility functions
- Jest configuration with React Native preset

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

```bash
cd C:\Users\momen\beaverr
npm install
```

### Running the App

**Web:**
```bash
npm run web
```

**iOS (requires macOS):**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

### Running Tests

```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

## Project Structure

```
beaverr/
├── app/                          # Expo Router screens
│   ├── (onboarding)/            # Onboarding flow
│   │   ├── _layout.jsx
│   │   └── welcome.jsx
│   ├── (app)/                   # Main app (post-onboarding)
│   │   ├── _layout.jsx          # Tab navigation
│   │   ├── dashboard.jsx
│   │   ├── costs.jsx
│   │   ├── budget.jsx
│   │   ├── alerts.jsx
│   │   └── summary.jsx
│   └── _layout.jsx              # Root layout with routing logic
├── lib/                         # Core utilities
│   ├── i18n.js                  # Translation system
│   ├── storage.js               # Storage abstraction
│   ├── finance.js               # Financial calculations
│   ├── schema.js                # JSDoc type definitions
│   └── locales/
│       ├── en.json
│       └── cs.json
├── constants/
│   └── colors.js                # Design token exports
├── __tests__/                   # Test files
│   └── lib/
│       ├── i18n.test.js
│       └── finance.test.js
├── tailwind.config.js           # NativeWind configuration
├── babel.config.js              # Babel + NativeWind setup
├── global.css                   # Global styles for web
├── jest.config.js               # Jest configuration
├── CHANGELOG.md                 # Auto-maintained changelog
└── package.json
```

## Key Features

### Launch Routing
On app load, the root layout checks `beaverr_onboarding` in localStorage:
- If `completed: false` or missing → redirect to welcome screen
- If `completed: true` → redirect to dashboard

### Language Switching
Tap the language badge (EN/CS) in the dashboard header to switch languages. The selection is persisted to localStorage.

### Redo Setup
Click "Redo Setup" on the dashboard to reset onboarding status and return to the welcome screen.

## Design System

### Colors
All colors are defined in `tailwind.config.js` and `constants/colors.js`:
- Primary: Indigo (#4F46E5)
- Positive: Green (#22C55E)
- Warning: Amber (#F59E0B)
- Danger: Red (#EF4444)
- Debt: Purple (#7C3AED) - always purple for debt-related elements

### Typography
- Display: 32px, bold (splash headings)
- Section: 24px, semibold (question titles)
- Body: 16px, regular (helper text)
- Caption: 13px, regular (muted labels)

### Currency Formatting
Always: `12 500 Kč` (space as thousands separator, Kč suffix, integer amounts)

## Next Steps (Future Increments)

- Complete onboarding wizard (Q1-Q15)
- Implement dashboard data visualization
- Add cost tracking screens
- Build budget management
- Create alert system
- Implement data persistence for all onboarding data

## Engineering Principles

This project follows:
- **KISS** - Keep It Simple, Stupid
- **DRY** - Don't Repeat Yourself
- **SOLID** principles
- **Separation of Concerns**
- **YAGNI** - You Aren't Gonna Need It

See `beaverr-project-plan.md` for full architectural details.
