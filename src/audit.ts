/**
 * @file audit.ts
 * @description Canonical append-only, immutable audit trail primitives, tamper detection, and verification contracts.
 * Phase P12-047: Audit primitives.
 */

export interface AuditEventPayload {
  id?: string;
  tenantId: string;
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  actorType?: "USER" | "SYSTEM" | "API_KEY" | "SERVICE_ACCOUNT";
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
  /** Cryptographic integrity hash linking previous audit entry (hash-chaining) */
  previousHash?: string;
  currentHash?: string;
}

export interface ImmutableAuditRecord {
  id: string;
  tenantId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  userId: string | null;
  actorType: string;
  details: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  previousHash: string | null;
  currentHash: string;
}

export class AuditImmutabilityViolationError extends Error {
  constructor(operation: "UPDATE" | "DELETE" | "TRUNCATE", recordId?: string) {
    super(
      `Forbidden audit trail mutation: ${operation} operation is disallowed on append-only immutable audit records${
        recordId ? ` (record: ${recordId})` : ""
      }.`
    );
    this.name = "AuditImmutabilityViolationError";
  }
}

/**
 * Validates that an audit write operation is strictly an INSERT / append.
 */
export function assertAuditAppendOnly(operation: string, recordId?: string): void {
  const normalized = operation.toUpperCase().trim();
  if (normalized === "UPDATE" || normalized === "DELETE" || normalized === "TRUNCATE" || normalized === "UPSERT") {
    throw new AuditImmutabilityViolationError(normalized as any, recordId);
  }
}

/**
 * Computes deterministic SHA-256 hash for audit record hash-chaining.
 */
export function computeAuditRecordHash(
  payload: Omit<AuditEventPayload, "currentHash">,
  hashFn: (input: string) => string
): string {
  const canonicalString = [
    payload.tenantId,
    payload.action,
    payload.resource,
    payload.resourceId || "",
    payload.userId || "",
    payload.timestamp || "",
    payload.previousHash || "GENESIS",
    JSON.stringify(payload.details || {}),
  ].join("|");

  return hashFn(canonicalString);
}
