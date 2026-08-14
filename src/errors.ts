/**
 * @kannan19302/contracts — Platform Error Taxonomy & Registry
 *
 * P12-015: The shared error hierarchy and code registry every service and consumer maps to.
 * Maps to RFC 7807 problem details format with tenant, module, and correlation metadata.
 */

export type PlatformErrorCode =
  // Platform / System Errors (1000-1999)
  | "PLATFORM_INTERNAL_ERROR"
  | "PLATFORM_PRECONDITION_FAILED"
  | "PLATFORM_RATE_LIMIT_EXCEEDED"
  | "PLATFORM_SERVICE_UNAVAILABLE"
  | "PLATFORM_TIMEOUT"

  // Tenant / Auth / Permission Errors (2000-2999)
  | "AUTH_UNAUTHENTICATED"
  | "AUTH_FORBIDDEN"
  | "AUTH_TENANT_NOT_FOUND"
  | "AUTH_TENANT_SUSPENDED"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_INSUFFICIENT_PERMISSIONS"

  // Data / Validation Errors (3000-3999)
  | "VALIDATION_FAILED"
  | "ENTITY_NOT_FOUND"
  | "ENTITY_ALREADY_EXISTS"
  | "CONCURRENCY_CONFLICT"
  | "SCHEMA_MISMATCH"

  // Financial / Ledger Domain Errors (4000-4999)
  | "LEDGER_UNBALANCED_TRANSACTION"
  | "LEDGER_PERIOD_CLOSED"
  | "INSUFFICIENT_FUNDS"
  | "CURRENCY_MISMATCH"
  | "DECIMAL_PRECISION_ERROR"

  // Supply Chain / Extension Errors (5000-5999)
  | "EXTENSION_UNATTESTED"
  | "DEPENDENCY_POLICY_VIOLATION"
  | "OUTBOX_DELIVERY_FAILED";

export interface PlatformErrorDetails {
  code: PlatformErrorCode;
  message: string;
  statusCode: number;
  tenantId?: string;
  correlationId?: string;
  details?: Record<string, unknown>;
  retryable?: boolean;
}

export class PlatformError extends Error {
  public readonly code: PlatformErrorCode;
  public readonly statusCode: number;
  public readonly tenantId?: string;
  public readonly correlationId?: string;
  public readonly details?: Record<string, unknown>;
  public readonly retryable: boolean;

  constructor(options: PlatformErrorDetails) {
    super(options.message);
    this.name = "PlatformError";
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.tenantId = options.tenantId;
    this.correlationId = options.correlationId;
    this.details = options.details;
    this.retryable = options.retryable ?? (options.statusCode >= 500);
    Object.setPrototypeOf(this, PlatformError.prototype);
  }

  /** Convert to RFC 7807 problem details structure */
  toProblemDetails() {
    return {
      type: `https://unierp.com/errors/${this.code.toLowerCase().replace(/_/g, "-")}`,
      title: this.name,
      status: this.statusCode,
      detail: this.message,
      code: this.code,
      tenantId: this.tenantId,
      correlationId: this.correlationId,
      retryable: this.retryable,
      ...(this.details ? { invalidParams: this.details } : {}),
    };
  }
}

/** Specialized Platform Domain Errors */
export class EntityNotFoundError extends PlatformError {
  constructor(entityName: string, entityId: string, tenantId?: string) {
    super({
      code: "ENTITY_NOT_FOUND",
      message: `${entityName} with id '${entityId}' was not found.`,
      statusCode: 404,
      tenantId,
      details: { entityName, entityId },
      retryable: false,
    });
    this.name = "EntityNotFoundError";
  }
}

export class PermissionDeniedError extends PlatformError {
  constructor(permission: string, tenantId?: string) {
    super({
      code: "AUTH_FORBIDDEN",
      message: `Access denied. Required permission: '${permission}'.`,
      statusCode: 403,
      tenantId,
      details: { requiredPermission: permission },
      retryable: false,
    });
    this.name = "PermissionDeniedError";
  }
}

export class ValidationDomainError extends PlatformError {
  constructor(message: string, fieldErrors?: Record<string, string>, tenantId?: string) {
    super({
      code: "VALIDATION_FAILED",
      message,
      statusCode: 400,
      tenantId,
      details: fieldErrors,
      retryable: false,
    });
    this.name = "ValidationDomainError";
  }
}
