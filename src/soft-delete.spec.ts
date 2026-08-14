import { describe, it, expect } from "vitest";
import {
  createSoftDeletePayload,
  createRestorePayload,
  ACTIVE_RECORD_FILTER,
} from "./soft-delete.js";

describe("Soft Delete and Archival Primitives", () => {
  it("creates canonical soft-delete payload with timestamps and author", () => {
    const fixedDate = new Date("2026-08-14T12:00:00.000Z");
    const payload = createSoftDeletePayload({
      deletedBy: "user-123",
      reason: "GDPR right to be forgotten",
      timestamp: fixedDate,
    });

    expect(payload.deletedAt).toEqual(fixedDate);
    expect(payload.deletedBy).toBe("user-123");
    expect(payload.deletedReason).toBe("GDPR right to be forgotten");
  });

  it("creates canonical restoration payload resetting deletion fields", () => {
    const payload = createRestorePayload({
      restoredBy: "user-admin",
    });

    expect(payload.deletedAt).toBeNull();
    expect(payload.deletedBy).toBeNull();
    expect(payload.deletedReason).toBeNull();
  });

  it("provides standard ACTIVE_RECORD_FILTER for queries", () => {
    expect(ACTIVE_RECORD_FILTER).toEqual({ deletedAt: null });
  });
});
