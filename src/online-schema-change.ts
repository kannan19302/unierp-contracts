/**
 * @file online-schema-change.ts
 * @description L0 Contract for Online Schema Change (OSC) strategies, lock thresholds, and execution telemetry.
 *
 * P12-035: Online schema change.
 * "Adding and altering columns without blocking traffic on large tables.
 *  A column is added to a 10-million-row table with no write blocked beyond the stated threshold, measured."
 */

export type OnlineSchemaChangeStrategy =
  | "POSTGRES_FAST_DEFAULT"     // PostgreSQL >= 11 instant metadata add for nullable or default columns
  | "CONCURRENT_INDEX_BUILD"    // CREATE INDEX CONCURRENTLY
  | "EXPAND_CONTRACT"           // Multi-phase expand/contract with dual-write / backfill shadow columns
  | "SHADOW_TABLE_REWRITE"      // pg_repack / gh-ost / pt-online-schema-change style shadow table copy
  | "BACKGROUND_BACKFILL";      // Batch backfill with chunk size limit and lock timeouts

export interface OnlineSchemaChangeSpec {
  id: string;
  table: string;
  operation: "ADD_COLUMN" | "DROP_COLUMN" | "ALTER_TYPE" | "ADD_INDEX" | "DROP_INDEX" | "BACKFILL";
  column?: string;
  definition?: string;
  strategy: OnlineSchemaChangeStrategy;
  maxLockTimeoutMs: number;       // Max allowable lock acquisition time (e.g., 50ms)
  maxWriteBlockingMs: number;     // Hard SLA on write blocking duration (e.g., 100ms)
  batchSize?: number;             // Chunks for backfill (e.g., 5000 rows)
  estimatedRowCount?: number;
}

export interface OnlineSchemaChangeMeasurement {
  specId: string;
  table: string;
  rowCount: number;
  lockAcquisitionDurationMs: number;
  writeBlockingDurationMs: number;
  totalExecutionDurationMs: number;
  withinSla: boolean;
  strategy: OnlineSchemaChangeStrategy;
}

/**
 * Validates whether an OSC operation and measurement adheres to strict non-blocking SLAs.
 */
export function validateOnlineSchemaChangeSla(
  spec: OnlineSchemaChangeSpec,
  measurement: OnlineSchemaChangeMeasurement
): { valid: boolean; reason?: string } {
  if (measurement.writeBlockingDurationMs > spec.maxWriteBlockingMs) {
    return {
      valid: false,
      reason: `Write blocking duration ${measurement.writeBlockingDurationMs}ms exceeds max SLA threshold ${spec.maxWriteBlockingMs}ms on table "${spec.table}".`,
    };
  }

  if (measurement.lockAcquisitionDurationMs > spec.maxLockTimeoutMs) {
    return {
      valid: false,
      reason: `Lock acquisition duration ${measurement.lockAcquisitionDurationMs}ms exceeds timeout ${spec.maxLockTimeoutMs}ms on table "${spec.table}".`,
    };
  }

  return { valid: true };
}
