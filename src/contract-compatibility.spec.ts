import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyContractChanges,
  assertContractCompatibility,
  BreakingContractChangeDetectedError,
} from "./contract-compatibility.ts";
import type { CanonicalEndpointContract } from "./meta-schema.ts";

describe("Contract compatibility classification", () => {
  const baseContract: CanonicalEndpointContract = {
    operationId: "getUsers",
    method: "GET",
    path: "/api/v1/users",
    description: "List users",
    parameters: [{ name: "limit", in: "query", required: false, schema: { type: "number" } }],
    responses: [
      { statusCode: 200, description: "Success", schema: { type: "array" } },
      { statusCode: 400, description: "Bad Request", schema: { type: "object" } },
    ],
  };

  it("classifies adding an optional parameter as COMPATIBLE", () => {
    const candidate: CanonicalEndpointContract = {
      ...baseContract,
      parameters: [
        { name: "limit", in: "query", required: false, schema: { type: "number" } },
        { name: "offset", in: "query", required: false, schema: { type: "number" } },
      ],
    };

    const res = classifyContractChanges([baseContract], [candidate]);
    assert.equal(res.classification, "COMPATIBLE");
    assert.equal(res.breakingChanges.length, 0);
    assert.equal(res.compatibleChanges.length, 1);
  });

  it("classifies removing an endpoint as BREAKING and throws", () => {
    const res = classifyContractChanges([baseContract], []);
    assert.equal(res.classification, "BREAKING");
    assert.equal(res.breakingChanges.length, 1);

    assert.throws(
      () => assertContractCompatibility([baseContract], []),
      BreakingContractChangeDetectedError
    );
  });

  it("classifies adding a required query parameter as BREAKING and throws", () => {
    const candidate: CanonicalEndpointContract = {
      ...baseContract,
      parameters: [
        { name: "limit", in: "query", required: false, schema: { type: "number" } },
        { name: "tenantId", in: "query", required: true, schema: { type: "string" } },
      ],
    };

    const res = classifyContractChanges([baseContract], [candidate]);
    assert.equal(res.classification, "BREAKING");
    assert.equal(res.breakingChanges.length, 1);

    assert.throws(
      () => assertContractCompatibility([baseContract], [candidate]),
      BreakingContractChangeDetectedError
    );
  });
});
