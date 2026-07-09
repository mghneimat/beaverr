/** Simple in-memory per-IP rate limiter (per edge isolate; resets on cold start). */

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * @returns null if allowed, or Response if rate limited
 */
export function checkRateLimit(
  req: Request,
  opts: { key: string; max: number; windowMs: number },
  jsonResponse: (body: unknown, status?: number) => Response,
): Response | null {
  const ip = getClientIp(req);
  const bucketKey = `${opts.key}:${ip}`;
  const now = Date.now();
  let bucket = buckets.get(bucketKey);

  if (!bucket || now - bucket.windowStart >= opts.windowMs) {
    bucket = { count: 0, windowStart: now };
    buckets.set(bucketKey, bucket);
  }

  bucket.count += 1;

  if (bucket.count > opts.max) {
    return jsonResponse({ error: "rate_limited" }, 429);
  }

  return null;
}
