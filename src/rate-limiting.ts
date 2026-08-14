/**
 * @file rate-limiting.ts
 * @description Canonical Rate Limiting and Quota Header Contract Definitions.
 * Phase P12-068: Rate limit and quota headers.
 *
 * Exit criterion:
 *   "Uniform rate-limit signalling so every client can back off correctly.
 *    Every rate-limited response carries the standard headers, verified across endpoints"
 */

export interface RateLimitHeaders {
  "RateLimit-Limit": number;
  "RateLimit-Remaining": number;
  "RateLimit-Reset": number; // epoch timestamp or delta seconds
  "Retry-After"?: number;
  "RateLimit-Policy"?: string;
}

export class MissingRateLimitHeadersError extends Error {
  public readonly endpoint: string;
  public readonly missingHeaders: string[];

  constructor(endpoint: string, missingHeaders: string[]) {
    super(
      `Rate-limited (HTTP 429) response from "${endpoint}" missing canonical rate-limit headers:\n - ${missingHeaders.join("\n - ")}`
    );
    this.name = "MissingRateLimitHeadersError";
    this.endpoint = endpoint;
    this.missingHeaders = missingHeaders;
  }
}

/**
 * Asserts that a rate-limited response carries all mandatory standard RFC rate-limit signalling headers.
 */
export function assertRateLimitHeaders(
  endpoint: string,
  statusCode: number,
  headers: Record<string, string | number | undefined>
): { verified: true } {
  if (statusCode === 429) {
    const missing: string[] = [];
    const normalizedHeaders: Record<string, string | number | undefined> = {};
    for (const [k, v] of Object.entries(headers)) {
      normalizedHeaders[k.toLowerCase()] = v;
    }

    const required = ["ratelimit-limit", "ratelimit-remaining", "ratelimit-reset", "retry-after"];
    for (const h of required) {
      if (normalizedHeaders[h] === undefined || normalizedHeaders[h] === null || normalizedHeaders[h] === "") {
        missing.push(h);
      }
    }

    if (missing.length > 0) {
      throw new MissingRateLimitHeadersError(endpoint, missing);
    }
  }

  return { verified: true };
}
