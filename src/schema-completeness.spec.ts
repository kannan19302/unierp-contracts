import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertEndpointSchemaCompleteness, IncompleteContractSchemaError } from "./schema-completeness.ts";
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
});
