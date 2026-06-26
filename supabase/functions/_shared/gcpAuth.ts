import { GoogleAuth } from "npm:google-auth-library@9";

const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Service-account Bearer token for Vertex (cached ~50 min).
 */
export async function getServiceAccountAccessToken(saJson: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const credentials = JSON.parse(saJson);
  const auth = new GoogleAuth({
    credentials,
    scopes: [CLOUD_PLATFORM_SCOPE],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;

  if (!token) {
    throw new Error("Failed to obtain GCP access token from service account");
  }

  cachedToken = { token, expiresAt: Date.now() + 50 * 60 * 1000 };
  return token;
}
