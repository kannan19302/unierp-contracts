import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertRateLimitHeaders,
  MissingRateLimitHeadersError,
} from "./rate-limiting.ts";

describe("Rate limit and quota headers", () => {
  it("passes compliant HTTP 429 response carrying standard rate-limit headers", () => {
    const headers = {
      "RateLimit-Limit": 1000,
      "RateLimit-Remaining": 0,
      "RateLimit-Reset": 60,
      "Retry-After": 60,
    };

    const res = assertRateLimitHeaders("/api/v1/search", 429, headers);
    assert.equal(res.verified, true);
  });

  it("passes non-429 response without requiring rate limit headers", () => {
    const res = assertRateLimitHeaders("/api/v1/search", 200, {});
    assert.equal(res.verified, true);
  });

  it("throws MissingRateLimitHeadersError when HTTP 429 lacks rate limit headers", () => {
    const brokenHeaders = {
      "Content-Type": "application/problem+json",
    };

    assert.throws(
      () => assertRateLimitHeaders("/api/v1/search", 429, brokenHeaders),
      (err: any) => {
        return (
          err instanceof MissingRateLimitHeadersError &&
          err.endpoint === "/api/v1/search" &&
          err.missingHeaders.includes("retry-after")
        );
      }
    );
  });
});
