import type { ContractMetaSchema } from "./meta-schema.ts";

export type SecurityRiskType = "MASS_ASSIGNMENT" | "OVER_EXPOSURE" | "ENUMERATION";

export interface SecurityViolation {
  contractId: string;
  field: string;
  riskType: SecurityRiskType;
  message: string;
}

const HIGH_PRIVILEGE_FIELDS = ["isAdmin", "role", "roles", "permissions", "isSuperuser", "verified"];
const HIGH_PRIVILEGE_PERMISSIONS = ["iam.write", "users.manage", "system.admin"];

const FORBIDDEN_RESPONSE_FIELDS = ["password", "passwordHash", "salt", "secret", "privateKey"];
const SENSITIVE_RESPONSE_FIELDS = ["ssn", "taxId", "creditCard"];
const SENSITIVE_RESPONSE_PERMISSIONS = ["finance.read", "hr.read", "system.admin"];

export function assertContractSecurity(contract: ContractMetaSchema): SecurityViolation[] {
  const violations: SecurityViolation[] = [];
  const requiredPerms = contract.specification.permissionsRequired || [];

  if (contract.specification.requestSchema) {
    const fields = extractAllFields(contract.specification.requestSchema);
    for (const field of fields) {
      if (HIGH_PRIVILEGE_FIELDS.includes(field)) {
        const hasPrivilegedPerm = requiredPerms.some(p => HIGH_PRIVILEGE_PERMISSIONS.includes(p));
        if (!hasPrivilegedPerm) {
          violations.push({
            contractId: contract.contractId,
            field,
            riskType: "MASS_ASSIGNMENT",
            message: `Request schema allows setting '${field}' but endpoint does not require privileged permissions.`
          });
        }
      }
    }
  }

  if (contract.specification.responseSchema) {
    const fields = extractAllFields(contract.specification.responseSchema);
    for (const field of fields) {
      if (FORBIDDEN_RESPONSE_FIELDS.includes(field)) {
        violations.push({
          contractId: contract.contractId,
          field,
          riskType: "OVER_EXPOSURE",
          message: `Response schema must never expose '${field}'.`
        });
      } else if (SENSITIVE_RESPONSE_FIELDS.includes(field)) {
        const hasSensitivePerm = requiredPerms.some(p => SENSITIVE_RESPONSE_PERMISSIONS.includes(p));
        if (!hasSensitivePerm) {
          violations.push({
            contractId: contract.contractId,
            field,
            riskType: "OVER_EXPOSURE",
            message: `Response schema exposes sensitive field '${field}' but endpoint does not require appropriate permissions.`
          });
        }
      }
    }
  }

  return violations;
}

function extractAllFields(schema: any): string[] {
  const fields = new Set<string>();

  function traverse(obj: any) {
    if (!obj || typeof obj !== "object") return;

    if (obj.properties) {
      for (const [key, value] of Object.entries(obj.properties)) {
        fields.add(key);
        traverse(value);
      }
    }
    if (obj.items) traverse(obj.items);
  }

  traverse(schema);
  return Array.from(fields);
}
