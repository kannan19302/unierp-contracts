import { describe, it, expect } from "vitest";
import { RetentionPolicy, evaluateRetentionEligibility } from "./retention.js";

describe("Retention and Legal Hold Primitives", () => {
  const policy: RetentionPolicy = {
    modelName: "Invoice",
    retentionDays: 2555, // 7 years
    timestampField: "issuedAt",
    action: "ANONYMIZE",
    regulatoryBasis: "Statutory commercial tax retention (7 years)",
  };

  const now = new Date("2026-08-14T00:00:00Z");

  it("blocks purge when active legal hold is present regardless of age", () => {
    const veryOldDate = new Date("2010-01-01T00:00:00Z");
    const result = evaluateRetentionEligibility(veryOldDate, policy, now, true);

    expect(result.eligible).toBe(false);
    expect(result.action).toBe("RETAIN_LEGAL_HOLD");
    expect(result.reason).toContain("Active legal hold");
  });

  it("permits action when retention period has elapsed and no legal hold exists", () => {
    const eightYearsAgo = new Date("2018-01-01T00:00:00Z");
    const result = evaluateRetentionEligibility(eightYearsAgo, policy, now, false);

    expect(result.eligible).toBe(true);
    expect(result.action).toBe("ANONYMIZE");
    expect(result.reason).toContain("exceeds statutory retention period");
  });

  it("prevents purge when record is still within statutory retention window", () => {
    const recentDate = new Date("2024-01-01T00:00:00Z");
    const result = evaluateRetentionEligibility(recentDate, policy, now, false);

    expect(result.eligible).toBe(false);
    expect(result.action).toBe("RETAIN_LEGAL_HOLD");
    expect(result.reason).toContain("within retention period");
  });
});
