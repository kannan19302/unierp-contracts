import { describe, it, expect } from "vitest";
import { TenantConnectionFairnessGovernor, PoolConfig } from "./connection-pool.js";

describe("Tenant Connection Fairness Governor (Adversarial Load Test)", () => {
  const config: PoolConfig = {
    maxTotalConnections: 50,
    maxPerTenantConnections: 10,
    acquireTimeoutMs: 2000,
    idleTimeoutMs: 10000,
  };

  it("allows requests from tenants within their fair-share threshold", () => {
    const governor = new TenantConnectionFairnessGovernor(config);
    const res = governor.acquire("tenant-normal");
    expect(res.allowed).toBe(true);
    expect(governor.getActiveCount("tenant-normal")).toBe(1);
    expect(governor.getActiveCount()).toBe(1);
  });

  it("prevents pool exhaustion by capping single adversarial tenant load", () => {
    const governor = new TenantConnectionFairnessGovernor(config);
    const badTenant = "tenant-adversarial";
    const goodTenant = "tenant-innocent";

    // Adversarial tenant attempts to open 100 connections
    for (let i = 0; i < 10; i++) {
      const res = governor.acquire(badTenant);
      expect(res.allowed).toBe(true);
    }

    // 11th request from bad tenant is rejected
    const blockedRes = governor.acquire(badTenant);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.reason).toContain("limit reached (10/10)");

    // Innocent tenant can still acquire connections normally because pool was protected
    const goodRes = governor.acquire(goodTenant);
    expect(goodRes.allowed).toBe(true);
    expect(governor.getActiveCount(goodTenant)).toBe(1);
    expect(governor.getActiveCount()).toBe(11);
  });
});
