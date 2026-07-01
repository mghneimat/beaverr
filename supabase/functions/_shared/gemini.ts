import {
  DEFAULT_GEMINI_LOCATION,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GCP_PROJECT_ID,
  GEMINI_VERTEX_EU_HOST,
  buildVertexGenerateContentUrl,
} from './constants.ts';

export async function geminiGenerateContent(opts: {
  accessToken: string;
  projectId?: string;
  location?: string;
  vertexHost?: string;
  model?: string;
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxOutputTokens?: number;
}) {
  const {
    accessToken,
    projectId = Deno.env.get('GCP_PROJECT_ID') ?? DEFAULT_GCP_PROJECT_ID,
    location = Deno.env.get('GEMINI_LOCATION') ?? DEFAULT_GEMINI_LOCATION,
    vertexHost = Deno.env.get('GEMINI_VERTEX_HOST') ?? GEMINI_VERTEX_EU_HOST,
    model = DEFAULT_GEMINI_MODEL,
    systemPrompt,
    userMessage,
    temperature = 0.4,
    maxOutputTokens = 600,
  } = opts;

  const url = buildVertexGenerateContentUrl({ projectId, location, model, vertexHost });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature,
        maxOutputTokens,
        responseMimeType: 'application/json',
      },
    }),
  });

  const body = await res.json();

  if (!res.ok) {
    const msg = body?.error?.message || res.statusText;
    throw new Error(`Gemini API ${res.status}: ${msg}`);
  }

  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned no text');
  }

  const usageMeta = body?.usageMetadata || {};
  return {
    text,
    usage: {
      promptTokens: usageMeta.promptTokenCount ?? 0,
      completionTokens: usageMeta.candidatesTokenCount ?? 0,
    },
  };
}

export type GeminiChatContent = {
  role: string;
  parts: { text: string }[];
};

export async function geminiGenerateChat(opts: {
  accessToken: string;
  projectId?: string;
  location?: string;
  vertexHost?: string;
  model?: string;
  systemPrompt: string;
  contents: GeminiChatContent[];
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
}) {
  const {
    accessToken,
    projectId = Deno.env.get('GCP_PROJECT_ID') ?? DEFAULT_GCP_PROJECT_ID,
    location = Deno.env.get('GEMINI_LOCATION') ?? DEFAULT_GEMINI_LOCATION,
    vertexHost = Deno.env.get('GEMINI_VERTEX_HOST') ?? GEMINI_VERTEX_EU_HOST,
    model = DEFAULT_GEMINI_MODEL,
    systemPrompt,
    contents,
    temperature = 0.5,
    maxOutputTokens = 800,
    responseMimeType,
  } = opts;

  const url = buildVertexGenerateContentUrl({ projectId, location, model, vertexHost });
  const generationConfig: Record<string, unknown> = {
    temperature,
    maxOutputTokens,
  };
  if (responseMimeType) {
    generationConfig.responseMimeType = responseMimeType;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig,
    }),
  });

  const body = await res.json();

  if (!res.ok) {
    const msg = body?.error?.message || res.statusText;
    throw new Error(`Gemini API ${res.status}: ${msg}`);
  }

  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned no text');
  }

  const usageMeta = body?.usageMetadata || {};
  return {
    text: text.trim(),
    usage: {
      promptTokens: usageMeta.promptTokenCount ?? 0,
      completionTokens: usageMeta.candidatesTokenCount ?? 0,
    },
  };
}
