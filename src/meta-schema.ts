/**
 * @file meta-schema.ts
 * @description Canonical Contract Structure and Meta-Schema validator.
 * Phase P12-057: Contract format and structure.
 *
 * Exit criterion:
 *   "A malformed contract fails the build. Every contract validates against the meta-schema"
 */

export interface ContractMetaSchema {
  contractId: string;
  version: string;
  kind: "HTTP_ENDPOINT" | "EVENT" | "DATA_MODEL" | "SERVICE_RPC";
  metadata: {
    title: string;
    description: string;
    ownerModule: string;
    stability: "ALPHA" | "BETA" | "STABLE" | "DEPRECATED";
  };
  specification: {
    requestSchema?: Record<string, any>;
    responseSchema?: Record<string, any>;
    payloadSchema?: Record<string, any>;
    permissionsRequired?: string[];
    tenantIsolated: boolean;
  };
}

export class MalformedContractDefinitionError extends Error {
  public readonly contractId: string;
  public readonly validationErrors: string[];

  constructor(contractId: string, validationErrors: string[]) {
    super(
      `Contract "${contractId}" is malformed and failed meta-schema validation:\n - ${validationErrors.join("\n - ")}`
    );
    this.name = "MalformedContractDefinitionError";
    this.contractId = contractId;
    this.validationErrors = validationErrors;
  }
}

/**
 * Validates any declared contract against the canonical UniERP Contract Meta-Schema.
 */
export function validateContractMetaSchema(contract: any): { valid: true } {
  const errors: string[] = [];

  if (!contract || typeof contract !== "object") {
    throw new MalformedContractDefinitionError("unknown", ["Contract must be a valid non-null object"]);
  }

  const contractId = contract.contractId || "unknown";

  if (!contract.contractId || typeof contract.contractId !== "string") {
    errors.push("Missing or invalid 'contractId' (must be non-empty string)");
  }

  if (!contract.version || typeof contract.version !== "string" || !/^\d+\.\d+\.\d+$/.test(contract.version)) {
    errors.push("Missing or invalid semver 'version' (expected x.y.z format)");
  }

  const validKinds = ["HTTP_ENDPOINT", "EVENT", "DATA_MODEL", "SERVICE_RPC"];
  if (!contract.kind || !validKinds.includes(contract.kind)) {
    errors.push(`Invalid contract 'kind' (must be one of: ${validKinds.join(", ")})`);
  }

  if (!contract.metadata || typeof contract.metadata !== "object") {
    errors.push("Missing 'metadata' object");
  } else {
    if (!contract.metadata.title) errors.push("Missing 'metadata.title'");
    if (!contract.metadata.ownerModule) errors.push("Missing 'metadata.ownerModule'");
    const validStabilities = ["ALPHA", "BETA", "STABLE", "DEPRECATED"];
    if (!contract.metadata.stability || !validStabilities.includes(contract.metadata.stability)) {
      errors.push(`Invalid 'metadata.stability' (must be one of: ${validStabilities.join(", ")})`);
    }
  }

  if (!contract.specification || typeof contract.specification !== "object") {
    errors.push("Missing 'specification' object");
  } else {
    if (typeof contract.specification.tenantIsolated !== "boolean") {
      errors.push("Missing or non-boolean 'specification.tenantIsolated'");
    }
  }

  if (errors.length > 0) {
    throw new MalformedContractDefinitionError(contractId, errors);
  }

  return { valid: true };
}
