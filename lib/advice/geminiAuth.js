import { GoogleAuth } from 'google-auth-library';

import { DEFAULT_GCP_PROJECT_ID } from './constants.js';

const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

/**
 * Resolve Bearer token for Vertex Gemini (ADC, explicit token, or legacy API key path).
 * @returns {Promise<
 *   | { mode: 'vertex', accessToken: string, projectId: string }
 *   | { mode: 'ai_studio', apiKey: string }
 * >}
 */
export async function resolveGeminiAuth() {
  const explicitToken = process.env.GEMINI_ACCESS_TOKEN?.trim();
  if (explicitToken) {
    return {
      mode: 'vertex',
      accessToken: explicitToken,
      projectId: process.env.GOOGLE_CLOUD_PROJECT || DEFAULT_GCP_PROJECT_ID,
    };
  }

  try {
    const auth = new GoogleAuth({
      scopes: [CLOUD_PLATFORM_SCOPE],
      projectId: process.env.GOOGLE_CLOUD_PROJECT || DEFAULT_GCP_PROJECT_ID,
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;

    if (accessToken) {
      return {
        mode: 'vertex',
        accessToken,
        projectId: process.env.GOOGLE_CLOUD_PROJECT || DEFAULT_GCP_PROJECT_ID,
      };
    }
  } catch {
    // fall through to legacy API key
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey) {
    console.warn(
      'GEMINI_API_KEY uses AI Studio (deprecated). Prefer: gcloud auth application-default login',
    );
    return { mode: 'ai_studio', apiKey };
  }

  throw new Error(
    'No GCP credentials. Run: gcloud auth application-default login --scopes=https://www.googleapis.com/auth/cloud-platform,openid',
  );
}
