import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertApiVersionLifecycle,
  PrematureVersionRetirementError,
} from "./api-versioning.ts";
import type { ApiVersionLifecycleSpec } from "./api-versioning.ts";

describe("API versioning strategy", () => {
  it("allows retirement after mandatory support window has elapsed", () => {
    const spec: ApiVersionLifecycleSpec = {
      version: "v1",
      state: "RETIRED",
      releasedAt: "2024-01-01T00:00:00Z",
      supportWindowMonths: 12,
      sunsetDate: "2025-06-01T00:00:00Z",
    };

    const res = assertApiVersionLifecycle(spec, "2025-06-02T00:00:00Z");
    assert.equal(res.verified, true);
  });

  it("throws PrematureVersionRetirementError when version is retired inside mandatory support window", () => {
    const spec: ApiVersionLifecycleSpec = {
      version: "v2",
      state: "RETIRED",
      releasedAt: "2026-01-01T00:00:00Z",
      supportWindowMonths: 12,
      sunsetDate: "2026-04-01T00:00:00Z", // Only 3 months!
    };

    assert.throws(
      () => assertApiVersionLifecycle(spec, "2026-04-02T00:00:00Z"),
      (err: any) => {
        return (
          err instanceof PrematureVersionRetirementError &&
          err.version === "v2" &&
          err.sunsetDate === "2026-04-01T00:00:00Z"
        );
      }
    );
  });
});
