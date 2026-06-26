# OAuth setup cookbook — Google, Facebook, Apple + Supabase

Step-by-step guide to activate social sign-in for Beaverr. Use this when configuring a new Supabase project, adding providers, or debugging OAuth redirects.

| Piece | Current value |
|-------|----------------|
| Supabase project | `beaverr` — `fetbfivnidpaxcsadnnb` (eu-west-1) |
| **Production web** | `https://beaverr.vercel.app` |
| Supabase Auth callback | `https://fetbfivnidpaxcsadnnb.supabase.co/auth/v1/callback` |
| App deep link scheme | `beaverr` (see `app.json`) |
| Web callback route | `/auth/callback` → `app/auth/callback.jsx` |
| Code reference | `lib/auth/oauth.js`, `lib/auth/getAuthRedirectUri.js` |

---

## Production (beaverr.vercel.app) — required for friends / mobile web

If Google login on **https://beaverr.vercel.app** sends you to **`localhost:8081`**, Supabase is rejecting the Vercel callback and falling back to **Site URL**. Fix in the dashboard (not in code):

1. [Supabase Dashboard](https://supabase.com/dashboard/project/fetbfivnidpaxcsadnnb/auth/url-configuration) → **Authentication** → **URL configuration**
2. Set **Site URL** to:
   ```
   https://beaverr.vercel.app
   ```
3. Under **Redirect URLs**, keep dev entries **and** add (each on its own line):
   ```
   https://beaverr.vercel.app/auth/callback
   https://beaverr.vercel.app/**
   http://localhost:8081/auth/callback
   beaverr://auth/callback
   ```
4. **Save**
5. On **Vercel** → Project → Settings → Environment Variables: **do not** set `EXPO_PUBLIC_AUTH_REDIRECT_ORIGIN` (dev-only; breaks or confuses redirects if set).

After saving, retry Google sign-in on the phone at `beaverr.vercel.app` — you should land on `https://beaverr.vercel.app/auth/callback`, not localhost.

---

```
Beaverr app  →  Supabase Auth  →  Google / Facebook / Apple
                     ↑                      ↓
                     └──── provider returns to Supabase callback
                              ↓
                     Supabase redirects to your app callback
                              ↓
              complete-profile (new user) or onboarding (existing)
```

There are **two different redirect URLs**. Mixing them up is the most common setup mistake.

| Where you configure it | URL | Purpose |
|------------------------|-----|---------|
| **Supabase Dashboard** → URL configuration | `http://localhost:8081/auth/callback`, `beaverr://auth/callback` | Where Supabase sends the user **back to Beaverr** after login |
| **Google / Facebook / Apple consoles** | `https://fetbfivnidpaxcsadnnb.supabase.co/auth/v1/callback` | Where the provider sends the user **to Supabase** (never directly to localhost) |

Flow in plain terms: **Your app → Supabase → Provider → Supabase → your app**.

---

## Prerequisites

- Supabase project with Auth enabled
- `.env.local` with valid `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (no angle brackets around the key)
- Expo dev server: `npx expo start --clear`
- For web testing: note the port Expo uses (often `8081`; use whatever appears in the browser address bar)

---

## Part 0 — Email sign-up (do this first)

OAuth is separate from email/password, but email sign-up should work before you add social providers.

1. Supabase Dashboard → **Authentication** → **Providers** → **Email**
2. **Disable “Confirm email”** for local development  
   - With confirmation on, sign-up creates a user but no session until the user clicks a link in email  
   - Beaverr is configured to go straight to onboarding when a session exists
3. Re-enabling confirmation later requires a dedicated check-email screen plus custom SMTP (Resend, SendGrid) — not Supabase’s built-in mailer for production volume

See also `.env.example` comments.

---

## Part 1 — Supabase URL configuration

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → project **beaverr** (`fetbfivnidpaxcsadnnb`)
2. Go to **Authentication** → **URL configuration**
3. Set **Site URL** to your **primary** web origin:
   - **Production:** `https://beaverr.vercel.app`
   - **Local dev only:** `http://localhost:8081` (use production URL above if you ship on Vercel)

4. Under **Redirect URLs**, add each URL **on its own line** (click **Add URL** for each):

   ```
   https://beaverr.vercel.app/auth/callback
   http://localhost:8081/auth/callback
   beaverr://auth/callback
   ```

5. Save

### Extra redirect URLs (when needed)

| Scenario | Add to Supabase Redirect URLs |
|----------|-------------------------------|
| Expo web on another port | `http://localhost:PORT/auth/callback` |
| **Phone on same Wi‑Fi (mobile web dev)** | `http://YOUR-PC-LAN-IP:8081/auth/callback` (see below) |
| Production web | `https://your-domain.com/auth/callback` |
| Native dev client | `beaverr://auth/callback` (already required for iOS/Android) |

The app builds the web callback from `window.location.origin + '/auth/callback'` (`lib/auth/getAuthRedirectUri.js`). Native uses `beaverr://auth/callback` via Expo Linking.

### Mobile web on a physical phone (common `localhost` failure)

On a phone, **`localhost` is the phone itself**, not your dev computer. If Google sends you to `http://localhost:8081/auth/callback`, you will see **“This site can’t be reached”**.

That usually means either:

1. You opened the app at `localhost` on the phone (wrong), or  
2. You opened via your PC’s LAN IP, but **Supabase Redirect URLs** only lists `localhost` — Supabase then falls back to Site URL (`localhost`).

**Fix:**

1. On your PC: `npx expo start --lan` (or ensure Expo shows a LAN URL like `http://192.168.x.x:8081`).
2. On the phone browser, open **`http://192.168.x.x:8081`** — not `localhost`.
3. Supabase → **Authentication** → **URL configuration** → **Redirect URLs** → add **exactly**:
   ```
   http://192.168.x.x:8081/auth/callback
   ```
   (use your real LAN IP and port from the browser address bar).
4. Click **Continue with Google** again.

Optional: set `EXPO_PUBLIC_AUTH_REDIRECT_ORIGIN=http://192.168.x.x:8081` in `.env.local` **only** if you mistakenly open `localhost` on a phone. **Do not set this on laptop** — it breaks Google sign-in at `localhost:8081` (PKCE mismatch).

Before each OAuth attempt, the browser console logs: `[Beaverr OAuth] redirectTo=...` — copy that URL into Supabase if login still fails.

---

## Part 2 — Google

### 2.1 Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → create or select a project
2. **APIs & Services** → **OAuth consent screen**
   - User type: **External** (for testing with your own Google account)
   - Fill app name, support email, developer contact
3. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**
4. Application type: **Web application**
5. **Authorized redirect URIs** — add **only**:

   ```
   https://fetbfivnidpaxcsadnnb.supabase.co/auth/v1/callback
   ```

   Do **not** put `localhost` here.

6. Copy **Client ID** and **Client secret**

### 2.2 Supabase

1. **Authentication** → **Providers** → **Google** → Enable
2. Paste Client ID and Client secret → **Save**

---

## Part 3 — Facebook

### 3.1 Meta for Developers

1. [developers.facebook.com](https://developers.facebook.com/) → **My Apps** → **Create App**
   - Use **Consumer** or appropriate type for login
2. Add product **Facebook Login**
3. **Facebook Login** → **Settings** → **Valid OAuth Redirect URIs** — add:

   ```
   https://fetbfivnidpaxcsadnnb.supabase.co/auth/v1/callback
   ```

4. **Settings** → **Basic** — note **App ID** and **App Secret**
5. While testing, keep the app in **Development** mode and add your Facebook account under **Roles** → **Test users** or as admin/developer

### 3.2 Supabase

1. **Authentication** → **Providers** → **Facebook** → Enable
2. **Facebook client ID** = App ID  
3. **Facebook secret** = App Secret  
4. **Save**

---

## Part 4 — Apple

Apple is the most involved provider. Enable Google first and verify the full flow on web before Apple.

### 4.1 Apple Developer

1. [developer.apple.com/account](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles**
2. **Identifiers** → **+** → **Services IDs** → register (e.g. `com.yourcompany.beaverr.auth`)
3. Enable **Sign In with Apple** on that Services ID
4. Configure **Return URLs**:

   ```
   https://fetbfivnidpaxcsadnnb.supabase.co/auth/v1/callback
   ```

5. Create a **Key** for Sign in with Apple if required; note **Key ID**, **Team ID**, Services ID, and download the **.p8** private key

### 4.2 Supabase

1. **Authentication** → **Providers** → **Apple** → Enable
2. Enter Services ID, secret key (.p8 contents), Key ID, Team ID → **Save**

Beaverr uses Supabase-hosted Apple OAuth (web flow). Native `expo-apple-authentication` is optional future work.

---

## Part 5 — Run the app

From the repo root:

```bash
npx expo start --clear
```

- Press **`w`** for web, or open on a device/simulator
- Auth entry: **Welcome** screen with social buttons (`app/(auth)/welcome.jsx`)

---

## Part 6 — Verify the flow

1. Open auth welcome → click **Continue with Google** (easiest first test)
2. Complete provider login
3. Browser should land on `/auth/callback`, then:
   - **Complete your account** (`/(auth)/complete-profile`) — new OAuth user without username
   - **Onboarding welcome** — returning user with profile already set

### Where to look when it fails

| Symptom | Check |
|---------|--------|
| Redirect URI mismatch | Provider console must use Supabase `/auth/v1/callback`, not localhost |
| Stuck after Google, blank page | Supabase Redirect URLs must include your exact web callback URL |
| Phone lands on `localhost:8081` after Google | Add `https://beaverr.vercel.app/auth/callback` to Supabase Redirect URLs; set Site URL to `https://beaverr.vercel.app` |
| Phone lands on `localhost` from **Vercel** | Same — Supabase rejected the Vercel callback and used Site URL (still `localhost`) |
| Native app doesn’t return | `beaverr://auth/callback` must be in Supabase Redirect URLs |
| 401 / misconfigured | `.env.local` anon key valid, no `<>` wrapping |
| User created but no username | Expected — complete-profile screen should appear |

Supabase **Authentication** → **Logs** and browser **Network** tab on `/auth/callback` are the fastest debug tools.

---

## Common mistakes

| Mistake | Fix |
|---------|-----|
| `localhost/auth/callback` in Google/Facebook/Apple | Wrong place — only the Supabase URL belongs in provider consoles |
| Missing `beaverr://auth/callback` in Supabase | Native OAuth won’t return to the app |
| Site URL port doesn’t match Expo web | Align Site URL and redirect URL with the port in your browser |
| Facebook app in Live without review | Keep Development mode + add testers |
| Email confirm still on | Disable for dev; otherwise sign-up won’t get a session immediately |
| Bounce warnings from Supabase email | Use real emails for tests; avoid typo addresses during sign-up experiments |

---

## App behavior after OAuth (reference)

| User state | Next screen |
|------------|-------------|
| New OAuth user, no `profiles.username` | `/(auth)/complete-profile` |
| Profile complete, onboarding not finished | `/(onboarding)/welcome` or resume step |
| Questionnaire complete | `/(app)/dashboard` |

Routing: `lib/auth/routeAfterAuth.js`, `lib/auth/bootRouting.js`, `lib/auth/navigateAfterAuth.js`.

---

## Related docs

- Supabase: [Social login](https://supabase.com/docs/guides/auth/social-login)
- Supabase: [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- In-repo code comments: `lib/auth/oauth.js`

---

## Checklist (copy when setting up a new environment)

- [ ] Email **Confirm email** disabled (dev)
- [ ] Supabase Site URL set to dev web origin
- [ ] Supabase Redirect URLs: web callback + `beaverr://auth/callback`
- [ ] Google OAuth client created; redirect = Supabase `/auth/v1/callback`
- [ ] Google enabled in Supabase with Client ID + secret
- [ ] Facebook app + Valid OAuth Redirect URI = Supabase callback
- [ ] Facebook enabled in Supabase
- [ ] Apple Services ID + Return URL = Supabase callback (if using Apple)
- [ ] Apple enabled in Supabase
- [ ] `.env.local` Supabase keys valid
- [ ] `npx expo start --clear` and test Google on web
