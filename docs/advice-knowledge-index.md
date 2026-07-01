# Advice knowledge index

Maps triggered rule ids to curated knowledge chunks for RAG grounding. Chunks live in [`lib/advice/knowledgeChunks.js`](../lib/advice/knowledgeChunks.js); routing in [`lib/advice/knowledgeChunkRouter.js`](../lib/advice/knowledgeChunkRouter.js).

Source markdown (human-editable): `docs/knowledge-*.md` — one file per book/source, **not** merged.

## Routing table

| `rule_id` | Priority chunks | Rationale |
|-----------|-----------------|-----------|
| `fixed_cost_ratio_tight` | `sethi_csp#fixed_costs_crisis`, `cfpb#fragility` | Structural fixed-cost pressure; fragility when margin thin |
| `overcommitted` | `sethi_csp#fixed_costs_crisis`, `cfpb#dti_thresholds` | Fix ratio >100%; DTI framing for debt burden |
| `negative_surplus` | `cfpb#fragility`, `tightwad#cost_per_use` | Monthly deficit; tactical cuts when tight |
| `high_apr` | `sethi_csp#debt_priority`, `cfpb#dti_thresholds` | Payoff order; debt service context |
| `housing_cost_share_elevated` | `cfpb#dti_thresholds`, `sethi_csp#fixed_costs_crisis` | Front-end housing ratio; CSP fixed bucket |
| `debt_payment_ratio_high` | `cfpb#dti_thresholds`, `sethi_csp#debt_priority` | DTI thresholds; minimum payment logic |
| `savings_buffer_low` | `cfpb#emergency_fund`, `cfpb#fragility` | 3–6 month buffer standards |
| `single_income_household` | `cfpb#emergency_fund`, `sethi_csp#positive_signals` | Higher buffer need; affirm what works |
| `income_concentration` | `sethi_csp#fixed_costs_crisis`, `mnd#lifestyle_inflation` | Single earner risk; raise-without-saving pattern |
| `health_coverage_gap` | `cfpb#fragility` | Shock exposure without coverage |
| `vehicle_tpl_exposure` | `cfpb#fragility` | Liability / shock exposure |
| `household_overview` | `sethi_csp#positive_signals`, `cfpb#emergency_fund` | Healthy home tab — coach overview without warning rules |
| `income_empty` | `sethi_csp#fixed_costs_crisis`, `cfpb#fragility` | No income sources recorded |

## Tab tie-break preferences

When multiple rules fire, tab-specific chunks are prepended (max 2 total):

| `tab_key` | Preferred chunks |
|-----------|------------------|
| `expenses` | `tightwad#cost_per_use`, `ymyl#gazingus_pins` |
| `budget` | `sethi_csp#fixed_costs_crisis`, `cfpb#dti_thresholds` |
| `savings` | `cfpb#emergency_fund`, `sethi_csp#positive_signals` |
| `goals` | `cfpb#emergency_fund`, `ymyl#fulfillment_curve` |
| `income` | `mnd#lifestyle_inflation`, `sethi_csp#positive_signals` |
| `tracker` | `ymyl#gazingus_pins`, `tightwad#cost_per_use` |

## Chunk registry

| Chunk id | Source doc |
|----------|------------|
| `sethi_csp#*` | `knowledge-sethi-iwtytbr.md` |
| `cfpb#*` | `knowledge-cfpb.md` |
| `tightwad#*` | `knowledge-tightwad-gazette.md` |
| `ymyl#*` | `knowledge-your-money-your-life.md` |
| `mnd#*` | `knowledge-millionaire-next-door.md` |

## Future: database ingest

Phase 4: seed `knowledge_chunks` table from this registry via `scripts/ingest-knowledge-chunks.mjs` (not yet implemented). Until then, excerpts ship in the client bundle and are sent as `kb_chunks` on each request.

---

## Country official packs

Curator docs: `docs/knowledge-country-*.md`. Registry: [`lib/advice/countryKnowledgeChunks.js`](../lib/advice/countryKnowledgeChunks.js). Router: [`lib/advice/countryKnowledgeRouter.js`](../lib/advice/countryKnowledgeRouter.js). Merged with book chunks in [`lib/advice/selectAdviceKnowledge.js`](../lib/advice/selectAdviceKnowledge.js).

| Country | Doc | Max chunks per request |
|---------|-----|------------------------|
| `CZ` | `knowledge-country-cz.md` | 2 (plus up to 2 book chunks) |

### Topic tags (CZ v1)

| Tag | Chunk id | Typical triggers |
|-----|----------|------------------|
| permits, residence | `cz_official#permits` | `alerts` tab, chat keywords (visa, pobyt) |
| renting, housing | `cz_official#renting` | `expenses` tab, `housing_cost_share_elevated` |
| health, insurance | `cz_official#health_insurance` | `health_coverage_gap`, `alerts` tab |
| taxes | `cz_official#taxes` | `budget` tab, chat keywords (daň, tax) |
| utilities | `cz_official#utilities` | `expenses`, `budget` tabs |
| transport, vignette | `cz_official#transport` | `vehicle_tpl_exposure`, `expenses` tab |

Official URLs appear in the chat **Sources** UI only — coach prose must not cite them.
