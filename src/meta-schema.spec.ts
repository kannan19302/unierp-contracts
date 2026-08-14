import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateContractMetaSchema, MalformedContractDefinitionError } from "./meta-schema.ts";

describe("Contract format and structure meta-schema", () => {
  it("validates well-formed contract definition against meta-schema", () => {
    const validContract = {
      contractId: "contracts.invoice.create",
      version: "1.0.0",
      kind: "HTTP_ENDPOINT",
      metadata: {
        title: "Create Invoice",
        description: "Creates and persists a new sales invoice",
        ownerModule: "invoicing",
        stability: "STABLE",
      },
      specification: {
        requestSchema: { type: "object", properties: { amount: { type: "number" } } },
        responseSchema: { type: "object", properties: { invoiceId: { type: "string" } } },
        permissionsRequired: ["invoicing:create"],
        tenantIsolated: true,
      },
    };

    const res = validateContractMetaSchema(validContract);
    assert.equal(res.valid, true);
  });

  it("throws MalformedContractDefinitionError on schema violations", () => {
    const malformedContract = {
      contractId: "contracts.invoice.bad",
      version: "invalid-version",
      kind: "UNKNOWN_KIND",
      metadata: {
        title: "Missing fields",
      },
    };

    assert.throws(() => validateContractMetaSchema(malformedContract), (err: any) => {
      return err instanceof MalformedContractDefinitionError && err.validationErrors.length > 0;
    });
  });
});
