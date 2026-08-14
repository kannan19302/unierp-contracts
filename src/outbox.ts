/**
 * @file outbox.ts
 * @description Canonical Transactional Outbox primitives, event envelopes, dispatch status, and atomic commit contracts.
 * Phase P12-048: The outbox.
 *
 * Exit criterion:
 *   "An event and its causing write commit atomically. Killing the process between them is proven impossible"
 */

export type OutboxDeliveryStatus = "PENDING" | "LEASED" | "COMPLETED" | "DEAD";

export interface OutboxEventRecord<T = unknown> {
  id: string;
  tenantId: string;
  eventName: string;
  eventVersion: number;
  aggregateType: string;
  aggregateId: string;
  sequence: number;
  occurredAt: string;
  payload: T;
  correlationId?: string | null;
  causationId?: string | null;
  eventKey: string;
}

export interface OutboxDeliveryRecord {
  id: string;
  tenantId: string;
  outboxEventId: string;
  destination: string;
  status: OutboxDeliveryStatus;
  attempts: number;
  leaseOwner?: string | null;
  leaseExpiresAt?: string | null;
  availableAt: string;
  lastError?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutboxWriteParams<T = Record<string, unknown>> {
  tenantId: string;
  eventName: string;
  eventVersion: number;
  aggregateType: string;
  aggregateId: string;
  payload: T;
  correlationId?: string;
  causationId?: string;
  eventKey?: string;
  destinations?: string[];
}

export interface OutboxAtomicTx {
  outboxEvent: {
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; eventKey: string }>;
    aggregate?: (args: { where: Record<string, unknown>; _max: { sequence: boolean } }) => Promise<{ _max: { sequence: number | null } }>;
  };
  outboxDelivery: {
    createMany: (args: { data: Record<string, unknown>[]; skipDuplicates?: boolean }) => Promise<{ count: number }>;
  };
}

export class DualWriteNonAtomicError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "Dual-write anti-pattern detected: publishing cross-module events outside a database transaction causes partial-failure divergence."
    );
    this.name = "DualWriteNonAtomicError";
  }
}

/**
 * Creates the canonical OutboxEvent payload to be committed in the same database transaction as the causing write.
 */
export function createOutboxEventPayload<T = Record<string, unknown>>(
  params: OutboxWriteParams<T>,
  sequence = 1
): Omit<OutboxEventRecord<T>, "id" | "occurredAt"> {
  const eventKey =
    params.eventKey ??
    `${params.aggregateType}:${params.aggregateId}:${params.eventName}:${sequence}`;

  return {
    tenantId: params.tenantId,
    eventName: params.eventName,
    eventVersion: params.eventVersion,
    aggregateType: params.aggregateType,
    aggregateId: params.aggregateId,
    sequence,
    payload: params.payload,
    correlationId: params.correlationId ?? null,
    causationId: params.causationId ?? null,
    eventKey,
  };
}

/**
 * Validates that an event emission is routed transactionally through the outbox.
 */
export function assertTransactionalOutbox(tx: unknown): asserts tx is OutboxAtomicTx {
  if (!tx || typeof tx !== "object" || !("outboxEvent" in tx) || !("outboxDelivery" in tx)) {
    throw new DualWriteNonAtomicError(
      "Direct asynchronous event emission without transactional outbox client is forbidden."
    );
  }
}
