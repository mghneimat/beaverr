---
name: expo-sdk-56-router
description: >-
  Builds and navigates Expo SDK 56 apps with Expo Router — file-based routes,
  Stack/Tabs layouts, typed routes, deep links, and Beaverr routing conventions.
  MUST apply when adding or editing screens, routes, layouts, navigation, deep
  links, app entry, tabs, or Expo config — even if the user does not mention
  Expo Router, SDK 56, or file-based routing.
---

# Expo SDK 56 + Expo Router — Beaverr

Beaverr is an **Expo SDK 56** app using **Expo Router** (file-based routing). Routes live under `app/`; navigation uses `expo-router` hooks and layouts.

**Versioned docs (read before writing Expo/Router code):** https://docs.expo.dev/versions/v56.0.0/

**Router docs:** https://docs.expo.dev/router/introduction/

**Companion skills:** `custom-i18n` (all UI copy) · `custom-storage` (persist + launch routing) · `react-native-reanimated-v4` · `nativewind-v4` · `gluestack-ui-rn-v3`

## Stack versions (this project)

| Package | Version |
|---------|---------|
| `expo` | ~56.0.x |
| `expo-router` | ~56.2.x |
| `react-native` | 0.85.x |
| `react` | 19.2.x |
| Entry | `"main": "expo-router/entry"` in `package.json` |

Install Expo packages with `npx expo install <pkg>` — never hand-pick versions.

## Before writing code

1. **Read versioned docs** — SDK 56 APIs differ from older SDKs; do not assume SDK 54/55 patterns.
2. **Inspect `app/` tree** — routes are files; groups are `(name)` directories.
3. **Check existing navigation** — grep `useRouter`, `router.push`, `router.replace` in similar screens.
4. **Register new routes** — add `<Stack.Screen name="…" />` or `<Tabs.Screen name="…" />` in the group's `_layout.jsx`.
5. **Cross-skill tasks** — new screens need i18n keys + storage schema in the same pass.

## File-based routing rules

| Rule | Detail |
|------|--------|
| Route = file | `app/(onboarding)/housing.jsx` → `/(onboarding)/housing` |
| `_layout.jsx` | Defines navigator (Stack, Tabs) for that directory; not a page |
| Route groups `(…)` | Parentheses omit segment from URL — use for onboarding vs app shells |
| `index.jsx` | Default route for a directory (`app/index.jsx` → `/`) |
| Non-routes | Components, hooks, lib → **outside** `app/` (`components/`, `lib/`, …) |
| Typed routes | `app.json` → `experiments.typedRoutes: true` — use valid path strings |

**Beaverr uses `app/` at project root** (not `src/app/`). Both are valid; match this repo.

## Beaverr route map

```
app/
├── _layout.jsx          # Root Stack — fonts, splash, Gluestack, I18nProvider
├── index.jsx            # Launch redirect (onboarding vs dashboard)
├── (onboarding)/
│   ├── _layout.jsx      # Onboarding Stack (explicit Stack.Screen list)
│   ├── welcome.jsx
│   ├── splash-<section>.jsx
│   └── <section>.jsx
└── (app)/
    ├── _layout.jsx      # Tabs + custom tab bar + header
    ├── dashboard.jsx
    ├── income.jsx | costs.jsx | budget.jsx | goals.jsx | summary.jsx
    └── alerts.jsx       # Hidden tab (href: null)
```

### Onboarding naming convention

- `splash-<section>` — full-screen section intro (e.g. `splash-housing`)
- `<section>` — question screen(s) (e.g. `housing`, `children-costs`)
- Semantic names — **not** numbered splashes; reordering does not rename downstream files
- Register every new screen in `app/(onboarding)/_layout.jsx` in flow order

## Navigation API

```jsx
import { useRouter, useSegments, useLocalSearchParams, Link } from 'expo-router';

const router = useRouter();
```

