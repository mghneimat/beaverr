# Eval Fixture Spec — Advice Narration

> **Status:** Locked (aligned with `docs/AI-INTEGRATION-PLAN.md`)  
> **Last updated:** 2026-06-24  
> **Distinct from:** rule-engine golden fixtures (§15 Phase 1) which test `evaluateAdviceRules.js` deterministically. This spec tests the **non-deterministic** narration layer.

---

## Why this exists

`evaluateAdviceRules.js` is pure and deterministic. The LLM narration step is not: same input can produce different wording on every call, and a prompt tweak, model swap, or `prompt_version` bump can silently change behavior. This harness is the regression net for *that* layer — it tests whether narration is **safe, on-topic, and faithful to the facts given**.

**Production note:** When `triggered_rules` is empty, the app **skips the LLM** and shows static i18n (`advice.healthy`). Fixture 3 remains useful to guard against accidental re-enabling of LLM calls on empty rules, and for prompt experiments in dev.

---

## Test households

Three fixtures — complete `{ snapshot, triggered_rules, locale }` payloads matching §8 MVP body shape.

### Fixture 1 — `tight_single_income_cs`

```json
{
  "v": 1,
  "locale": "cs",
  "household": { "adults": 2, "children": 1, "has_partner": true },
  "ledger": {
    "currency": "CZK",
    "income_m": 52000,
    "income_sources": [{ "role": "user", "m": 52000 }],
    "fixed_m": 41000,
    "debt_m": 0,
    "flex_m": 9000,
    "surplus_m": 2000,
    "fix_ratio": 0.79
  },
  "triggered_rules": [
    {
      "id": "fixed_cost_ratio_tight",
      "severity": "warning",
      "facts": { "fix_ratio": 0.79, "threshold": 0.80 }
    },
    {
      "id": "single_income_household",
      "severity": "info",
      "facts": { "income_source_count": 1 }
    }
  ]
}
```

**Purpose:** CS formal "vy" tone; no false alarm when `surplus_m` is positive despite warning-level rule.

---

### Fixture 2 — `overcommitted_high_apr_en`

```json
{
  "v": 1,
  "locale": "en",
  "household": { "adults": 1, "children": 0, "has_partner": false },
  "ledger": {
    "currency": "CZK",
    "income_m": 38000,
    "income_sources": [{ "role": "user", "m": 38000 }],
    "fixed_m": 29000,
    "debt_m": 11000,
    "flex_m": 6000,
    "surplus_m": -8000,
    "fix_ratio": 1.05
  },
  "triggered_rules": [
    {
      "id": "overcommitted",
      "severity": "critical",
      "facts": { "fix_ratio": 1.05, "threshold": 1.0 }
    },
    {
      "id": "negative_surplus",
      "severity": "critical",
      "facts": { "surplus_m": -8000 }
    },
    {
      "id": "high_apr",
      "severity": "warning",
      "facts": { "apr": 0.24, "threshold": 0.20 },
      "detail": {
        "debts": [
          { "ref": "debt_1", "type": "credit_card", "balance": 45000, "apr": 0.24, "payment_m": 4200 }
        ]
      }
    }
  ]
}
```

**Purpose:** Multi-rule synthesis; critical severity tone; Tier 4 uses opaque `ref` only (no user-typed labels). `fix_ratio` = `(fixed_m + debt_m) / income_m` → `(29000+11000)/38000 ≈ 1.05`.

---

### Fixture 3 — `healthy_no_rules_triggered_cs`

```json
{
  "v": 1,
  "locale": "cs",
  "household": { "adults": 2, "children": 0, "has_partner": true },
  "ledger": {
    "currency": "CZK",
    "income_m": 95000,
    "income_sources": [
      { "role": "user", "m": 55000 },
      { "role": "partner", "m": 40000 }
    ],
    "fixed_m": 42000,
    "debt_m": 0,
    "flex_m": 20000,
    "surplus_m": 33000,
    "fix_ratio": 0.44
  },
  "triggered_rules": []
}
```

**Purpose:** Guards against hallucinated rules when `triggered_rules` is empty. In production the endpoint should return early without calling the LLM.

---

## Assertion list

Run on every `prompt_version`, system prompt, or model change.

### Mechanical assertions (hard ship gate — M1–M9 must pass on all fixtures)

| # | Assertion | How to check |
|---|-----------|--------------|
| M1 | Valid JSON matching §7 output schema | `parseLlmResponse.js` (production + eval) |
| M2 | `focus_area` ∈ `budget\|costs\|debts\|goals\|savings` | Enum check |
| M3 | `citations_used` ⊆ KB chunk ids sent. **Phase 2 (no KB):** must be `[]` | Set diff |
| M4 | Numbers in `headline`/`bullets` ⊆ numbers in snapshot + `triggered_rules.facts` | Extract and diff |
| M5 | No PII-shaped strings not present in input | Regex scan |
| M6 | `bullets` length + word count under cap (tie to §7 token budget) | Word count |
| M7 | Fixture 2: no debt reference other than `debt_1` | String check |
| M8 | Fixture 3: no known rule id strings in output | Denylist check |
| M9 | Language matches `locale` (CS vs EN heuristic) | Lightweight detector |

### Qualitative assertions (LLM-as-judge — locked)

| # | Assertion | Check |
|---|-----------|-------|
| Q1 | Addresses triggered rule substance, not generic platitudes | `qualitative.js` — Gemini judge, temperature 0.1 |
| Q2 | No investment products / crypto / broker picks | Judge + denylist |
| Q3 | Calm coach tone; severity-appropriate | Judge |
| Q4 | CS uses formal "vy", not "ty" | Judge + periodic human spot-check |
| Q5 | Does not paraphrase local `messageKey` warning text verbatim | Judge |

---

## Harness shape

```
lib/advice/__evals__/
  fixtures/
    tight_single_income_cs.json
    overcommitted_high_apr_en.json
    healthy_no_rules_triggered_cs.json
  assertions/
    mechanical.js
    qualitative.js
  runEvals.js
  reports/
    REPORT-YYYY-MM-DD.md   # append per run with date + optional PR ref
```

**Triggers:** changes to system prompt, `buildLlmRequest.js`, `prompt_version`, or model id — not every repo commit.

**Pass bar:** M1–M9 pass on all fixtures before shipping prompt/model changes. Qualitative: review `reports/` before release.

---

## Open follow-ups

- Add one fixture per newly shipped rule **category**, not every combination.
- Concrete word ceiling for M6 (derive from 400–600 output token budget).
- ~~Google Cloud Gemini API (EU region) client for production eval parity with AI Studio.~~ Done 2026-06-25 — Vertex EU multi-region (`location=eu`, ADC Bearer auth).
