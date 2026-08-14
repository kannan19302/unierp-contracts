import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatDeprecationHeaders,
  assertDeprecationWindowEnforcement,
  PrematureElementRemovalError,
} from "./deprecation.ts";
import type { DeprecatedContractElement } from "./deprecation.ts";

describe("Deprecation mechanism", () => {
  const deprecatedElement: DeprecatedContractElement = {
    elementId: "getUserLegacy",
    elementKind: "ENDPOINT",
    deprecation: {
      deprecated: true,
      deprecatedSince: "2026-01-01",
      sunsetDate: "2026-12-31",
      migrationGuideUrl: "https://docs.unierp.io/migrations/v1-to-v2",
    },
  };

  it("signals deprecation via Warning and Sunset headers", () => {
    const headers = formatDeprecationHeaders(deprecatedElement.deprecation);
    assert.match(headers.warningHeader, /Deprecated element: sunset scheduled for 2026-12-31/);
    assert.ok(headers.sunsetHeader.length > 0);
    assert.equal(headers.linkHeader, '<https://docs.unierp.io/migrations/v1-to-v2>; rel="deprecation"');
  });

  it("permits removal after sunset date has elapsed", () => {
    const res = assertDeprecationWindowEnforcement(
      [deprecatedElement],
      [], // removed
      "2027-01-01T00:00:00Z" // after sunset
    );
    assert.equal(res.verified, true);
  });

  it("refuses removal inside deprecation window and throws PrematureElementRemovalError", () => {
    assert.throws(
      () =>
        assertDeprecationWindowEnforcement(
          [deprecatedElement],
          [], // removed prematurely
          "2026-06-01T00:00:00Z" // inside window
        ),
      (err: any) => {
        return (
          err instanceof PrematureElementRemovalError &&
          err.elementId === "getUserLegacy" &&
          err.sunsetDate === "2026-12-31"
        );
      }
    );
  });
});
