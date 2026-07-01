/**
 * Curated knowledge chunks for coach grounding (static v1).
 * Source docs: docs/knowledge-*.md — one row per ## CHUNK section excerpt.
 * @typedef {{ id: string, source_id: string, excerpt: string, topic_tags: string[] }} KnowledgeChunk
 */

/** @type {KnowledgeChunk[]} */
export const KNOWLEDGE_CHUNKS = [
  {
    id: 'sethi_csp#fixed_costs_crisis',
    source_id: 'sethi_csp',
    topic_tags: ['fixed_costs', 'csp', 'housing'],
    excerpt:
      'Conscious Spending Plan: fixed costs should ideally stay below 50–60% of take-home pay. Above 60% is structural pressure — the conversation starts with fixed costs, not discretionary cuts. Housing above 35% of take-home is the most common single cause of high-income-zero-savings patterns. Diagnosis: compute fixed costs as % of take-home first.',
  },
  {
    id: 'sethi_csp#debt_priority',
    source_id: 'sethi_csp',
    topic_tags: ['debt', 'apr', 'payoff'],
    excerpt:
      'High-interest consumer debt (typically >7% APR): pay off as fast as possible — guaranteed return beats most investments. Medium-interest (4–7%): pay minimum while continuing to invest. Low-interest (<4%): pay minimum and invest the difference. Minimum payments are always non-negotiable. For multiple debts, avalanche (highest rate first) is mathematically optimal; snowball (smallest balance) works for motivation — consistent action matters most.',
  },
  {
    id: 'sethi_csp#positive_signals',
    source_id: 'sethi_csp',
    topic_tags: ['savings', 'affirmation'],
    excerpt:
      'Positive signals to affirm: fixed costs below 55% of take-home; any consistent investing; emergency fund ≥3 months fixed costs; debt-to-income below 20%; savings rate above 20%; month-on-month stability in fixed costs. When multiple positives exist, affirm the picture and suggest one next-level mechanical action.',
  },
  {
    id: 'sethi_csp#anti_patterns',
    source_id: 'sethi_csp',
    topic_tags: ['tone', 'coaching'],
    excerpt:
      'Never name a specific discretionary purchase to cut (e.g. Netflix, eating out) — that is condescending small thinking. Never suggest someone is bad with money — behaviour follows systems. Avoid "budget" as restrictive verb; use plan or allocate. Never shame guilt-free spending that fits the person\'s values.',
  },
  {
    id: 'cfpb#dti_thresholds',
    source_id: 'cfpb',
    topic_tags: ['debt', 'dti', 'ratios'],
    excerpt:
      'DTI = total monthly debt payments ÷ gross monthly income. Below 20% excellent; 20–35% healthy; 36–43% caution (mortgage approval harder); 43–50% high risk; above 50% crisis — structural emergency. Front-end housing ratio: housing costs should not exceed 28% of gross income; above 30% is elevated, above 35% makes other goals very hard.',
  },
  {
    id: 'cfpb#emergency_fund',
    source_id: 'cfpb',
    topic_tags: ['savings', 'emergency', 'buffer'],
    excerpt:
      'Emergency fund benchmarks: 3 months of essential expenses minimum for dual-income stable households; 6 months for single-income, self-employed, or variable earners. Below 3 months = financially fragile — one income shock can cause missed payments. Named savings goals with targets are high-impact behaviour to reinforce.',
  },
  {
    id: 'cfpb#fragility',
    source_id: 'cfpb',
    topic_tags: ['fragility', 'shock', 'buffer'],
    excerpt:
      'Financial fragility: a household that looks stable but has no buffer — one emergency away from crisis. Common among employed moderate earners. Priority interventions: build emergency fund, reduce highest-burden debt, increase income margin. Do not lead with wealth-building frameworks when basic resilience is missing.',
  },
  {
    id: 'tightwad#cost_per_use',
    source_id: 'tightwad',
    topic_tags: ['frugality', 'spending', 'tight_margin'],
    excerpt:
      'Cost-per-use framework: divide purchase price by expected uses. Apply when margins are tight and user needs tactical cuts — not when finances are comfortable. High-value for tight margins; lower priority when surplus is healthy. Goal-oriented frugality: name the goal first, then cut mechanics serve the goal.',
  },
  {
    id: 'tightwad#income_vs_frugality',
    source_id: 'tightwad',
    topic_tags: ['income', 'frugality'],
    excerpt:
      'When someone says they will save when they earn more — statistically unlikely if they have not saved at current income. Identify what can be saved now, even small amounts, and build the habit before income rises. Frugality tactics are for tight margins; comfortable households should focus on housing, allocation, and income growth.',
  },
  {
    id: 'ymyl#fulfillment_curve',
    source_id: 'ymyl',
    topic_tags: ['values', 'spending', 'enough'],
    excerpt:
      'Fulfillment curve: spending increases life satisfaction up to a point, then more spending adds little. "Enough" is where spending aligns with values. Apply when spending feels misaligned or mindless — not for acute debt crisis. Conscious awareness of spending patterns often reduces unconscious spending without specific item cuts.',
  },
  {
    id: 'ymyl#gazingus_pins',
    source_id: 'ymyl',
    topic_tags: ['habits', 'spending'],
    excerpt:
      'Gazingus pins: habitual spending driven by social expectation or compensation, not deliberate choice. When tracker data shows repeated category spikes without goal linkage, surface the pattern as observation — not moral judgment. Three questions per purchase: Did I receive fulfilment? Was it worth life energy? Does this align with my values?',
  },
  {
    id: 'mnd#paw_formula',
    source_id: 'millionaire_next_door',
    topic_tags: ['wealth', 'net_worth', 'long_term'],
    excerpt:
      'PAW (prodigious accumulator of wealth) orientation: net worth should roughly equal age × annual income × 0.1 for median accumulators. Under 35 or irregular income: present as rough orientation, not verdict. Not for acute crisis — stabilise first. Lifestyle inflation on peak earnings is the main threat in 40s.',
  },
  {
    id: 'mnd#lifestyle_inflation',
    source_id: 'millionaire_next_door',
    topic_tags: ['income', 'spending', 'wealth'],
    excerpt:
      'High income does not guarantee wealth — spending expectations of high-status professions often consume raises. PAWs live below their means consistently; UAWs (under accumulators) upgrade lifestyle with each income bump. When income rose but savings did not, surface lifestyle inflation pattern calmly with numbers.',
  },
];

/** @type {Map<string, KnowledgeChunk>} */
const CHUNK_BY_ID = new Map(KNOWLEDGE_CHUNKS.map((c) => [c.id, c]));

/**
 * @param {string} id
 * @returns {KnowledgeChunk | undefined}
 */
export function getKnowledgeChunkById(id) {
  return CHUNK_BY_ID.get(id);
}

/**
 * @param {string[]} ids
 * @returns {KnowledgeChunk[]}
 */
export function getKnowledgeChunksByIds(ids) {
  return ids.map((id) => CHUNK_BY_ID.get(id)).filter(Boolean);
}
