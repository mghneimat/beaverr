# Supabase — Beaverr backend

Linked project: **beaverr** (`eu-west-1`) — `https://fetbfivnidpaxcsadnnb.supabase.co`

## Schema

Migrations:

- `migrations/20260625120000_households_and_sync.sql` — `profiles`, `households`, `household_data` + sign-up trigger
- `migrations/20260625140000_profiles_username.sql` — unique `profiles.username` + `is_username_available` RPC (required for sign-up username check)
- `migrations/20260626120000_delete_own_account.sql` — `delete_own_account()` RPC for account deletion from settings
- `migrations/20260626140000_fix_delete_own_account.sql` — fixes RPC owner/grants on Supabase hosted
- `migrations/20260701100000_admin_foundation.sql` — `profiles.role`, `is_admin()`, `admin_audit_log`
- `migrations/20260701110000_app_error_events.sql` — client error telemetry
- `migrations/20260709120000_drop_ai_tables.sql` — removes legacy AI advice/chat/knowledge tables
- `migrations/20260709130000_drop_saltedge_tables.sql` — removes Salt Edge open banking tables

Historical AI and Salt Edge migrations remain in the repo for audit only.

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

## Edge Function: `admin-api`

- JWT required; caller must have `profiles.role = 'admin'`
- Single dispatch: `{ action, payload }` — stats, users, errors
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

- Accepts client error reports (JWT optional; anonymous limited to auth/onboarding/ui/unknown)
- Per-IP rate limit: 60/min authenticated, 10/min anonymous
- Optional `LOG_ERROR_INGEST_KEY` header for trusted batch ingest
- Inserts into `app_error_events` via service role

```bash
npx supabase functions deploy log-error
```

## Ops after feature removals

On the hosted project:

1. Delete retired functions if still deployed: `advice-generate`, `advice-chat`, `saltedge-*`
2. **Delete orphaned secrets** in Dashboard → Edge Functions → Secrets:
   - `GCP_SERVICE_ACCOUNT_JSON` (no AI functions remain)
   - `SALTEDGE_*` (never used on hosted; remove if present)

### Secret rotation policy

- Rotate immediately if TruffleHog or manual review finds a verified secret in git history, Slack, or screenshots
- Review Dashboard secrets quarterly (every 90 days)
- Record rotation dates in this file or `docs/security-audit-notes.md`

### Migration history repair

If drop migrations were applied remotely with different version IDs:

```bash
npx supabase link --project-ref fetbfivnidpaxcsadnnb
npx supabase migration repair --status applied 20260709120000
npx supabase migration repair --status applied 20260709130000
npx supabase migration repair --status reverted 20260709144441 20260709144444
npx supabase db push --dry-run
```

## Related docs

- **[Admin dashboard](../docs/ADMIN-DASHBOARD.md)** — stats, users, errors
- **[Security audit notes](../docs/security-audit-notes.md)** — IDOR checklist, rate limits, CI

Client helpers: `lib/supabase.js`, `lib/insights.js` (local tab insights).

## App env (`.env.local`)

```
EXPO_PUBLIC_SUPABASE_URL=https://fetbfivnidpaxcsadnnb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>
```

### OAuth redirect URLs (Google sign-in)

Dashboard → **Authentication** → **URL configuration** for project `fetbfivnidpaxcsadnnb`:

| Setting | Value |
|---------|--------|
| **Site URL** | `https://beaverr.vercel.app` |
| **Redirect URLs** | `https://beaverr.vercel.app/auth/callback`, `http://localhost:8081/auth/callback`, `beaverr://auth/callback` |

If Vercel/mobile users are sent to `localhost:8081` after Google, the production callback is missing from **Redirect URLs** (Supabase falls back to Site URL). See `docs/OAUTH-SETUP-COOKBOOK.md`.
