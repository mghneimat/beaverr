export const ADVICE_PROMPT_VERSION = 'v2';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';
export const DEFAULT_GCP_PROJECT_ID = 'beaverr';
export const DEFAULT_GEMINI_LOCATION = 'eu';
export const GEMINI_VERTEX_EU_HOST = 'https://aiplatform.eu.rep.googleapis.com';

export const ADVICE_FOCUS_AREAS = ['budget', 'costs', 'debts', 'goals', 'savings'] as const;
export const ADVICE_OUTPUT_SCHEMA_KEYS = ['headline', 'bullets', 'focus_area', 'citations_used'] as const;
export const ADVICE_MAX_BULLETS = 4;
export const ADVICE_MAX_WORDS = 120;

export function buildVertexGenerateContentUrl(opts: {
  projectId?: string;
  location?: string;
  model: string;
  vertexHost?: string;
}) {
  const {
    projectId = DEFAULT_GCP_PROJECT_ID,
    location = DEFAULT_GEMINI_LOCATION,
    model,
    vertexHost = GEMINI_VERTEX_EU_HOST,
  } = opts;
  const host = vertexHost.replace(/\/$/, '');
  return `${host}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
}
