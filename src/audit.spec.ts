import { describe, it, expect } from "vitest";
import {
  assertAuditAppendOnly,
  AuditImmutabilityViolationError,
  computeAuditRecordHash,
  AuditEventPayload,
} from "./audit.js";

describe("Immutable Audit Primitives", () => {
  it("allows insert / append operations", () => {
    expect(() => assertAuditAppendOnly("INSERT")).not.toThrow();
    expect(() => assertAuditAppendOnly("CREATE")).not.toThrow();
  });

  it("throws AuditImmutabilityViolationError on UPDATE or DELETE operations", () => {
    expect(() => assertAuditAppendOnly("UPDATE", "rec_001")).toThrow(AuditImmutabilityViolationError);
    expect(() => assertAuditAppendOnly("DELETE", "rec_002")).toThrow(AuditImmutabilityViolationError);
    expect(() => assertAuditAppendOnly("TRUNCATE")).toThrow(AuditImmutabilityViolationError);
  });

  it("computes deterministic hash-chaining across audit entries", () => {
    const mockSha256 = (s: string) => `hash_${s.length}`;
    const payload: AuditEventPayload = {
      tenantId: "t_1",
      action: "USER_LOGIN",
      resource: "UserSession",
      resourceId: "sess_1",
      timestamp: "2026-08-14T00:00:00Z",
      previousHash: "GENESIS",
      details: { ip: "127.0.0.1" },
    };

    const hash1 = computeAuditRecordHash(payload, mockSha256);
    const hash2 = computeAuditRecordHash(payload, mockSha256);
    expect(hash1).toBe(hash2);
  });
});
