import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  verifyConsumerContractExpectations,
  ConsumerExpectationViolationError,
} from "./consumer-contract-test.ts";
import type { ConsumerExpectation } from "./consumer-contract-test.ts";
import type { CanonicalEndpointContract } from "./contract-compatibility.ts";

describe("Consumer-driven contract tests", () => {
  const providerEndpoints: CanonicalEndpointContract[] = [
    {
      operationId: "getAccountBalance",
      method: "GET",
      path: "/api/v1/accounts/{id}/balance",
      responses: [{ statusCode: 200, schema: { type: "object" } }],
    },
  ];

  it("passes provider CI when provider matches consumer expectations", () => {
    const expectations: ConsumerExpectation[] = [
      {
        consumerName: "unierp-web",
        operationId: "getAccountBalance",
        expectedMethod: "GET",
        expectedPath: "/api/v1/accounts/{id}/balance",
        requiredFieldsInResponse: ["balance", "currency"],
      },
    ];

    const res = verifyConsumerContractExpectations(providerEndpoints, expectations);
    assert.equal(res.verified, true);
    assert.equal(res.verifiedCount, 1);
  });

  it("fails in provider CI when provider introduces a breaking change against consumer", () => {
    const expectations: ConsumerExpectation[] = [
      {
        consumerName: "unierp-mobile",
        operationId: "getAccountBalance",
        expectedMethod: "GET",
        expectedPath: "/api/v2/accounts/{id}/balance", // Mismatched path!
        requiredFieldsInResponse: ["balance"],
      },
    ];

    assert.throws(
      () => verifyConsumerContractExpectations(providerEndpoints, expectations),
      (err: any) => {
        return (
          err instanceof ConsumerExpectationViolationError &&
          err.consumerName === "unierp-mobile" &&
          err.operationId === "getAccountBalance"
        );
      }
    );
  });
});
