# Admin dashboard

Web-only admin portal at `/(admin)/*` inside the Expo app. Native builds redirect to the main dashboard.

## Bootstrap first admin

After running migrations (`20260701100000_admin_foundation.sql`):

```sql
update public.profiles set role = 'admin' where id = '<your-auth-user-uuid>';
```

Find your UUID in Supabase → Authentication → Users.

## Deploy

```bash
npx supabase db push
npx supabase functions deploy admin-api
npx supabase functions deploy log-error
npx supabase functions deploy advice-generate
npx supabase functions deploy advice-chat
```

## Routes

| Route | Purpose |
|-------|---------|
| `/(admin)/stats` | Users, AI runs, spend, top rules/chunks |
| `/(admin)/users` | Search, promote/demote admin, delete user |
| `/(admin)/errors` | Client error log with blocker filter |
| `/(admin)/knowledge` | Sources, chunks, routing, publish workflow |

## Security

- All admin writes go through `admin-api` Edge Function with service role after JWT + `profiles.role = 'admin'`.
- Client cannot update `profiles.role` (RLS `WITH CHECK` preserves role).
- Error logging uses `log-error` (optional auth — pre-auth errors allowed).

## Knowledge CMS

1. **Import JS bundle** — seeds 19 chunks from static registries into Postgres (draft or published).
2. **Edit** chunks/routes in admin UI.
3. **Publish** — marks chunks published, bumps `prompt_versions` for coach + chat (invalidates advice cache).

Until published chunks exist in DB, edge functions fall back to bundled `knowledgeBundle.json`.

## Client instrumentation

`lib/admin/reportError.js` sends errors to `log-error` from:

- Dashboard error boundary (blocker)
- Cloud sync failures
- AI insight + coach chat failures
