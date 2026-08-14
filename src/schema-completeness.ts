/**
 * @file schema-completeness.ts
 * @description Canonical Contract Request, Success Response, and RFC 7807 Error Response Schema Completeness validator.
 * Phase P12-059: Request and response schema completeness.
 *
 * Exit criterion:
 *   "Full typed schemas including error shapes, not only success paths.
 *    A response shape absent from the contract fails a gate, including error responses"
 */

import type { PlatformErrorCode } from "./errors.ts";

export interface Rfc7807ErrorResponse {
  type: string; // URI reference resolving to error type documentation
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: PlatformErrorCode | string;
  invalidParams?: Array<{
    name: string;
    reason: string;
  }>;
  tenantId?: string;
  correlationId?: string;
  timestamp: string;
}

export interface CompleteEndpointContractSpec {
  endpointId: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  request: {
    headersSchema?: Record<string, any>;
    paramsSchema?: Record<string, any>;
    querySchema?: Record<string, any>;
    bodySchema?: Record<string, any>;
  };
  responses: {
    success: {
      statusCode: number;
      schema: Record<string, any>;
    };
    errors: Array<{
      statusCode: number;
      code: PlatformErrorCode | string;
      schema: Record<string, any>;
    }>;
  };
}

export class IncompleteContractSchemaError extends Error {
  public readonly endpointId: string;
  public readonly missingShapes: string[];

  constructor(endpointId: string, missingShapes: string[]) {
    super(
      `Contract for endpoint "${endpointId}" is incomplete:\n - ${missingShapes.join("\n - ")}`
    );
    this.name = "IncompleteContractSchemaError";
    this.endpointId = endpointId;
    this.missingShapes = missingShapes;
  }
}

/**
 * Asserts that an endpoint contract declares complete typed schemas for both success and all error status codes.
 */
export function assertEndpointSchemaCompleteness(spec: CompleteEndpointContractSpec): { complete: true } {
  const missing: string[] = [];

  if (!spec.endpointId) missing.push("Missing endpointId");
  if (!spec.method) missing.push("Missing HTTP method");
  if (!spec.path) missing.push("Missing route path");

  if (!spec.responses) {
    missing.push("Missing responses definition");
  } else {
    if (!spec.responses.success || typeof spec.responses.success.statusCode !== "number" || !spec.responses.success.schema) {
      missing.push("Missing or incomplete success response schema");
    }

    if (!Array.isArray(spec.responses.errors) || spec.responses.errors.length === 0) {
      missing.push("Missing error response schemas (must declare typed error shapes for 4xx/5xx)");
    } else {
      for (const errResp of spec.responses.errors) {
        if (!errResp.statusCode || errResp.statusCode < 400) {
          missing.push(`Invalid error status code: ${errResp.statusCode}`);
        }
        if (!errResp.code) {
          missing.push(`Error response for status ${errResp.statusCode} missing canonical error code`);
        }
        if (!errResp.schema) {
          missing.push(`Error response for status ${errResp.statusCode} missing RFC 7807 schema definition`);
        }
      }
    }
  }

  if (missing.length > 0) {
    throw new IncompleteContractSchemaError(spec.endpointId || "unknown", missing);
  }

  return { complete: true };
}
