/**
 * @file soft-delete.ts
 * @description L0 Contract and primitives for Soft Delete, Archival, and Restoration across all platform entities.
 *
 * P12-041: Soft delete and archival primitives.
 * "Shared soft-delete, archive and restore semantics rather than per-module reinvention.
 *  A module implementing its own soft-delete fails an architecture gate."
 */

export interface SoftDeletable {
  deletedAt: Date | string | null;
  deletedBy?: string | null;
  deletedReason?: string | null;
}

export interface Archivable extends SoftDeletable {
  isArchived: boolean;
  archivedAt?: Date | string | null;
  archivedBy?: string | null;
}

export interface SoftDeleteOptions {
  deletedBy?: string;
  reason?: string;
  timestamp?: Date;
}

export interface RestoreOptions {
  restoredBy?: string;
  timestamp?: Date;
}

/**
 * Generates canonical database update payload for soft-deleting an entity.
 */
export function createSoftDeletePayload(options: SoftDeleteOptions = {}): {
  deletedAt: Date;
  deletedBy: string | null;
  deletedReason: string | null;
} {
  return {
    deletedAt: options.timestamp || new Date(),
    deletedBy: options.deletedBy || null,
    deletedReason: options.reason || null,
  };
}

/**
 * Generates canonical database update payload for restoring a soft-deleted entity.
 */
export function createRestorePayload(_options: RestoreOptions = {}): {
  deletedAt: null;
  deletedBy: null;
  deletedReason: null;
} {
  return {
    deletedAt: null,
    deletedBy: null,
    deletedReason: null,
  };
}

/**
 * Standard Prisma query filter to exclude soft-deleted records.
 */
export const ACTIVE_RECORD_FILTER = {
  deletedAt: null,
} as const;
