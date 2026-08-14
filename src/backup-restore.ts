/**
 * @file backup-restore.ts
 * @description Canonical Database Backup, Restore, and Point-in-Time Recovery (PITR) primitives.
 * Phase P12-054: Database backup and restore primitives.
 *
 * Exit criterion:
 *   "A restore rehearsal reproduces a chosen point exactly, verified by comparison"
 */

export type BackupType = "FULL" | "INCREMENTAL" | "WAL_ARCHIVE" | "SNAPSHOT";

export interface BackupManifest {
  backupId: string;
  timestamp: string; // ISO 8601 target recovery point
  type: BackupType;
  walStartLsn: string;
  walEndLsn: string;
  checksumSha256: string;
  tableCount: number;
  totalBytes: number;
  tenantCatalogHash: string;
  schemaVersion: string;
}

export interface RestorePointSpecification {
  targetTimestamp: string;
  targetLsn?: string;
  tenantId?: string; // Optional single-tenant isolated restore target
  targetEnvironment: "STAGING" | "REHEARSAL" | "PRODUCTION" | "DISASTER_RECOVERY";
}

export interface RestoreRehearsalResult {
  rehearsalId: string;
  restoredPoint: string;
  walAppliedCount: number;
  dataIntegrityHash: string;
  expectedStateHash: string;
  exactMatch: boolean;
  tableChecksumsMatch: boolean;
  durationMs: number;
}

export class RestorePointDivergenceError extends Error {
  public readonly targetPoint: string;
  public readonly actualHash: string;
  public readonly expectedHash: string;

  constructor(targetPoint: string, actualHash: string, expectedHash: string) {
    super(
      `Database restore rehearsal divergence at "${targetPoint}": Restored state hash (${actualHash}) does not match expected state hash (${expectedHash}). Exact point-in-time state reproduction failed.`
    );
    this.name = "RestorePointDivergenceError";
    this.targetPoint = targetPoint;
    this.actualHash = actualHash;
    this.expectedHash = expectedHash;
  }
}

/**
 * Validates that a restore rehearsal perfectly matches the expected point-in-time cryptographic checksums.
 */
export function verifyRestoreRehearsal(rehearsal: RestoreRehearsalResult): { verified: boolean } {
  if (!rehearsal.exactMatch || !rehearsal.tableChecksumsMatch || rehearsal.dataIntegrityHash !== rehearsal.expectedStateHash) {
    throw new RestorePointDivergenceError(
      rehearsal.restoredPoint,
      rehearsal.dataIntegrityHash,
      rehearsal.expectedStateHash
    );
  }
  return { verified: true };
}
