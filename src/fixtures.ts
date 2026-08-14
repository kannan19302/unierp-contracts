/**
 * @file fixtures.ts
 * @description L0 Contract for standard test fixtures, deterministic UUIDs, and seed verification.
 *
 * P12-036: Seed and fixture data.
 * "Deterministic seed data and the shared fixture set every programme's tests use.
 *  Two seed runs produce identical data. Every programme's tests can use the shared fixtures."
 */

export interface TestTenantFixture {
  id: string;
  name: string;
  slug: string;
  plan: "ENTERPRISE" | "PRO" | "STARTER";
  currency: string;
  timezone: string;
}

export interface TestUserFixture {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "FINANCE_MANAGER" | "HR_MANAGER" | "SALES_REP" | "VIEWER";
}

export interface TestOrganizationFixture {
  id: string;
  tenantId: string;
  name: string;
  code: string;
}

/**
 * Standard immutable test fixtures shared across all 12 programmes.
 */
export const SHARED_FIXTURES = {
  TENANT_A: {
    id: "00000000-0000-4000-a000-000000000001",
    name: "Acme Corporation",
    slug: "acme-corp",
    plan: "ENTERPRISE",
    currency: "USD",
    timezone: "America/New_York",
  } as TestTenantFixture,

  TENANT_B: {
    id: "00000000-0000-4000-b000-000000000002",
    name: "Globex Industries",
    slug: "globex-ind",
    plan: "PRO",
    currency: "EUR",
    timezone: "Europe/Berlin",
  } as TestTenantFixture,

  USER_ADMIN_A: {
    id: "00000000-0000-4000-a000-000000000101",
    tenantId: "00000000-0000-4000-a000-000000000001",
    email: "admin@acme.corp",
    name: "Acme Super Admin",
    role: "SUPER_ADMIN",
  } as TestUserFixture,

  USER_FINANCE_A: {
    id: "00000000-0000-4000-a000-000000000102",
    tenantId: "00000000-0000-4000-a000-000000000001",
    email: "finance@acme.corp",
    name: "Acme Finance Manager",
    role: "FINANCE_MANAGER",
  } as TestUserFixture,

  USER_ADMIN_B: {
    id: "00000000-0000-4000-b000-000000000201",
    tenantId: "00000000-0000-4000-b000-000000000002",
    email: "admin@globex.eu",
    name: "Globex Admin",
    role: "ADMIN",
  } as TestUserFixture,
} as const;

/**
 * Asserts seed determinism by comparing two seed snapshot outputs.
 */
export function assertSeedDeterminism(runA: Record<string, unknown>, runB: Record<string, unknown>): {
  deterministic: boolean;
  diff?: string;
} {
  const jsonA = JSON.stringify(runA, Object.keys(runA).sort());
  const jsonB = JSON.stringify(runB, Object.keys(runB).sort());

  if (jsonA !== jsonB) {
    return {
      deterministic: false,
      diff: `Seed output differs between runs (length A: ${jsonA.length}, length B: ${jsonB.length}).`,
    };
  }

  return { deterministic: true };
}
