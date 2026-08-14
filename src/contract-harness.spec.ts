/**
 * @file contract-harness.spec.ts
 * @description Unit tests for the contract testing infrastructure harness.
 */

import { describe, it, expect } from "vitest";
import { ContractTestingHarness, type ContractInteraction } from "./contract-harness.js";
import type { CanonicalEndpointContract } from "./contract-compatibility.js";

describe("ContractTestingHarness", () => {
  it("should add and retrieve interactions", () => {
    const harness = new ContractTestingHarness();
    const interaction: ContractInteraction = {
      description: "Should return user profile",
      request: {
        method: "GET",
        path: "/api/v1/users/me"
      },
      response: {
        status: 200,
        body: { id: "user_1" }
      }
    };

    harness.addInteraction(interaction);
    expect(harness.getInteractions()).toHaveLength(1);
    expect(harness.getInteractions()[0]).toEqual(interaction);
  });

  it("should successfully verify provider coverage when routes exist", () => {
    const harness = new ContractTestingHarness();
    harness.addInteraction({
      description: "Get user",
      request: { method: "GET", path: "/users" },
      response: { status: 200 }
    });

    const providerEndpoints: CanonicalEndpointContract[] = [
      {
        operationId: "getUsers",
        method: "GET",
        path: "/users",
        requestSchemaHash: "hash1",
        responseSchemaHash: "hash2"
      }
    ];

    const result = harness.verifyProviderCoverage(providerEndpoints);
    expect(result.verified).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("should throw an error when provider is missing expected routes", () => {
    const harness = new ContractTestingHarness();
    harness.addInteraction({
      description: "Create user",
      request: { method: "POST", path: "/users" },
      response: { status: 201 }
    });

    const providerEndpoints: CanonicalEndpointContract[] = [
      {
        operationId: "getUsers",
        method: "GET",
        path: "/users",
        requestSchemaHash: "hash1",
        responseSchemaHash: "hash2"
      }
    ];

    expect(() => harness.verifyProviderCoverage(providerEndpoints)).toThrowError(
      "Provider is missing expected routes: POST /users"
    );
  });
});
