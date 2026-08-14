/**
 * @file idempotency.ts
 * @description Canonical Idempotency Primitives and Mutation Contract Guards.
 * Phase P12-067: Idempotency convention.
 *
 * Exit criterion:
 *   "Idempotency keys as a contract-level concern on every mutating endpoint.
 *    A mutating endpoint without idempotency support fails a gate"
 */

export interface IdempotencyHeaderSpec {
  headerName: "Idempotency-Key" | "X-Idempotency-Key";
  required: boolean;
  ttlSeconds: number;
}

export interface MutatingEndpointContract {
  endpointId: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  idempotency: IdempotencyHeaderSpec;
}

export class MissingIdempotencySupportError extends Error {
  public readonly endpointId: string;
  public readonly method: string;

  constructor(endpointId: string, method: string) {
    super(
      `Mutating endpoint "${endpointId}" [${method}] does not declare contract-level idempotency key support.`
    );
    this.name = "MissingIdempotencySupportError";
    this.endpointId = endpointId;
    this.method = method;
  }
}

/**
 * Validates that any mutating HTTP endpoint declares idempotency specification in its contract.
 */
export function assertMutatingEndpointIdempotency(spec: MutatingEndpointContract): { verified: true } {
  const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (mutatingMethods.includes(spec.method)) {
    if (!spec.idempotency || !spec.idempotency.headerName) {
      throw new MissingIdempotencySupportError(spec.endpointId, spec.method);
    }
  }
  return { verified: true };
}
