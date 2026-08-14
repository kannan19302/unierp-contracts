/**
 * @file contract-harness.ts
 * @description Contract testing infrastructure harness for consumers and providers.
 * Phase P12-084: Contract testing infrastructure.
 */

import type { CanonicalEndpointContract } from "./contract-compatibility.js";

export interface ContractInteraction {
  description: string;
  providerState?: string;
  request: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response: {
    status: number;
    headers?: Record<string, string>;
    body?: any;
  };
}

export class ContractTestingHarness {
  private interactions: ContractInteraction[] = [];

  /**
   * Adds an expected interaction (contract test case) between consumer and provider.
   */
  public addInteraction(interaction: ContractInteraction): this {
    this.interactions.push(interaction);
    return this;
  }

  /**
   * Returns all recorded interactions.
   */
  public getInteractions(): ContractInteraction[] {
    return this.interactions;
  }

  /**
   * Verifies that the provider endpoints actually cover the expected interactions.
   */
  public verifyProviderCoverage(providerEndpoints: CanonicalEndpointContract[]): { verified: boolean; missing: string[] } {
    const providerMap = new Map<string, CanonicalEndpointContract>();
    for (const ep of providerEndpoints) {
      providerMap.set(`${ep.method} ${ep.path}`, ep);
    }

    const missing: string[] = [];
    for (const interaction of this.interactions) {
      const routeKey = `${interaction.request.method} ${interaction.request.path}`;
      if (!providerMap.has(routeKey)) {
        missing.push(routeKey);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Provider is missing expected routes: ${missing.join(", ")}`);
    }

    return { verified: true, missing };
  }
}
