# AI cloud setup cookbook — Vertex Gemini + Supabase

Step-by-step guide to reproduce Beaverr’s **premium AI advice** backend from scratch. Use this when switching GCP accounts, regions, or LLM providers. The current test stack uses:

| Piece | Current test value |
|-------|-------------------|
| GCP project | `beaverr` |
| Vertex location | `eu` (EU multi-region) |
| Model | `gemini-3.1-flash-lite` |
| Supabase project | `beaverr` — `fetbfivnidpaxcsadnnb` (eu-west-1) |

---

## What you are building

```
Expo app  →  Supabase Edge Function (advice-generate)  →  Vertex EU Gemini
                ↑ JWT auth + Postgres cache
```

- **Client** sends `{ snapshot, triggered_rules, locale }` — no API keys in the app.
- **Edge Function** mints a **service-account Bearer token** and calls Vertex.
- **Local eval** (`npm run advice:eval`) uses the same Vertex endpoint via **ADC** (`gcloud auth application-default login`).

---

## Prerequisites

- [Google Cloud](https://console.cloud.google.com/) account with **billing enabled**
- [Supabase](https://supabase.com/) account
- [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed
- Node.js 20+ and this repo cloned
- **Do not use AI Studio API keys** if your org blocks them — use Vertex + service account (confirmed for Beaverr test org)

---

## Part 1 — Google Cloud project

### 1.1 Create or pick a project

1. Console → **IAM & Admin** → **Create project** (e.g. `beaverr-prod`).
2. Note the **Project ID** (not display name). Set locally:

```bash
gcloud config set project YOUR_PROJECT_ID
```

### 1.2 Enable billing

Billing must be linked or Vertex calls return permission/billing errors.

### 1.3 Enable Vertex AI API

```bash
gcloud services enable aiplatform.googleapis.com
```

Or: Console → **APIs & Services** → enable **Vertex AI API**.

### 1.4 Confirm model location

Beaverr uses the **EU multi-region** endpoint (GDPR jurisdiction):

```
https://aiplatform.eu.rep.googleapis.com/v1/projects/PROJECT_ID/locations/eu/publishers/google/models/gemini-3.1-flash-lite:generateContent
```

**Regional pitfall:** `europe-west4` returned **404** for this project; **`eu`** multi-region works. See [Google Gemini locations](https://cloud.google.com/gemini-enterprise-agent-platform/resources/locations).

---

## Part 2 — Local development auth (ADC)

For `npm run advice:eval` on your machine — **not** for production.

### 2.1 Log in with Application Default Credentials

**PowerShell / bash:**

```bash
gcloud auth application-default login --scopes=https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/userinfo.email,openid
```

Notes:

- Use `--scopes=` with an **equals sign** (not a space).
- If `gcloud.ps1` is blocked on Windows, use `gcloud.cmd` from the SDK `bin` folder.
- Your user account needs permission to call Vertex (e.g. **Vertex AI User** on the project).

### 2.2 Env for eval

Copy `.env.example` → `.env.local`:

```env
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
# Optional overrides:
# GEMINI_LOCATION=eu
# GEMINI_MODEL=gemini-3.1-flash-lite
```

### 2.3 Run eval harness

```bash
npm run advice:eval
```

Expect **Mechanical PASS** and **Qualitative PASS** on all fixtures. Failures:

| Symptom | Fix |
|---------|-----|
| `ACCESS_TOKEN_SCOPE_INSUFFICIENT` on `generativelanguage.googleapis.com` | Wrong host — must use **Vertex** URL, not AI Studio |
| 403 / permission denied | Grant your user **Vertex AI User** (`roles/aiplatform.user`) |
| 404 on model | Switch location to `eu` multi-region |

---

## Part 3 — Service account for Supabase Edge

Production Edge Functions cannot use your laptop ADC. Use a **service account JSON key**.

### 3.1 Create service account

1. Console → **IAM & Admin** → **Service accounts** → **Create**
2. Name: e.g. `beaverr-advice-edge`
3. **Create and continue**

### 3.2 Grant IAM role

Add role: **Vertex AI User** (`roles/aiplatform.user`).

Broader dev-only alternative: Vertex AI Administrator — avoid in production.

### 3.3 Create JSON key

1. Service account → **Keys** → **Add key** → **JSON**
2. Download the file — **store securely**, never commit to git

### 3.4 Quick local token test (optional)

**PowerShell:**

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\key.json"
node -e "const {GoogleAuth}=require('google-auth-library');(async()=>{const c=new GoogleAuth({scopes:['https://www.googleapis.com/auth/cloud-platform']});const t=await c.getAccessToken();console.log(t?'token ok':'fail')})()"
```

---

## Part 4 — Supabase project

### 4.1 Create project

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project**
2. Pick region close to users (Beaverr test: **eu-west-1**)
3. Save **Project URL** and **anon public key**

### 4.2 Link CLI (optional)

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

Project ref is in Dashboard → **Settings** → **General**.

### 4.3 Apply database migration

Migration file: `supabase/migrations/20260624180000_advice_tables.sql`

Tables: `advice_runs`, `advice_cache`, `knowledge_chunks` + RLS.

```bash
npx supabase db push
```

Or paste SQL into Dashboard → **SQL Editor**.

### 4.4 Set Edge Function secrets

Dashboard → **Edge Functions** → **Secrets** (or CLI):

```bash
npx supabase secrets set GCP_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

Optional:

```bash
npx supabase secrets set GCP_PROJECT_ID=YOUR_PROJECT_ID
npx supabase secrets set GEMINI_LOCATION=eu
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

### 4.5 Deploy Edge Function

```bash
npx supabase functions deploy advice-generate
```

Config: `verify_jwt = true` — callers must send a **user JWT**, not anon key alone.

---

## Part 5 — Test user and curl

### 5.1 Create auth user

Dashboard → **Authentication** → **Users** → **Add user** (email + password).

### 5.2 Get session JWT

```bash
curl -s -X POST "https://YOUR_PROJECT_REF.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"your-password"}'
```

Copy `access_token` from the response.

### 5.3 Invoke advice-generate

```bash
curl -s -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/advice-generate" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d @lib/advice/__evals__/fixtures/tight_single_income_cs.json
```

Send body fields: `snapshot`, `triggered_rules`, `locale` (fixture JSON includes them).

**Expected:** `{"status":"ok","narrative":{...},"cached":false,"run_id":"..."}`

**Empty rules:** `{"status":"skipped","reason":"no_rules"}` — no LLM call.

| HTTP | Cause |
|------|-------|
| 401 | Missing or expired JWT |
| 500 `server_misconfigured` | `GCP_SERVICE_ACCOUNT_JSON` secret missing |
| 500 `gcp_auth_failed` | Invalid SA JSON or wrong IAM role |
| 502 `invalid_llm_response` | Model/prompt issue — check `advice_runs` table |

---

## Part 6 — Expo app env

In `.env.local` (gitignored):

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Restart Metro after changing env vars.

Client code:

- `lib/supabase.js` — Supabase client
- `lib/advice/buildFinancialSnapshot.js` — privacy-safe snapshot
- `lib/advice/evaluateAdviceRules.js` — rule engine
- `lib/advice/requestAdvice.js` — `supabase.functions.invoke('advice-generate')`
- `components/dashboard/AdviceNarrativePanel.jsx` — dashboard UI

User must **sign in** (Supabase Auth) and accept **`beaverr_ai_consent`** before the app calls the Edge Function.

---

## Part 7 — Switching GCP account or provider

### New GCP project (same architecture)

1. New project + billing + enable Vertex AI API
2. Confirm model availability at target `location` (`eu` recommended)
3. New service account + `roles/aiplatform.user` + JSON key
4. Update Supabase secret `GCP_SERVICE_ACCOUNT_JSON`
5. Optionally set `GCP_PROJECT_ID` / `GEMINI_LOCATION` secrets
6. Redeploy: `npx supabase functions deploy advice-generate`
7. Re-run curl test + `npm run advice:eval` with new `GOOGLE_CLOUD_PROJECT`

### New Supabase project

1. Create project, run migration, set secrets, deploy function
2. Update `EXPO_PUBLIC_SUPABASE_*` in app env
3. Recreate test users; `advice_cache` does not migrate

### Different LLM provider (non-Google)

1. Replace `supabase/functions/_shared/gemini.ts` and auth module with provider client
2. Update `lib/advice/constants.js` model id and URL builder
3. Update eval script `scripts/run-advice-evals.mjs`
4. Keep `buildLlmRequest` / `parseLlmResponse` contract stable so client + tests stay valid
5. Document new secrets naming in this file

---

## Part 8 — Operations checklist

| Task | Command / location |
|------|-------------------|
| Deploy function | `npx supabase functions deploy advice-generate` |
| View function logs | Supabase Dashboard → Edge Functions → advice-generate → Logs |
| Audit LLM runs | `advice_runs` table |
| Clear stale cache | Delete rows from `advice_cache` for a user |
| Rotate SA key | Create new key → update secret → delete old key in GCP |
| Local eval | `npm run advice:eval` |

---

## Part 9 — Security reminders

- Never commit service account JSON or `.env.local`
- Never ship `GEMINI_API_KEY` in the Expo app
- Edge Function holds GCP credentials; app only holds Supabase anon key + user JWT
- Snapshot JSON must exclude PII (names, addresses, custom labels) — see `docs/AI-INTEGRATION-PLAN.md` §5
- Production still needs **RevenueCat premium gate** (planned) server-side

---

## Related docs

- `docs/AI-INTEGRATION-PLAN.md` — product architecture and phases
- `supabase/README.md` — short reference
- `docs/eval-fixture-spec.md` — eval fixture format
- `.env.example` — all env var names
