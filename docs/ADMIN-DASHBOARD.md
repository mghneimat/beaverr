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
```

## Routes

| Route | Purpose |
|-------|---------|
| `/(admin)/stats` | Users, sign-ups, households with cloud data |
| `/(admin)/users` | Search, promote/demote admin, delete user |
| `/(admin)/errors` | Client error log with blocker filter |

## Security

- All admin writes go through `admin-api` Edge Function with service role after JWT + `profiles.role = 'admin'`.
- Client cannot update `profiles.role` (RLS `WITH CHECK` preserves role).
- Error logging uses `log-error` (optional auth — pre-auth errors allowed).

## Client instrumentation

`lib/admin/reportError.js` sends errors to `log-error` from:

- Dashboard error boundary (blocker)
- Cloud sync failures
