# E2E smoke tests (optional)

Web-only signup smoke using [Playwright](https://playwright.dev/). Not run in CI by default.

## Setup

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## Run

```bash
npm run web
# separate terminal:
E2E_BASE_URL=http://localhost:8081 npx playwright test
```

Set `E2E_BASE_URL` to a Vercel preview URL for staging checks.
