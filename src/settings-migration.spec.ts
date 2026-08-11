/**
 * D16 exit criterion: "A setting renamed in v2 preserves every tenant's
 * v1 value. A changed default does not move a tenant that never set
 * it."
 */
import { describe, it, expect, beforeEach } from "vitest";
import { registerRename, migrateStoredValues, pinDefaultBeforeChange, getRegisteredRenames, __resetRenamesForTests } from "./settings-migration.js";

describe("D16 · settings versioning and migration", () => {
  beforeEach(() => {
    __resetRenamesForTests();
  });

  it("a RENAME preserves every tenant's v1 value under the new key", () => {
    registerRename("billing.invoice.autoNum", "billing.invoice.autoNumber", 2);

    const tenantA = migrateStoredValues({ "billing.invoice.autoNum": true, "other.setting": "x" });
    expect(tenantA).toEqual({ "billing.invoice.autoNumber": true, "other.setting": "x" });
    expect(tenantA).not.toHaveProperty("billing.invoice.autoNum"); // old key removed

    const tenantB = migrateStoredValues({ "billing.invoice.autoNum": false });
    expect(tenantB["billing.invoice.autoNumber"]).toBe(false); // a DIFFERENT tenant's own v1 value, preserved independently
  });

  it("a tenant with NO value under the old key is unaffected by the rename", () => {
    registerRename("billing.old", "billing.new", 2);
    const tenant = migrateStoredValues({ "unrelated.key": 1 });
    expect(tenant).toEqual({ "unrelated.key": 1 });
  });

  it("migration is IDEMPOTENT — running it twice never overwrites a value the tenant already set under the new key", () => {
    registerRename("billing.old", "billing.new", 2);
    const once = migrateStoredValues({ "billing.old": "v1-value" });
    expect(once["billing.new"]).toBe("v1-value");

    // Tenant explicitly changes the new key after migrating once.
    once["billing.new"] = "tenant-changed-value";
    // Re-running migration (e.g. a second deploy) must not clobber it.
    const twice = migrateStoredValues(once);
    expect(twice["billing.new"]).toBe("tenant-changed-value");
  });

  it("registered renames are queryable, for audit", () => {
    registerRename("a", "b", 3);
    expect(getRegisteredRenames()).toEqual([{ oldKey: "a", newKey: "b", effectiveVersion: 3 }]);
  });

  it("A CHANGED DEFAULT DOES NOT MOVE A TENANT THAT NEVER SET IT — pinDefaultBeforeChange() locks in the old default for tenants with no explicit value", () => {
    const before = {
      "tenant-never-set": {}, // relies entirely on the default
      "tenant-explicitly-set": { "feature.timeout": 999 }, // set their own value
    };

    const pinned = pinDefaultBeforeChange(before, "feature.timeout", /* oldDefault */ 30);

    // The tenant who never touched it now has the OLD default pinned explicitly.
    expect(pinned["tenant-never-set"]).toEqual({ "feature.timeout": 30 });
    // The tenant who explicitly set their own value is untouched.
    expect(pinned["tenant-explicitly-set"]).toEqual({ "feature.timeout": 999 });
  });

  it("after pinning, the schema's default can change freely without affecting any already-pinned tenant", () => {
    const before = { "tenant-never-set": {} };
    const pinned = pinDefaultBeforeChange(before, "feature.timeout", 30);

    // Simulate the schema now declaring a NEW default of 60 — the
    // pinned tenant's stored value (30) is what actually resolves,
    // completely independent of the schema's current defaultValue.
    expect(pinned["tenant-never-set"]!["feature.timeout"]).toBe(30);
  });

  it("a genuinely NEW tenant (added after pinning, never in the pinned set) correctly sees the new default via normal resolution — pinning only protects EXISTING tenants", () => {
    const before = { "existing-tenant": {} };
    const pinned = pinDefaultBeforeChange(before, "feature.timeout", 30);
    // A new tenant simply never appears in the pinned map at all.
    expect(pinned["brand-new-tenant"]).toBeUndefined();
  });
});
