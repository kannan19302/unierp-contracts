import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { verifyRestoreRehearsal, RestorePointDivergenceError } from "./backup-restore.ts";
import type { RestoreRehearsalResult } from "./backup-restore.ts";

describe("Database backup and restore primitives", () => {
  it("verifies exact match for valid restore rehearsal", () => {
    const rehearsal: RestoreRehearsalResult = {
      rehearsalId: "reh-100",
      restoredPoint: "2026-08-14T12:00:00.000Z",
      walAppliedCount: 42,
      dataIntegrityHash: "sha256:abcd1234ef5678",
      expectedStateHash: "sha256:abcd1234ef5678",
      exactMatch: true,
      tableChecksumsMatch: true,
      durationMs: 1450,
    };

    const res = verifyRestoreRehearsal(rehearsal);
    assert.equal(res.verified, true);
  });

  it("throws RestorePointDivergenceError on state hash divergence", () => {
    const rehearsal: RestoreRehearsalResult = {
      rehearsalId: "reh-101",
      restoredPoint: "2026-08-14T12:00:00.000Z",
      walAppliedCount: 42,
      dataIntegrityHash: "sha256:mismatch",
      expectedStateHash: "sha256:expected",
      exactMatch: false,
      tableChecksumsMatch: false,
      durationMs: 1200,
    };

    assert.throws(() => verifyRestoreRehearsal(rehearsal), (err: any) => {
      return err instanceof RestorePointDivergenceError && err.actualHash === "sha256:mismatch";
    });
  });
});
