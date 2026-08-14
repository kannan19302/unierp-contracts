import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertEndpointSchemaCompleteness,
  IncompleteContractSchemaError,
  assertRfc7807ErrorPayloadConvention,
  OffConventionErrorResponseError,
} from "./schema-completeness.ts";
import type { CompleteEndpointContractSpec } from "./schema-completeness.ts";

describe("Request and response schema completeness", () => {
  it("passes when complete request, success, and RFC 7807 error schemas are defined", () => {
    const validEndpoint: CompleteEndpointContractSpec = {
      endpointId: "api.v1.invoices.create",
      method: "POST",
      path: "/api/v1/invoices",
      request: {
        bodySchema: { type: "object", required: ["customerId", "lines"] },
      },
      responses: {
        success: {
          statusCode: 201,
          schema: { type: "object", required: ["invoiceId", "totalAmount"] },
        },
        errors: [
          {
            statusCode: 400,
            code: "VALIDATION_FAILED",
            schema: { type: "object", required: ["type", "title", "status", "invalidParams"] },
          },
          {
            statusCode: 403,
            code: "AUTH_FORBIDDEN",
            schema: { type: "object", required: ["type", "title", "status", "code"] },
          },
        ],
      },
    };

    const res = assertEndpointSchemaCompleteness(validEndpoint);
    assert.equal(res.complete, true);
  });

  it("throws IncompleteContractSchemaError when error response shapes are absent", () => {
    const incompleteEndpoint: any = {
      endpointId: "api.v1.invoices.bad",
      method: "POST",
      path: "/api/v1/invoices",
      request: {},
      responses: {
        success: {
          statusCode: 200,
          schema: { type: "object" },
        },
        // missing error schemas
      },
    };

    assert.throws(() => assertEndpointSchemaCompleteness(incompleteEndpoint), (err: any) => {
      return err instanceof IncompleteContractSchemaError && err.missingShapes.length > 0;
    });
  });

  it("passes compliant RFC 7807 error payload with registry code", () => {
    const errorPayload = {
      type: "https://api.unierp.io/errors/RESOURCE_NOT_FOUND",
      title: "Resource Not Found",
      status: 404,
      detail: "Order order_123 was not found in the current tenant context",
      instance: "/api/v1/orders/order_123",
      code: "RESOURCE_NOT_FOUND",
      timestamp: "2026-08-14T22:30:00Z",
    };

    const res = assertRfc7807ErrorPayloadConvention("/api/v1/orders/order_123", errorPayload);
    assert.equal(res.verified, true);
  });

  it("throws OffConventionErrorResponseError when error response misses RFC 7807 required fields", () => {
    const nonCompliantError = {
      error: "Not Found",
      status: 404,
      // missing type, title, detail, instance, code, timestamp
    };

    assert.throws(
      () => assertRfc7807ErrorPayloadConvention("/api/v1/orders/order_123", nonCompliantError as any),
      (err: any) => {
        return (
          err instanceof OffConventionErrorResponseError &&
          err.endpoint === "/api/v1/orders/order_123" &&
          err.missingFields.includes("code")
        );
      }
    );
  });
});
