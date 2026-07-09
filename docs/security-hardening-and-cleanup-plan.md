# Security Hardening + Codebase Cleanup Plan

You have a working app that skipped security groundwork, plus a new tool (ponytail) you want to
run against the whole codebase to cut bloat. **Do these in order.** Running a bulk cleanup pass
before security is locked down means you're refactoring code you haven't finished securing —
mistakes get baked into the "clean" version. Security first, cleanup second, then the ongoing
checklist as a habit.

---

## Phase 1 — Security Lockdown (do this before touching ponytail)

Work top to bottom. Each item is a stop-the-bleeding fix, not a nice-to-have.

### 1.1 Secrets
- [ ] Confirm no API keys, DB credentials, or tokens are committed to the repo (`git log -p | grep -i` for common key patterns, or run TruffleHog/GitGuardian across full history, not just HEAD).
- [ ] Move any secrets currently in `.env` files or hardcoded into a real secrets manager (Doppler, Infisical, or your cloud provider's equivalent). Fetch at runtime — don't bake into the build.
- [ ] Rotate every key that has ever been exposed in git history, Slack, or a screenshot, even if you think no one saw it.
- [ ] Set a rotation reminder (30–90 days) going forward.

### 1.2 Access control
- [ ] Verify every route/API endpoint checks the user's role and ownership **server-side** — not just hiding a button in the UI.
- [ ] Manually test authorization holes: swap a user ID in your auth token, swap an org/tenant ID in a request body, try escalating a role claim. If any of these return data they shouldn't, that's your top priority fix.
- [ ] Start with three roles (admin/member/viewer) if you don't already have RBAC — don't over-design this part.

### 1.3 Input validation & injection
- [ ] Audit every place user input reaches a database query, shell command, or file path. Confirm parameterized queries/ORMs are used everywhere — no string-concatenated SQL.
- [ ] Run OWASP ZAP against a staging copy of the app (one Docker command, covers SQLi/XSS/broken auth). Fix what it finds before anything else.

### 1.4 Payments & webhooks (skip if not applicable)
- [ ] Verify webhook signatures (Stripe or equivalent) — reject anything that doesn't check out.
- [ ] Make webhook handlers idempotent so a retried delivery can't double-charge or double-grant access.

### 1.5 Rate limiting & abuse
- [ ] Rate-limit login and password-reset endpoints specifically — these get hit first by credential-stuffing bots.
- [ ] Rate-limit at the edge/gateway level, not only in app logic, so a bot can't run up your API bill.
- [ ] Add a hard spend cap or budget alert on every metered API you call (OpenAI/Anthropic, Twilio, hosting). This is a five-minute setting that prevents a five-figure surprise bill.

### 1.6 Session & auth hygiene
- [ ] Confirm sessions/tokens actually expire and refresh — check you didn't ship the default of "never expires."
- [ ] Manually walk the password-reset flow end to end, including what happens when the token is expired or reused.

### 1.7 Legal minimums (same afternoon)
- [ ] Privacy policy (Termly or similar, ~10 minutes) covering what you collect and how users delete it.
- [ ] Terms of Service for liability limits and acceptable use.
- [ ] A working "delete my data" flow if you have EU/California users — not just a policy that claims one exists.

### 1.8 Automate the ongoing checks
None of this needs a server — these run as CI steps against repos you already have, at $0 cost.
- [ ] **Dependabot** — built into GitHub, nothing to install. Enable it under repo Settings → Security.
- [ ] **TruffleHog** for secrets scanning — add it as a `docker run` step in a GitHub Actions workflow on every PR. Open-source, free.
- [ ] **OWASP ZAP** for the security scan itself (see 1.3) can also run as a scheduled CI job against staging, not just a one-off local run.
- [ ] **Renovate** (optional, on top of Dependabot) — install the free hosted GitHub App rather than self-hosting; self-hosting only pays off at company scale.

*(Snyk/GitGuardian are fine alternatives but are commercial products with free tiers that cap out — the above gets you the same coverage with no tier limits and no cost.)*

**Gate:** don't move to Phase 2 until 1.1–1.4 are done. Those are the ones that leak data or money if left alone.

---

## Phase 2 — Codebase Cleanup with ponytail

Once security holes are closed, run ponytail to cut dead code, reinvented-wheel utilities, and
speculative abstractions.

### 2.1 Install it
Pick the path matching your tool:
- **Claude Code:** `/plugin marketplace add DietrichGebert/ponytail` then `/plugin install ponytail@ponytail` (two separate commands).
- **Cursor / Windsurf / Cline / Aider:** copy the matching rules file from the repo into your project's rules directory (instruction-only mode, no slash commands).
- **Codex:** `codex plugin marketplace add DietrichGebert/ponytail codex`, then trust the hooks under `/hooks`.

### 2.2 Audit before you fix anything
Run `/ponytail-audit` (whole-repo scan) rather than `/ponytail-review` (diff-only) since you want
the full existing codebase covered. This produces a **delete-list only** — it does not apply
changes automatically. Read the output before acting on it.

Expect findings tagged as:
- `delete` — dead code or a speculative feature nobody uses
- `stdlib` — a hand-rolled utility the language's standard library already does
- `native` — a dependency doing what the platform/browser already provides
- `yagni` — an abstraction with exactly one implementation
- `shrink` — same logic, expressible in far fewer lines

### 2.3 Apply fixes deliberately, not in one giant commit
- [ ] Apply cleanup in small batches per subsystem, not as one repo-wide commit — makes it easy to bisect if something breaks.
- [ ] Re-run your test suite (see Phase 3.4 below — you need one) after each batch.
- [ ] Do **not** let it touch anything Phase 1 just hardened. ponytail's own ruleset explicitly excludes trust-boundary validation, data-loss prevention, and security/auth from simplification — but verify manually anyway on any file that overlaps your Phase 1 changes.
- [ ] If the audit flags a `ponytail:` comment convention for deferred shortcuts, use `/ponytail-debt` periodically to keep that list from rotting into "never."

### 2.4 Guardrail for future code
Keep ponytail active going forward (`full` mode is the sane default) so new code doesn't
re-accumulate the same bloat. Switch to `ultra` only if a specific area is badly over-built and
you want a more aggressive first pass; switch to `lite` or `off` if it's fighting you on
legitimately necessary complexity — this is a tool to guide judgment, not override it.

---

## Phase 3 — Production Readiness (ongoing, run once fully then keep as habit)

These matter but are lower urgency than Phase 1. Tackle in whatever order fits your launch timeline.

- [ ] **AI code review in CI** — automated reviewer on every PR, tuned to flag business-logic bugs and anything touching payments/data deletion, not style nits.
- [ ] **API resilience** — exponential backoff with jitter, request queuing, response caching for anything that doesn't need to be fresh every call. Stress-test external dependencies before launch, not after.
- [ ] **Observability** — error tracking so you find out about breakage before your users do. Start on **Sentry's or GlitchTip's hosted free tier** (a few minutes to set up, $0 until you exceed the error quota). Self-hosting Sentry is heavy infra (Postgres/Redis/ClickHouse/Kafka, ~8–16GB RAM, real ongoing maintenance) and not worth it at solo-builder scale; self-hosted GlitchTip is a lighter option (~$5–12/mo VPS) if you want to self-host on principle. Migrate off the hosted free tier only once you actually outgrow it — that's a config change, not a rewrite.
- [ ] **Background jobs** — never do heavy work inside the request cycle; use a real worker with retry/backoff; add idempotency keys so double-clicks don't double-run a job.
- [ ] **Third-party API isolation** — wrap every external call in one function/module so an API change is a one-place fix; build a fallback path for when it's down; own a copy of any data you can't afford to lose.
- [ ] **Database safety** — automated backups with a tested restore (not just a backup you've never restored from); non-locking migrations (additive: add nullable column → backfill → make required); indexes on anything you filter/join on.
- [ ] **Testing, minimally** — a handful of end-to-end tests on the paths that cost you money if silently broken: signup, checkout, core action. Not full coverage — the three flows that would be a five-alarm fire.
- [ ] **Rollback plan** — know how you'd revert a bad deploy (platform rollback button or a tagged last-known-good build) before you're doing it at 2am.

---

## Suggested order of operations

1. Phase 1.1–1.4 (secrets, access control, injection, payments) — this week.
2. Phase 1.5–1.8 (rate limiting, session hygiene, legal, automated scanning) — before any public launch.
3. Phase 2 (ponytail audit + cleanup) — once security is stable, so you're not refactoring code you haven't finished securing.
4. Phase 3 — run once fully, then treat as a standing pre-launch checklist per the original document.
