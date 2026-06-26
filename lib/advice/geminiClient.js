import {
  DEFAULT_GEMINI_LOCATION,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GCP_PROJECT_ID,
  GEMINI_AI_STUDIO_BASE,
  GEMINI_VERTEX_EU_HOST,
  buildVertexGenerateContentUrl,
} from './constants.js';

/**
 * Google Cloud Vertex Gemini (EU multi-region) or legacy AI Studio.
 * @param {{
 *   accessToken?: string,
 *   apiKey?: string,
 *   projectId?: string,
 *   location?: string,
 *   vertexHost?: string,
 *   model?: string,
 *   systemPrompt: string,
 *   userMessage: string,
 *   responseJson?: boolean,
 *   temperature?: number,
 *   maxOutputTokens?: number,
 * }} opts
 * @returns {Promise<{ text: string, usage?: { promptTokens: number, completionTokens: number } }>}
 */
export async function geminiGenerateContent({
  accessToken,
  apiKey,
  projectId = process.env.GOOGLE_CLOUD_PROJECT || DEFAULT_GCP_PROJECT_ID,
  location = process.env.GEMINI_LOCATION || DEFAULT_GEMINI_LOCATION,
  vertexHost = process.env.GEMINI_VERTEX_HOST || GEMINI_VERTEX_EU_HOST,
  model = DEFAULT_GEMINI_MODEL,
  systemPrompt,
  userMessage,
  responseJson = true,
  temperature = 0.4,
  maxOutputTokens = 600,
}) {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(responseJson ? { responseMimeType: 'application/json' } : {}),
    },
  });

  let url;
  /** @type {Record<string, string>} */
  const headers = { 'Content-Type': 'application/json' };

  if (accessToken) {
    url = buildVertexGenerateContentUrl({ projectId, location, model, vertexHost });
    headers.Authorization = `Bearer ${accessToken}`;
  } else if (apiKey) {
    url = `${GEMINI_AI_STUDIO_BASE}/models/${model}:generateContent`;
    headers['x-goog-api-key'] = apiKey;
  } else {
    throw new Error('geminiGenerateContent requires accessToken (Vertex) or apiKey (AI Studio legacy)');
  }

  const res = await fetch(url, { method: 'POST', headers, body });
  const responseBody = await res.json();

  if (!res.ok) {
    const msg = responseBody?.error?.message || res.statusText;
    throw new Error(`Gemini API ${res.status}: ${msg}`);
  }

  const text = responseBody?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned no text (blocked or empty candidate)');
  }

  const usageMeta = responseBody?.usageMetadata || {};
  return {
    text,
    usage: {
      promptTokens: usageMeta.promptTokenCount ?? 0,
      completionTokens: usageMeta.candidatesTokenCount ?? 0,
    },
  };
}