| Action | Method | Beaverr usage |
|--------|--------|----------------|
| Forward (stack) | `router.push('/(onboarding)/consent')` | Welcome → consent |
| Replace (no back) | `router.replace('/(onboarding)/splash-budget')` | Onboarding step advance |
| Go back | `router.back()` | Default back in `SplashScreen` |
| Tab switch | `router.push('/(app)/dashboard')` | Custom tab bar |
| Launch gate | `router.replace` in `app/index.jsx` | After async storage check |

**Prefer `replace` for linear onboarding** — prevents users stacking the full flow on the back stack.

**Always use group prefixes** — `/(onboarding)/housing`, `/(app)/budget` (not `/housing`).

### Params and links

```jsx
// Query params
router.push({ pathname: '/(app)/alerts', params: { id: '123' } });
const { id } = useLocalSearchParams();

// Declarative
<Link href="/(onboarding)/welcome">Start</Link>
```

## Layout patterns

### Root (`app/_layout.jsx`)

- `SplashScreen.preventAutoHideAsync()` until fonts load
- Wrap app providers here (Gluestack, I18n) — not in individual screens
- Root `Stack` with `headerShown: false`; child groups registered explicitly

### Onboarding Stack

- Single `Stack`, no headers
- Explicit `<Stack.Screen name="…" />` list documents flow order
- Splash screens delegate `onContinue` / `onBack` to `router.replace`

### App Tabs

- `Tabs` with custom `tabBar` render prop
- `useSegments()` for active tab + header title
- Hide routes from tab bar: `options={{ href: null }}` (see `alerts`)

## Workflows

### Add onboarding screen

```
Task Progress:
- [ ] Create app/(onboarding)/<name>.jsx (default export)
- [ ] Add <Stack.Screen name="<name>" /> to (onboarding)/_layout.jsx in flow position
- [ ] Wire navigation: replace on continue, replace/back on back
- [ ] Add i18n keys (onboarding.<name>.*)
- [ ] Add storage key + schema if screen persists data
- [ ] Update prior screen's continue target and next screen's back target
```

### Add app tab screen

```
Task Progress:
- [ ] Create app/(app)/<name>.jsx
- [ ] Add to TABS array + <Tabs.Screen /> in (app)/_layout.jsx
- [ ] Add dashboard.* i18n keys for tab label + header
- [ ] Use router.push('/(app)/<name>') in tab bar
```

### Add hidden / modal route

- Add file under appropriate group
- Register in `_layout.jsx`
- For tabs: `href: null` to exclude from tab bar
- Navigate via `router.push` from menu or deep link

## Expo config essentials

`app.json` / `app.config.js`:

```json
{
  "expo": {
    "scheme": "beaverr",
    "plugins": ["expo-router"],
    "experiments": { "typedRoutes": true }
  }
}
```

Deep links: `beaverr://(app)/dashboard` — scheme + route path.

## SDK 56 specifics

| Topic | Guidance |
|-------|----------|
| New Architecture | Default in SDK 56 — required for Reanimated 4 |
| `npx expo install` | Aligns native module versions to SDK 56 |
| `npx expo start --clear` | After router structure changes or native dep bumps |
| Web | `app.json` → `web.bundler: "metro"`; static output supported |
| Node | Minimum 22.13.x for SDK 56 |
| create-expo-app | Use `--template default@sdk-56` for new projects |

## Anti-patterns

- Putting reusable components inside `app/` (they become routes)
- `router.push` for onboarding linear steps (stack pollution — use `replace`)
- Omitting `_layout.jsx` registration (route exists but may not be ordered/configured)
- Hardcoded navigation strings without group prefix
- Using React Navigation navigators directly instead of Expo Router layouts
- Guessing SDK 54/55 APIs — verify against v56.0.0 docs
- Creating `App.js` entry — entry is `expo-router/entry`

## Additional resources

- Beaverr route inventory + navigation graph: [reference.md](reference.md)
- Copy-paste screen/layout examples: [examples.md](examples.md)
