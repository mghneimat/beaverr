# Supabase — Beaverr AI backend

Linked project: **beaverr** (`eu-west-1`) — `https://fetbfivnidpaxcsadnnb.supabase.co`

## Schema

Migrations:

- `migrations/20260624180000_advice_tables.sql` — AI audit/cache
- `migrations/20260625120000_households_and_sync.sql` — `profiles`, `households`, `household_data` + sign-up trigger
- `migrations/20260625140000_profiles_username.sql` — unique `profiles.username` + `is_username_available` RPC (required for sign-up username check)
- `migrations/20260626120000_delete_own_account.sql` — `delete_own_account()` RPC for account deletion from settings
- `migrations/20260626140000_fix_delete_own_account.sql` — fixes RPC owner/grants on Supabase hosted
- `migrations/20260630120000_advice_chat.sql` — `advice_threads`, `advice_messages`, `advice_chat_runs` for coach chat
- `migrations/20260701100000_admin_foundation.sql` — `profiles.role`, `is_admin()`, `admin_audit_log`
- `migrations/20260701110000_app_error_events.sql` — client error telemetry
- `migrations/20260701120000_knowledge_cms.sql` — knowledge CMS tables + routing seed

`household_data.data` stores a JSON blob of `beaverr_*` storage keys for cloud sync.

### Delete account (settings → Privacy & data)

Account deletion uses **RPC `delete_own_account`** with fallback to Edge Function **`delete-account`** (Admin API).

1. Run migrations in **Supabase → SQL Editor** (at minimum `20260626120000` + `20260626140000`), or:

```bash
npx supabase link --project-ref fetbfivnidpaxcsadnnb
npx supabase db push
```

2. Deploy the Edge Function (recommended — works even if RPC permissions fail):

```bash
npx supabase functions deploy delete-account
```

### Sign-up username check

1. Run `20260625140000_profiles_username.sql` in **Supabase → SQL Editor** (or `npx supabase db push` after `supabase link`).
2. Optional fallback: deploy Edge Function `username-check` (`verify_jwt = false`) if RPC is unavailable:

```bash
npx supabase functions deploy username-check
```

### advice tables

- `advice_runs` — audit log (tokens, status, rule ids)
- `advice_cache` — per-user cache keyed by snapshot hash + locale + model + prompt version
- `knowledge_chunks` — curated KB excerpts (Phase 4 seed data)
- `advice_threads` / `advice_messages` — multi-turn coach chat per tab session
- `advice_chat_runs` — chat token audit + daily rate-limit counting

RLS: authenticated users can **read** their own runs/cache/threads/messages; writes go through the Edge Function (service role).

## Edge Function: `advice-generate`

- JWT required (`verify_jwt = true`)
- Skips LLM when `triggered_rules` is empty
- Cache lookup → **Vertex EU Gemini** → validate → persist

### Gemini endpoint (production)

```
POST https://aiplatform.eu.rep.googleapis.com/v1/projects/beaverr/locations/eu/publishers/google/models/gemini-3.1-flash-lite:generateContent
```

Auth: `Authorization: Bearer <service-account-access-token>` (minted inside the function).

See [Google locations doc](https://docs.cloud.google.com/gemini-enterprise-agent-platform/resources/locations).

### Secrets (Dashboard → Edge Functions → Secrets)

| Secret | Required | Description |
|--------|----------|-------------|
| `GCP_SERVICE_ACCOUNT_JSON` | **Yes** | Full JSON key for a GCP service account with Vertex AI / `cloud-platform` scope |
| `GCP_PROJECT_ID` | No | Defaults to `beaverr` |
| `GEMINI_LOCATION` | No | Defaults to `eu` (EU multi-region) |

**Do not use `GEMINI_API_KEY`** — org policy blocks API keys; use service account instead.

#### Create service account (GCP Console)

1. IAM → Service Accounts → Create (e.g. `beaverr-advice-edge`)
2. Role: **Vertex AI User** (or broader **Vertex AI Administrator** for dev)
3. Keys → Add key → JSON → paste entire file into `GCP_SERVICE_ACCOUNT_JSON` secret

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## Edge Function: `advice-chat`

- JWT required (`verify_jwt = true`)
- Multi-turn follow-up Q&A from dashboard insight cards
- Client sends tab snapshot + `kb_chunks` (book + country official pack); server persists threads/messages
- Plain-text Gemini reply; official URLs returned in `sources[]` for UI links (not in model prose)
- Limits: 1 000 chars/message, 30 messages/thread, 40 user messages/day (UTC)

Deploy:

```bash
npx supabase db push
npx supabase functions deploy advice-chat
```

Same `GCP_SERVICE_ACCOUNT_JSON` secret as `advice-generate`.

## Edge Function: `admin-api`

- JWT required; caller must have `profiles.role = 'admin'`
- Single dispatch: `{ action, payload }` — stats, users, errors, knowledge CMS
- See [docs/ADMIN-DASHBOARD.md](../docs/ADMIN-DASHBOARD.md)

Deploy:

```bash
npx supabase functions deploy admin-api
```

Bootstrap first admin in SQL:

```sql
update public.profiles set role = 'admin' where id = '<your-uuid>';
```

## Edge Function: `log-error`

- Accepts client error reports (auth optional)
- Inserts into `app_error_events` via service role

```bash
npx supabase functions deploy log-error
```

## Local eval (Vertex, same model)

```bash
gcloud auth application-default login --scopes=https://www.googleapis.com/auth/cloud-platform,openid
npm run advice:eval
```

Uses ADC via `google-auth-library` — same Vertex EU endpoint as production.

## Local CLI (optional)

```bash
npx supabase link --project-ref fetbfivnidpaxcsadnnb
npx supabase functions deploy advice-generate
npx supabase secrets set GCP_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

## App env (`.env.local`)

```
EXPO_PUBLIC_SUPABASE_URL=https://fetbfivnidpaxcsadnnb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>
GOOGLE_CLOUD_PROJECT=beaverr
```

### OAuth redirect URLs (Google sign-in)

Dashboard → **Authentication** → **URL configuration** for project `fetbfivnidpaxcsadnnb`:

| Setting | Value |
|---------|--------|
| **Site URL** | `https://beaverr.vercel.app` |
| **Redirect URLs** | `https://beaverr.vercel.app/auth/callback`, `http://localhost:8081/auth/callback`, `beaverr://auth/callback` |

If Vercel/mobile users are sent to `localhost:8081` after Google, the production callback is missing from **Redirect URLs** (Supabase falls back to Site URL). See `docs/OAUTH-SETUP-COOKBOOK.md`.

## Related docs

- **[AI cloud setup cookbook](../docs/AI-CLOUD-SETUP-COOKBOOK.md)** — full reproducible GCP + Supabase setup
- `docs/AI-INTEGRATION-PLAN.md` — product architecture and phases

Client helpers: `lib/supabase.js`, `lib/advice/requestAdvice.js`, `lib/advice/fetchHouseholdAdvice.js`, `components/dashboard/AdviceNarrativePanel.jsx`.
