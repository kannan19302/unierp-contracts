import { describe, it, expect } from "vitest";
import { validateOnlineSchemaChangeSla, OnlineSchemaChangeSpec, OnlineSchemaChangeMeasurement } from "./online-schema-change.js";

describe("Online Schema Change (OSC) SLA contract", () => {
  const tenMillionRowSpec: OnlineSchemaChangeSpec = {
    id: "osc-10m-add-column-01",
    table: "audit_logs",
    operation: "ADD_COLUMN",
    column: "metadata_v2",
    definition: "JSONB",
    strategy: "POSTGRES_FAST_DEFAULT",
    maxLockTimeoutMs: 50,
    maxWriteBlockingMs: 100,
    estimatedRowCount: 10_000_000,
  };

  it("passes when write blocking duration is within threshold on a 10-million row table", () => {
    const measurement: OnlineSchemaChangeMeasurement = {
      specId: tenMillionRowSpec.id,
      table: "audit_logs",
      rowCount: 10_000_000,
      lockAcquisitionDurationMs: 8,
      writeBlockingDurationMs: 14,
      totalExecutionDurationMs: 45,
      withinSla: true,
      strategy: "POSTGRES_FAST_DEFAULT",
    };

    const res = validateOnlineSchemaChangeSla(tenMillionRowSpec, measurement);
    expect(res.valid).toBe(true);
  });

  it("fails when write blocking duration exceeds threshold", () => {
    const measurement: OnlineSchemaChangeMeasurement = {
      specId: tenMillionRowSpec.id,
      table: "audit_logs",
      rowCount: 10_000_000,
      lockAcquisitionDurationMs: 12,
      writeBlockingDurationMs: 450, // exceeds 100ms
      totalExecutionDurationMs: 1200,
      withinSla: false,
      strategy: "POSTGRES_FAST_DEFAULT",
    };

    const res = validateOnlineSchemaChangeSla(tenMillionRowSpec, measurement);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain("exceeds max SLA threshold 100ms");
  });

  it("fails when lock acquisition duration exceeds max lock timeout", () => {
    const measurement: OnlineSchemaChangeMeasurement = {
      specId: tenMillionRowSpec.id,
      table: "audit_logs",
      rowCount: 10_000_000,
      lockAcquisitionDurationMs: 95, // exceeds 50ms
      writeBlockingDurationMs: 20,
      totalExecutionDurationMs: 120,
      withinSla: false,
      strategy: "POSTGRES_FAST_DEFAULT",
    };

    const res = validateOnlineSchemaChangeSla(tenMillionRowSpec, measurement);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain("exceeds timeout 50ms");
  });
});
