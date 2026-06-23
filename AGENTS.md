# Beaverr

Household financial clarity app. Local repo folder: `beaverr` (`C:\Users\momen\beaverr`).

# Expo SDK 56 + Router

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code. For routing, layouts, navigation, and new screens, follow `.cursor/skills/expo-sdk-56-router/SKILL.md`.

# i18n

All user-facing text uses the custom i18n system (`lib/i18n.js`, `lib/locales/en.json`, `lib/locales/cs.json`). When adding or changing UI copy, **automatically** add EN+CS keys and wire `useI18n()` — never hardcode strings, never wait to be asked. See `.cursor/skills/custom-i18n/SKILL.md`.

## Design Context

Strategic and visual specs live at the project root. Read both before UI work:

- **PRODUCT.md** — register (`product`), users (household budgeters, EN/CS), brand personality (clear, trustworthy, practical), anti-references, strategic principles
- **DESIGN.md** — tokens, typography, components; canonical source `constants/onboarding-theme.js`

North star: **"The Household Ledger"** — calm navy-on-paper finance UI, restrained accent use, one decision per onboarding screen.
