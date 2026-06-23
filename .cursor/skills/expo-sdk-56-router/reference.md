# Expo SDK 56 + Router — Reference

## Official documentation index

| Topic | URL |
|-------|-----|
| SDK 56 reference | https://docs.expo.dev/versions/v56.0.0/ |
| Router introduction | https://docs.expo.dev/router/introduction/ |
| Core concepts | https://docs.expo.dev/router/basics/core-concepts/ |
| Stack navigator | https://docs.expo.dev/router/advanced/stack/ |
| Tabs navigator | https://docs.expo.dev/router/advanced/tabs/ |
| Typed routes | https://docs.expo.dev/router/reference/typed-routes/ |
| Router API | https://docs.expo.dev/router/reference/router/ |

## SDK 56 platform matrix

| | SDK 56 |
|---|--------|
| React Native | 0.85 |
| React | 19.2.3 |
| React Native Web | 0.21.0 |
| Node.js (min) | 22.13.x |
| Android compileSdk | 36 |
| iOS minimum | 16.4+ |
| Xcode | 26.4+ |

## Project config files

| File | Role |
|------|------|
| `package.json` → `main` | `expo-router/entry` — bootstraps router |
| `app.json` → `plugins` | `expo-router` plugin |
| `app.json` → `experiments.typedRoutes` | Enables generated route types |
| `app.json` → `scheme` | Deep link scheme (`beaverr`) |
| `babel.config.js` | `babel-preset-expo` (+ NativeWind in this project) |
| `metro.config.js` | `expo/metro-config` (+ NativeWind wrapper) |

## Beaverr onboarding flow (registered order)

From `app/(onboarding)/_layout.jsx`:

| # | Route file | Type |
|---|------------|------|
| 1 | `welcome` | entry |
| 2 | `consent` | question |
| 3 | `household` | question |
| 4 | `splash-location` → `location` → `occupation` | splash + questions |
| 5 | `splash-income` → `income` | |
| 6 | `splash-housing` → `housing` | |
| 7 | `splash-transport` → `transport` | |
| 8 | `splash-health` → `health` | |
| 9 | `splash-children` → `children-costs` | |
| 10 | `splash-pets` → `pets` | |
| 11 | `splash-subscriptions` → `subscriptions` | |
| 12 | `splash-other-costs` → `other-costs` | |
| 13 | `splash-debts` → `debts` | |
| 14 | `splash-budget` → `budget` | |
| 15 | `splash-review` → `review` | completion |

## App tabs

| Tab route | i18n label key | Notes |
|-----------|----------------|-------|
| `dashboard` | `dashboard.title` | Default post-onboarding |
| `income` | `dashboard.income` | |
| `costs` | `dashboard.costs` | |
| `budget` | `dashboard.budget` | |
| `goals` | `dashboard.goals` | |
| `summary` | `dashboard.summary` | |
| `alerts` | `dashboard.alerts` | Hidden from tab bar (`href: null`) |

## Launch routing (`app/index.jsx`)

```
getData('beaverr_onboarding')
  ├─ completed === true  → router.replace('/(app)/dashboard')
  └─ else / error        → router.replace('/(onboarding)/welcome')
```

## Route notation cheat sheet

| File path | URL path | Navigate to |
|-----------|----------|-------------|
| `app/index.jsx` | `/` | — (redirect only) |
| `app/(onboarding)/welcome.jsx` | `/welcome` | `/(onboarding)/welcome` |
| `app/(app)/dashboard.jsx` | `/dashboard` | `/(app)/dashboard` |

Groups `(onboarding)` and `(app)` do not appear in the URL segment but **must** appear in `href` / `router.*` paths.

## Expo Router hooks

| Hook | Returns | Use |
|------|---------|-----|
| `useRouter()` | `{ push, replace, back, … }` | Imperative navigation |
| `useSegments()` | `string[]` | Current path segments (tab detection) |
| `useLocalSearchParams()` | params object | Query / dynamic route params |
| `usePathname()` | string | Current pathname |
| `useGlobalSearchParams()` | params | Params from any segment |
| `Link` | component | Declarative navigation |

## Installing Expo Router (greenfield / migration)

```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar
```

Set `"main": "expo-router/entry"`, add `"expo-router"` to `plugins`, create `app/_layout.jsx` + `app/index.jsx`.

## When to use push vs replace vs back

| Scenario | Choice |
|----------|--------|
| Linear onboarding forward | `replace` |
| Optional drill-in (settings detail) | `push` |
| Tab switch | `push` (Beaverr pattern) |
| Reset to root after auth/logout | `replace` |
| Generic back button | `back()` or explicit `replace` to known prior step |

Beaverr onboarding uses **explicit `replace` targets** on splash/question back buttons for predictable flow — not only `router.back()`.
