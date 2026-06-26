/** @readonly */
export const ADVICE_FOCUS_AREAS = ['budget', 'costs', 'debts', 'goals', 'savings'];

export const ADVICE_PROMPT_VERSION = 'v2';

export const ADVICE_OUTPUT_SCHEMA_KEYS = ['headline', 'bullets', 'focus_area', 'citations_used'];

export const ADVICE_MAX_BULLETS = 4;

/** ~600 output tokens ≈ 120 words upper bound for M6 */
export const ADVICE_MAX_WORDS = 120;

export const KNOWN_RULE_IDS = [
  'fixed_cost_ratio_tight',
  'single_income_household',
  'overcommitted',
  'negative_surplus',
  'high_apr',
  'housing_cost_share_elevated',
  'debt_payment_ratio_high',
  'savings_buffer_low',
  'health_coverage_gap',
  'vehicle_tpl_exposure',
  'income_concentration',
];

export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';

/** Google Cloud Vertex — EU multi-region (GDPR jurisdiction). */
export const DEFAULT_GCP_PROJECT_ID = 'beaverr';

export const DEFAULT_GEMINI_LOCATION = 'eu';

export const GEMINI_VERTEX_EU_HOST = 'https://aiplatform.eu.rep.googleapis.com';

/** @deprecated AI Studio only — use Vertex + Bearer for dev/prod. */
export const GEMINI_AI_STUDIO_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * @param {{ projectId?: string, location?: string, model: string, vertexHost?: string }} opts
 * @returns {string}
 */
export function buildVertexGenerateContentUrl({
  projectId = DEFAULT_GCP_PROJECT_ID,
  location = DEFAULT_GEMINI_LOCATION,
  model,
  vertexHost = GEMINI_VERTEX_EU_HOST,
}) {
  const host = vertexHost.replace(/\/$/, '');
  return `${host}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
}
