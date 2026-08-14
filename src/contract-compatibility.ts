/**
 * @file contract-compatibility.ts
 * @description Contract Compatibility Classification Engine.
 * Phase P12-070: Contract compatibility checking.
 *
 * Exit criterion:
 *   "Automated classification of every contract change as compatible or breaking.
 *    A breaking change is detected and classified automatically, proven on a seeded change"
 */

export interface ContractParameter {
  name: string;
  in: "query" | "header" | "path" | "body";
  required: boolean;
  schema?: Record<string, any>;
}

export interface ContractResponse {
  statusCode: number;
  description?: string;
  schema?: Record<string, any>;
}

export interface CanonicalEndpointContract {
  operationId: string;
  method: string;
  path: string;
  description?: string;
  parameters?: ContractParameter[];
  responses: ContractResponse[];
}

export type CompatibilityClassification = "COMPATIBLE" | "BREAKING";

export interface ChangeClassificationResult {
  classification: CompatibilityClassification;
  breakingChanges: string[];
  compatibleChanges: string[];
}

export class BreakingContractChangeDetectedError extends Error {
  public readonly breakingChanges: string[];

  constructor(breakingChanges: string[]) {
    super(`Breaking contract changes detected:\n  - ${breakingChanges.join("\n  - ")}`);
    this.name = "BreakingContractChangeDetectedError";
    this.breakingChanges = breakingChanges;
  }
}

/**
 * Classifies contract changes between baseline and candidate endpoints.
 */
export function classifyContractChanges(
  baseline: CanonicalEndpointContract[],
  candidate: CanonicalEndpointContract[]
): ChangeClassificationResult {
  const breakingChanges: string[] = [];
  const compatibleChanges: string[] = [];

  const baselineMap = new Map<string, CanonicalEndpointContract>();
  for (const ep of baseline) {
    baselineMap.set(ep.operationId, ep);
  }

  const candidateMap = new Map<string, CanonicalEndpointContract>();
  for (const ep of candidate) {
    candidateMap.set(ep.operationId, ep);
  }

  // Check for removed endpoints or modifications to existing endpoints
  for (const [opId, baseEp] of baselineMap.entries()) {
    const candEp = candidateMap.get(opId);
    if (!candEp) {
      breakingChanges.push(`Endpoint removed: ${baseEp.method} ${baseEp.path} (${opId})`);
      continue;
    }

    if (candEp.method !== baseEp.method || candEp.path !== baseEp.path) {
      breakingChanges.push(`Endpoint route changed for ${opId}: ${baseEp.method} ${baseEp.path} -> ${candEp.method} ${candEp.path}`);
    }

    // Check for query parameters changes
    const baseParams = new Map<string, ContractParameter>((baseEp.parameters || []).map((p: ContractParameter) => [p.name, p]));
    const candParams = new Map<string, ContractParameter>((candEp.parameters || []).map((p: ContractParameter) => [p.name, p]));

    for (const [pName, cParam] of candParams.entries()) {
      const bParam = baseParams.get(pName);
      if (!bParam && cParam.required) {
        breakingChanges.push(`New required parameter added to ${opId}: ${pName}`);
      } else if (!bParam && !cParam.required) {
        compatibleChanges.push(`Optional parameter added to ${opId}: ${pName}`);
      }
    }

    // Check for removed response status codes
    const baseStatuses = new Set<number>(baseEp.responses.map((r: ContractResponse) => r.statusCode));
    const candStatuses = new Set<number>(candEp.responses.map((r: ContractResponse) => r.statusCode));

    for (const st of baseStatuses) {
      if (!candStatuses.has(st)) {
        breakingChanges.push(`Response status code ${st} removed from ${opId}`);
      }
    }

    for (const st of candStatuses) {
      if (!baseStatuses.has(st)) {
        compatibleChanges.push(`New response status code ${st} added to ${opId}`);
      }
    }
  }

  // Check for newly added endpoints
  for (const [opId, candEp] of candidateMap.entries()) {
    if (!baselineMap.has(opId)) {
      compatibleChanges.push(`New endpoint added: ${candEp.method} ${candEp.path} (${opId})`);
    }
  }

  const classification: CompatibilityClassification = breakingChanges.length > 0 ? "BREAKING" : "COMPATIBLE";

  return {
    classification,
    breakingChanges,
    compatibleChanges,
  };
}

/**
 * Asserts contract backwards compatibility, throwing BreakingContractChangeDetectedError if breaking.
 */
export function assertContractCompatibility(
  baseline: CanonicalEndpointContract[],
  candidate: CanonicalEndpointContract[]
): { verified: true; compatibleChanges: string[] } {
  const result = classifyContractChanges(baseline, candidate);
  if (result.classification === "BREAKING") {
    throw new BreakingContractChangeDetectedError(result.breakingChanges);
  }
  return { verified: true, compatibleChanges: result.compatibleChanges };
}
