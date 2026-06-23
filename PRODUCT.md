# Product

## Register

product

## Users

Households (couples, families, single adults with shared costs) who want a clear picture of monthly income, fixed costs, and flexible spending. Primary locales: English and Czech (formal "vy" tone in Czech).

Typical context: sitting down in the evening or weekend to set up or review the household budget, often on phone or laptop at home. Users are not finance professionals. They need plain language, step-by-step guidance, and confidence that the numbers add up.

## Product Purpose

Beaverr walks a household through a structured financial setup: income, housing, transport, subscriptions, health, children, pets, debts, and a flexible monthly budget with rollover rules. Data is stored locally during onboarding and surfaced in an app shell (sidebar navigation) for ongoing review.

Success looks like: a user finishes setup understanding their monthly free cash, fixed obligations, and flexible budget; they return to the app to check status and adjust inputs without re-entering everything. The budget summary (Q14) is the core payoff moment; the dashboard must eventually carry that value forward after onboarding.

## Brand Personality

**Voice:** Calm, direct, respectful. Explain money in household terms, not fintech jargon.

**Three words:** Clear, trustworthy, practical.

**Emotional goals:** Reduce anxiety about household finances; replace guesswork with a ledger-like clarity. The product should feel like a competent household tool, not a growth-optimized SaaS landing page.

**References (feel, not copy):** Personal finance apps that prioritize clarity over decoration (YNAB's seriousness without its complexity); productivity tools with earned familiarity (Linear-style navigation discipline); Czech banking apps that use formal, plain language.

## Anti-references

- Generic AI-generated SaaS marketing pages (cream backgrounds, hero metrics, gradient accents)
- Navy-and-gold "premium fintech" clichés
- Gamified budgeting with badges, streaks, and confetti
- Glassmorphism, gradient text, decorative motion without state meaning
- Uppercase tracked eyebrows on every section ("NAVIGATION", "TOOLS", "ABOUT")
- Marketing buzzwords: streamline, empower, seamless, world-class, transform
- Icon-only navigation without labels or accessibility fallbacks
- Placeholder dashboards after a long setup flow (breaks trust at the finish line)

## Design Principles

1. **Show the number that matters.** Every flow should move the user toward a concrete monthly picture (income minus fixed costs minus debt payments equals flexible budget). Decoration never outweighs data.

2. **One decision at a time.** Onboarding uses one question per screen with progress feedback. Do not overwhelm with walls of options; chunk complex domains (costs by category) with progressive disclosure.

3. **Earned familiarity.** Use standard product patterns (sidebar nav, labeled forms, primary CTA at bottom) so the UI disappears into the task. Invent new affordances only when the task demands it.

4. **Locale parity.** English and Czech ship together. User-facing copy uses `useI18n()`; Czech uses formal "vy" consistent with existing `cs.json` tone.

5. **Close the loop.** Setup data must feed visible outcomes. Onboarding payoff (budget summary) and post-setup home (dashboard) must feel like the same product, not two different apps.

## Accessibility & Inclusion

- **Target:** WCAG 2.1 Level AA for web surfaces; RN accessibility APIs for native.
- **Requirements:** `accessibilityLabel` on all icon-only controls (collapsed sidebar, toggles); visible keyboard focus on web inputs; placeholder and muted text at ≥4.5:1 contrast on light surfaces.
- **Reduced motion:** Respect `prefers-reduced-motion` / system reduce-motion; replace slide choreography with instant or crossfade transitions.
- **Color:** Do not convey state by color alone; pair with weight, icons, or labels (e.g. positive/negative amounts).
- **Known gap (from critique):** Sidebar, form focus rings, and placeholder contrast need hardening before release.
