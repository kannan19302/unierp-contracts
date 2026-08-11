/**
 * D18 exit criterion: "Configuration is promoted sandbox → production
 * with a reviewable diff and no secret leaving its scope."
 */
import { describe, it, expect } from "vitest";
import { exportConfiguration, diffConfiguration, promoteConfiguration } from "./settings-promotion.js";

describe("D18 · settings import, export and environment promotion", () => {
  const sandbox = { "billing.currency": "USD", "billing.taxRate": 0.08, "api.secretKey": "sk_test_abc123" };
  const secretKeys = new Set(["api.secretKey"]);

  it("EXPORT omits a secret key entirely — it never appears in the snapshot, not even redacted", () => {
    const snapshot = exportConfiguration(sandbox, secretKeys);
    expect(snapshot).toEqual({ "billing.currency": "USD", "billing.taxRate": 0.08 });
    expect(Object.keys(snapshot)).not.toContain("api.secretKey");
    expect(JSON.stringify(snapshot)).not.toContain("sk_test_abc123"); // the actual secret value never appears anywhere in the export
  });

  it("DIFF is REVIEWABLE: shows added/changed/removed/unchanged with both values", () => {
    const source = exportConfiguration(sandbox, secretKeys);
    const production = { "billing.currency": "GBP", "billing.oldSetting": "legacy" };

    const diff = diffConfiguration(source, production, secretKeys);

    expect(diff.find((e) => e.key === "billing.currency")).toEqual({ key: "billing.currency", status: "changed", sourceValue: "USD", targetValue: "GBP" });
    expect(diff.find((e) => e.key === "billing.taxRate")).toEqual({ key: "billing.taxRate", status: "added", sourceValue: 0.08 });
    expect(diff.find((e) => e.key === "billing.oldSetting")).toEqual({ key: "billing.oldSetting", status: "removed", targetValue: "legacy" });
  });

  it("A SECRET IN THE DIFF shows PRESENCE ONLY — neither value is ever rendered", () => {
    const source = exportConfiguration(sandbox, secretKeys); // source doesn't even have the secret anymore
    const production = { "api.secretKey": "sk_live_PRODUCTION_VALUE" };

    const diff = diffConfiguration(source, production, secretKeys);
    const secretEntry = diff.find((e) => e.key === "api.secretKey")!;

    expect(secretEntry.status).toBe("secret");
    expect(secretEntry.sourceValue).toBeUndefined();
    expect(secretEntry.targetValue).toBeUndefined();
    expect(JSON.stringify(diff)).not.toContain("sk_live_PRODUCTION_VALUE"); // production's secret NEVER appears in the diff either
  });

  it("DRY RUN promotes NOTHING — returns only the diff, no valuesToApply", () => {
    const source = exportConfiguration(sandbox, secretKeys);
    const result = promoteConfiguration(source, { "billing.currency": "GBP" }, secretKeys, true);

    expect(result.dryRun).toBe(true);
    expect(result.valuesToApply).toBeUndefined();
    expect(result.diff.length).toBeGreaterThan(0);
  });

  it("A REAL promotion applies only non-secret added/changed keys — NO SECRET is ever in valuesToApply", () => {
    const source = exportConfiguration(sandbox, secretKeys);
    const result = promoteConfiguration(source, { "billing.currency": "GBP", "api.secretKey": "sk_live_should_never_move" }, secretKeys, false);

    expect(result.dryRun).toBe(false);
    expect(result.valuesToApply).toEqual({ "billing.currency": "USD", "billing.taxRate": 0.08 });
    expect(result.valuesToApply).not.toHaveProperty("api.secretKey"); // structurally excluded, not merely unset
    expect(JSON.stringify(result.valuesToApply)).not.toContain("sk_live_should_never_move");
  });

  it("promoting sandbox → production means production's own secret is left completely untouched by this mechanism", () => {
    const source = exportConfiguration(sandbox, secretKeys);
    const productionBefore = { "api.secretKey": "sk_live_production_own_key", "billing.currency": "USD" };
    const result = promoteConfiguration(source, productionBefore, secretKeys, false);

    // The caller applies `valuesToApply` on top of production; api.secretKey
    // is simply never in that payload, so production's own secret survives
    // by construction (this mechanism never touches it either way).
    expect(result.valuesToApply).not.toHaveProperty("api.secretKey");
  });
});
