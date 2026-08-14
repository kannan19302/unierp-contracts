import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertContractSecurity } from "./contract-security.ts";
import type { ContractMetaSchema } from "./meta-schema.ts";

describe("Contract Security Review", () => {
  it("should fail review if a contract exposes a forbidden field like passwordHash", () => {
    const contract: ContractMetaSchema = {
      contractId: "test.forbidden",
      description: "Test contract",
      specification: {
        method: "GET",
        path: "/test",
        permissionsRequired: ["user.read"],
        responseSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            passwordHash: { type: "string" }
          }
        }
      },
      tags: [],
      version: "1.0.0"
    };

    const violations = assertContractSecurity(contract);
    assert.equal(violations.length, 1);
    assert.equal(violations[0].riskType, "OVER_EXPOSURE");
    assert.equal(violations[0].field, "passwordHash");
  });

  it("should fail review if a contract allows mass assignment of privileged field without permission", () => {
    const contract: ContractMetaSchema = {
      contractId: "test.mass_assignment",
      description: "Test contract",
      specification: {
        method: "POST",
        path: "/test",
        permissionsRequired: ["user.write"], // Not high privileged
        requestSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            isAdmin: { type: "boolean" }
          }
        }
      },
      tags: [],
      version: "1.0.0"
    };

    const violations = assertContractSecurity(contract);
    assert.equal(violations.length, 1);
    assert.equal(violations[0].riskType, "MASS_ASSIGNMENT");
    assert.equal(violations[0].field, "isAdmin");
  });

  it("should pass review if contract uses privileged field with correct permission", () => {
    const contract: ContractMetaSchema = {
      contractId: "test.mass_assignment_allowed",
      description: "Test contract",
      specification: {
        method: "POST",
        path: "/test",
        permissionsRequired: ["system.admin"], // High privileged
        requestSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            isAdmin: { type: "boolean" }
          }
        }
      },
      tags: [],
      version: "1.0.0"
    };

    const violations = assertContractSecurity(contract);
    assert.equal(violations.length, 0);
  });
});
