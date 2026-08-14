/**
 * @file transactions.ts
 * @description L0 Contract for Transaction Boundaries, Isolation Levels, and Optimistic Concurrency Control (OCC).
 *
 * P12-040: Transaction and isolation standard.
 * "Declared transaction boundaries and isolation levels used consistently across services.
 *  A concurrent conflict produces a documented, retryable error rather than a lost update."
 */

export type IsolationLevel =
  | "READ_UNCOMMITTED"
  | "READ_COMMITTED"
  | "REPEATABLE_READ"
  | "SERIALIZABLE";

export interface TransactionOptions {
  isolationLevel?: IsolationLevel;
  maxWaitMs?: number;
  timeoutMs?: number;
  readOnly?: boolean;
}

export interface RetryPolicy {
  maxRetries: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
  retryableErrorCodes: string[];
}

export const DEFAULT_OCC_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  initialBackoffMs: 25,
  maxBackoffMs: 200,
  retryableErrorCodes: [
    "P2034",                      // Prisma transaction write conflict / rollback
    "40001",                      // PostgreSQL serialization_failure
    "40P01",                      // PostgreSQL deadlock_detected
    "OPTIMISTIC_LOCK_CONFLICT",   // Domain version mismatch
  ],
};

export class OptimisticConcurrencyConflictError extends Error {
  public readonly code = "OPTIMISTIC_LOCK_CONFLICT";
  public readonly retryable = true;
  public readonly entity: string;
  public readonly expectedVersion: number;
  public readonly actualVersion: number;

  constructor(entity: string, expectedVersion: number, actualVersion: number) {
    super(`Optimistic lock conflict on entity "${entity}": expected version ${expectedVersion}, found ${actualVersion}. Concurrent update detected.`);
    this.name = "OptimisticConcurrencyConflictError";
    this.entity = entity;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }
}

/**
 * Executes an operation with automatic retry on documented serialization and optimistic concurrency conflicts.
 */
export async function executeWithRetry<T>(
  operation: (attempt: number) => Promise<T>,
  policy: RetryPolicy = DEFAULT_OCC_RETRY_POLICY
): Promise<T> {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      return await operation(attempt);
    } catch (err: unknown) {
      const isRetryable =
        (err instanceof OptimisticConcurrencyConflictError && err.retryable) ||
        (typeof err === "object" &&
          err !== null &&
          "code" in err &&
          typeof (err as { code: unknown }).code === "string" &&
          policy.retryableErrorCodes.includes((err as { code: string }).code));

      if (isRetryable && attempt <= policy.maxRetries) {
        const backoff = Math.min(policy.initialBackoffMs * Math.pow(2, attempt - 1), policy.maxBackoffMs);
        await new Promise((resolve) => {
          if (typeof globalThis !== "undefined" && typeof (globalThis as any).setTimeout === "function") {
            (globalThis as any).setTimeout(resolve, backoff);
          } else {
            resolve(undefined);
          }
        });
        continue;
      }
      throw err;
    }
  }
}
