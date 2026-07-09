# Security audit notes

Last updated: 2026-07-09

Reference: [security-hardening-and-cleanup-plan.md](./security-hardening-and-cleanup-plan.md)

## 1.1 Secrets

| Item | Status | Notes |
|------|--------|-------|
| `.env.example` has no real keys | Pass | Anon key placeholder empty |
| `GCP_SERVICE_ACCOUNT_JSON` on hosted | **Action required** | Delete in Dashboard → Edge Functions → Secrets (orphaned after AI removal) |
| Git history scan | CI | TruffleHog runs on every PR via `.github/workflows/security.yml` |
| Local history scan (2026-07-09) | Skipped | Docker not running locally; run when Docker available or rely on CI |
| Dependabot npm alerts (2026-07-09) | Resolved | `npm overrides`: xlsx→@e965/xlsx@0.20.3, uuid→^11.1.1, js-yaml→^4.2.0; removed direct `xlsx` dep (export-only via xlsx-js-style) |
| Rotation policy | — | Rotate any key found in history or screenshots; review secrets quarterly (90-day reminder) |

One-time local scan:

```bash
docker run --rm -v "%cd%:/repo" trufflesecurity/trufflehog:latest git file:///repo --only-verified
```

## 1.2 Access control (manual IDOR checklist)

| Test | Expected | Result |
|------|----------|--------|
| Non-admin calls `admin-api` `users.detail` | `403 forbidden` | Pass — `requireAdmin()` in [`supabase/functions/_shared/requireAdmin.ts`](../supabase/functions/_shared/requireAdmin.ts) |
| Client reads another user's `household_data` row | RLS blocks | Pass — policies scope to `auth.uid()` / household owner in [`20260625120000_households_and_sync.sql`](../supabase/migrations/20260625120000_households_and_sync.sql) |
| Non-admin opens `/(admin)/stats` | Forbidden UI | Pass — [`app/(admin)/_layout.jsx`](../app/(admin)/_layout.jsx) calls `checkAdminAccess()` |
| `profiles.role` self-escalation | Blocked | Pass — `profiles_update_own` WITH CHECK in [`20260701100000_admin_foundation.sql`](../supabase/migrations/20260701100000_admin_foundation.sql) |
| `delete-account` deletes another user | Blocked | Pass — deletes JWT subject only |

Roles: `user` | `admin` only (sufficient for current scope).

## 1.3 Injection

- App uses Supabase client / RPC only — no string-concatenated SQL in application code.
- **OWASP ZAP:** Run against staging when available (`https://beaverr.vercel.app` or local `npm run web`). Document findings below.

### ZAP findings

| Date | Target | Finding | Status |
|------|--------|---------|--------|
| 2026-07-09 | Pending | Schedule weekly or pre-launch scan | Open |

## 1.4 Payments / webhooks

N/A — no Stripe/RevenueCat. Salt Edge removed; no `saltedge-*` edge functions on hosted.

## 1.5 Rate limiting

| Surface | Mitigation |
|---------|------------|
| Supabase Auth login/signup | Enable rate limits in Dashboard → Authentication → Rate Limits (recommended defaults) |
| `username-check` | 20 req/min per IP — deployed 2026-07-09 |
| `log-error` | 60/min authenticated, 10/min anonymous — deployed 2026-07-09 |

## 1.6 Session hygiene

- JWT expiry/refresh: Supabase project defaults (verify in Dashboard → Auth → Settings).
- Password reset: [`app/(auth)/forgot-password.jsx`](../app/(auth)/forgot-password.jsx) wired to `resetPasswordForEmail`.

## 1.7 Legal

Deferred — in-app GDPR consent + working delete-account flow remain.

## 1.8 CI

- `.github/workflows/ci.yml` — `npm test` on PR
- `.github/workflows/security.yml` — TruffleHog + tests
- `.github/dependabot.yml` — weekly npm updates

## Phase 3 ops

| Item | Notes |
|------|-------|
| Vercel rollback | Dashboard → Deployments → … → Promote previous deployment |
| Git tag last-good | `git tag v1.0.0-stable && git push origin v1.0.0-stable` before risky releases |
| Supabase backups | Enable PITR in Dashboard → Database → Backups; run restore drill once |

## Ponytail audit (2026-07-09)

Applied cleanup batch:

- Removed stale `advice`/`chat` telemetry categories
- Hardened `log-error` + `username-check`
- Updated ARCHITECTURE §21 (auth, RLS, cloud sync)
- Installed [`.cursor/rules/ponytail.mdc`](../.cursor/rules/ponytail.mdc)
