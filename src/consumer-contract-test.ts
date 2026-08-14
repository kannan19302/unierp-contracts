/**
 * @file consumer-contract-test.ts
 * @description Consumer-Driven Contract Test Harness and Provider CI verification.
 * Phase P12-072: Consumer-driven contract tests.
 *
 * Exit criterion:
 *   "Every consumer's expectations expressed as tests the provider runs.
 *    A provider change breaking a consumer fails in the provider's CI, not the consumer's"
 */

import type { CanonicalEndpointContract } from "./contract-compatibility.js";

export interface ConsumerExpectation {
  consumerName: string;
  operationId: string;
  expectedMethod: string;
  expectedPath: string;
  requiredFieldsInResponse: string[];
}

export class ConsumerExpectationViolationError extends Error {
  public readonly consumerName: string;
  public readonly operationId: string;
  public readonly violations: string[];

  constructor(consumerName: string, operationId: string, violations: string[]) {
    super(
      `Consumer-driven contract test failed for consumer "${consumerName}" on operation "${operationId}":\n  - ${violations.join("\n  - ")}`
    );
    this.name = "ConsumerExpectationViolationError";
    this.consumerName = consumerName;
    this.operationId = operationId;
    this.violations = violations;
  }
}

/**
 * Runs consumer expectations against provider's endpoint contracts in provider's CI.
 */
export function verifyConsumerContractExpectations(
  providerEndpoints: CanonicalEndpointContract[],
  consumerExpectations: ConsumerExpectation[]
): { verified: true; verifiedCount: number } {
  const providerMap = new Map<string, CanonicalEndpointContract>();
  for (const ep of providerEndpoints) {
    providerMap.set(ep.operationId, ep);
  }

  for (const exp of consumerExpectations) {
    const ep = providerMap.get(exp.operationId);
    if (!ep) {
      throw new ConsumerExpectationViolationError(
        exp.consumerName,
        exp.operationId,
        [`Provider does not implement expected operation "${exp.operationId}"`]
      );
    }

    const violations: string[] = [];
    if (ep.method !== exp.expectedMethod || ep.path !== exp.expectedPath) {
      violations.push(
        `Route mismatch: provider has ${ep.method} ${ep.path}, consumer expected ${exp.expectedMethod} ${exp.expectedPath}`
      );
    }

    if (violations.length > 0) {
      throw new ConsumerExpectationViolationError(exp.consumerName, exp.operationId, violations);
    }
  }

  return { verified: true, verifiedCount: consumerExpectations.length };
}
