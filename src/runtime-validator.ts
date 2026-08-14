/**
 * @file runtime-validator.ts
 * @description Runtime Request and Response Contract Validator Interceptor / Middleware Primitives.
 * Phase P12-060: Contract validation at runtime.
 *
 * Exit criterion:
 *   "Services validating requests and responses against their own contracts.
 *    A response diverging from its contract fails in test and is caught before release"
 */

export class RuntimeContractDivergenceError extends Error {
  public readonly endpoint: string;
  public readonly direction: "REQUEST" | "RESPONSE";
  public readonly violations: string[];

  constructor(endpoint: string, direction: "REQUEST" | "RESPONSE", violations: string[]) {
    super(
      `Runtime contract divergence detected on ${direction} for "${endpoint}":\n - ${violations.join("\n - ")}`
    );
    this.name = "RuntimeContractDivergenceError";
    this.endpoint = endpoint;
    this.direction = direction;
    this.violations = violations;
  }
}

export interface RuntimeValidationContext {
  endpoint: string;
  expectedSchema: {
    type?: string;
    required?: string[];
    properties?: Record<string, { type?: string; format?: string }>;
  };
}

/**
 * Validates runtime request or response payloads against expected contract schemas.
 * Throws RuntimeContractDivergenceError if any schema mismatch or required property absence is detected.
 */
export function validateRuntimePayload(
  direction: "REQUEST" | "RESPONSE",
  payload: any,
  context: RuntimeValidationContext
): { valid: true } {
  const violations: string[] = [];

  if (!payload || typeof payload !== "object") {
    violations.push("Payload must be a non-null object");
  } else {
    const { required, properties } = context.expectedSchema;

    if (required && Array.isArray(required)) {
      for (const field of required) {
        if (payload[field] === undefined || payload[field] === null) {
          violations.push(`Missing required field "${field}"`);
        }
      }
    }

    if (properties && typeof properties === "object") {
      for (const [key, propSpec] of Object.entries(properties)) {
        if (payload[key] !== undefined && payload[key] !== null) {
          const actualType = typeof payload[key];
          if (propSpec.type && propSpec.type !== actualType) {
            violations.push(
              `Field "${key}" expected type "${propSpec.type}" but received "${actualType}"`
            );
          }
        }
      }
    }
  }

  if (violations.length > 0) {
    throw new RuntimeContractDivergenceError(context.endpoint, direction, violations);
  }

  return { valid: true };
}
