import { describe, it, expect } from "vitest";
import { SHARED_FIXTURES, assertSeedDeterminism } from "./fixtures.js";

describe("Shared Fixtures and Seed Determinism contract", () => {
  it("provides valid and well-formed shared fixtures for multi-tenant tests", () => {
    expect(SHARED_FIXTURES.TENANT_A.id).toBeDefined();
    expect(SHARED_FIXTURES.TENANT_B.id).toBeDefined();
    expect(SHARED_FIXTURES.TENANT_A.id).not.toBe(SHARED_FIXTURES.TENANT_B.id);

    expect(SHARED_FIXTURES.USER_ADMIN_A.tenantId).toBe(SHARED_FIXTURES.TENANT_A.id);
    expect(SHARED_FIXTURES.USER_ADMIN_B.tenantId).toBe(SHARED_FIXTURES.TENANT_B.id);
  });

  it("verifies identical seed runs are deterministic", () => {
    const seedRun1 = {
      tenants: [SHARED_FIXTURES.TENANT_A, SHARED_FIXTURES.TENANT_B],
      users: [SHARED_FIXTURES.USER_ADMIN_A, SHARED_FIXTURES.USER_ADMIN_B],
      roles: ["SUPER_ADMIN", "ADMIN"],
    };

    const seedRun2 = {
      tenants: [SHARED_FIXTURES.TENANT_A, SHARED_FIXTURES.TENANT_B],
      users: [SHARED_FIXTURES.USER_ADMIN_A, SHARED_FIXTURES.USER_ADMIN_B],
      roles: ["SUPER_ADMIN", "ADMIN"],
    };

    const res = assertSeedDeterminism(seedRun1, seedRun2);
    expect(res.deterministic).toBe(true);
  });

  it("fails when seed runs produce non-deterministic data", () => {
    const seedRun1 = {
      tenants: [SHARED_FIXTURES.TENANT_A],
      randomToken: "rand-12345",
    };

    const seedRun2 = {
      tenants: [SHARED_FIXTURES.TENANT_A],
      randomToken: "rand-67890",
    };

    const res = assertSeedDeterminism(seedRun1, seedRun2);
    expect(res.deterministic).toBe(false);
    expect(res.diff).toBeDefined();
  });
});
