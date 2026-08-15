/**
 * @file contract-registry.ts
 * @description Contract registry and discovery.
 * Phase P12-089: Contract registry and discovery.
 *
 * Exit criterion:
 *   "Any contract's state and consumers are answerable by command"
 */

import { DeprecationMetadata } from "./deprecation.js";

export type ContractState = "ACTIVE" | "DEPRECATED" | "SUNSET";

export interface ContractConsumer {
  consumerId: string;
  version: string;
  contactEmail: string;
}

export interface ContractDefinition {
  contractId: string;
  version: string;
  state: ContractState;
  consumers: ContractConsumer[];
  deprecation?: DeprecationMetadata;
}

export class ContractNotFoundError extends Error {
  constructor(contractId: string, version: string) {
    super(`Contract not found in registry: ${contractId} v${version}`);
    this.name = "ContractNotFoundError";
  }
}

export class ContractRegistry {
  private static contracts = new Map<string, ContractDefinition>();

  public static registerContract(contract: ContractDefinition): void {
    const key = `${contract.contractId}@v${contract.version}`;
    this.contracts.set(key, JSON.parse(JSON.stringify(contract)));
  }

  public static getContract(contractId: string, version: string): ContractDefinition {
    const key = `${contractId}@v${version}`;
    const contract = this.contracts.get(key);
    if (!contract) {
      throw new ContractNotFoundError(contractId, version);
    }
    return JSON.parse(JSON.stringify(contract));
  }

  public static queryContracts(query: { state?: ContractState; consumerId?: string }): ContractDefinition[] {
    const results: ContractDefinition[] = [];
    for (const contract of this.contracts.values()) {
      let match = true;
      if (query.state && contract.state !== query.state) {
        match = false;
      }
      if (query.consumerId && !contract.consumers.some(c => c.consumerId === query.consumerId)) {
        match = false;
      }
      if (match) {
        results.push(JSON.parse(JSON.stringify(contract)));
      }
    }
    return results;
  }

  public static clear(): void {
    this.contracts.clear();
  }
}
