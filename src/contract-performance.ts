/**
 * src/contract-performance.ts
 *
 * Phase P12-082: Contract performance implications.
 *
 * Exit criterion:
 *   "Contract shapes that do not force N+1 access or over-fetching on consumers.
 *    An endpoint forcing a waterfall on a documented consumer journey is reported."
 *
 * This module defines:
 *   - CANONICAL_CONSUMER_JOURNEYS: documented consumer journeys with their expected access patterns
 *   - WaterfallDetectedError: thrown when an endpoint requires N+1 access for a consumer journey
 *   - OverFetchingDetectedError: thrown when an endpoint returns significantly more fields than a journey needs
 *   - assertNoWaterfallOnJourney: mechanically detects waterfall anti-pattern
 *   - assertNoOverFetchingOnJourney: mechanically detects over-fetching anti-pattern
 */

export interface ConsumerJourney {
  /** Unique identifier for this journey */
  journeyId: string;
  /** Human-readable description */
  label: string;
  /**
   * The ordered list of endpoint calls a consumer must make to complete this journey.
   * A journey requiring >1 call for a single logical operation is a waterfall candidate.
   */
  requiredEndpointCalls: string[];
  /**
   * The fields a consumer actually uses from the response.
   * Used to detect over-fetching.
   */
  consumedResponseFields: string[];
}

/**
 * Canonical set of documented consumer journeys.
 * Each entry represents a real consumer use-case that contract shapes must support without forcing waterfalls.
 */
export const CANONICAL_CONSUMER_JOURNEYS: ConsumerJourney[] = [
  {
    journeyId: "J001_LIST_INVOICES_WITH_TENANT",
    label: "List invoices filtered by tenant — single request",
    requiredEndpointCalls: ["GET /invoices"],
    consumedResponseFields: ["id", "invoiceNumber", "amount", "status", "tenantId"],
  },
  {
    journeyId: "J002_GET_USER_WITH_PERMISSIONS",
    label: "Get user plus their permissions — must not require two round-trips",
    requiredEndpointCalls: ["GET /users/:id"],
    consumedResponseFields: ["id", "email", "displayName", "permissions"],
  },
  {
    journeyId: "J003_LIST_ORDERS_WITH_LINE_ITEMS",
    label: "List orders with embedded line items — single request",
    requiredEndpointCalls: ["GET /orders"],
    consumedResponseFields: ["id", "orderNumber", "status", "lineItems"],
  },
  {
    journeyId: "J004_DASHBOARD_SUMMARY",
    label: "Dashboard summary — single aggregated endpoint, not N separate calls",
    requiredEndpointCalls: ["GET /dashboard/summary"],
    consumedResponseFields: ["invoiceCount", "pendingAmount", "overdueCount", "recentActivity"],
  },
];

export class WaterfallDetectedError extends Error {
  readonly journeyId: string;
  readonly endpointId: string;
  readonly callCount: number;

  constructor(journeyId: string, endpointId: string, callCount: number) {
    super(
      `P12-082 waterfall detected: Journey "${journeyId}" requires ${callCount} sequential calls ` +
        `where 1 is expected. Endpoint "${endpointId}" forces a waterfall access pattern. ` +
        `Redesign the contract to serve this journey in a single request.`
    );
    this.name = "WaterfallDetectedError";
    this.journeyId = journeyId;
    this.endpointId = endpointId;
    this.callCount = callCount;
  }
}

export class OverFetchingDetectedError extends Error {
  readonly journeyId: string;
  readonly endpointId: string;
  readonly returnedFieldCount: number;
  readonly consumedFieldCount: number;
  readonly overfetchRatio: number;

  constructor(
    journeyId: string,
    endpointId: string,
    returnedFieldCount: number,
    consumedFieldCount: number,
    overfetchRatio: number
  ) {
    super(
      `P12-082 over-fetching detected: Journey "${journeyId}" uses ${consumedFieldCount} of ` +
        `${returnedFieldCount} fields returned by "${endpointId}" (ratio: ${overfetchRatio.toFixed(2)}x). ` +
        `The contract is returning significantly more data than the consumer needs. ` +
        `Consider field projection or a more targeted contract shape.`
    );
    this.name = "OverFetchingDetectedError";
    this.journeyId = journeyId;
    this.endpointId = endpointId;
    this.returnedFieldCount = returnedFieldCount;
    this.consumedFieldCount = consumedFieldCount;
    this.overfetchRatio = overfetchRatio;
  }
}

/**
 * Maximum over-fetch ratio: if an endpoint returns more than this multiple of the
 * fields a consumer actually uses, it is reported as over-fetching.
 */
export const OVER_FETCH_RATIO_THRESHOLD = 3.0;

/**
 * Asserts that an endpoint does not force a waterfall on a documented consumer journey.
 *
 * A waterfall is defined as: a journey that conceptually requires 1 logical operation
 * but which the current contract shape forces into N sequential HTTP calls.
 *
 * @param journey              - The documented consumer journey
 * @param actualCallSequence   - The actual sequence of calls a consumer must make
 * @param endpointId           - Which endpoint triggered this check
 * @throws WaterfallDetectedError when the actual call sequence exceeds the journey's declared maximum
 */
export function assertNoWaterfallOnJourney(
  journey: ConsumerJourney,
  actualCallSequence: string[],
  endpointId: string
): { verified: true; journeyId: string; callCount: number } {
  const maxAllowed = journey.requiredEndpointCalls.length;
  if (actualCallSequence.length > maxAllowed) {
    throw new WaterfallDetectedError(journey.journeyId, endpointId, actualCallSequence.length);
  }
  return { verified: true, journeyId: journey.journeyId, callCount: actualCallSequence.length };
}

/**
 * Asserts that an endpoint does not over-fetch for a documented consumer journey.
 *
 * Over-fetching is defined as: the endpoint returning significantly more fields than
 * the consumer actually consumes, beyond the configured threshold.
 *
 * @param journey              - The documented consumer journey
 * @param returnedFields       - Fields actually returned by the endpoint's response shape
 * @param endpointId           - Which endpoint triggered this check
 * @throws OverFetchingDetectedError when the over-fetch ratio exceeds the threshold
 */
export function assertNoOverFetchingOnJourney(
  journey: ConsumerJourney,
  returnedFields: string[],
  endpointId: string
): { verified: true; journeyId: string; ratio: number } {
  const consumedCount = journey.consumedResponseFields.length;
  const returnedCount = returnedFields.length;

  if (consumedCount === 0 || returnedCount === 0) {
    return { verified: true, journeyId: journey.journeyId, ratio: 1.0 };
  }

  const ratio = returnedCount / consumedCount;
  if (ratio > OVER_FETCH_RATIO_THRESHOLD) {
    throw new OverFetchingDetectedError(
      journey.journeyId,
      endpointId,
      returnedCount,
      consumedCount,
      ratio
    );
  }

  return { verified: true, journeyId: journey.journeyId, ratio };
}
