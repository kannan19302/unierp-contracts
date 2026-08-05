/**
 * L0 Entity contracts — zero dependencies.
 * These are the shared domain types that @unerp/* packages compile against.
 * All IDs are strings to avoid hard foreign-key dependencies between domains (ADR).
 */

export interface TenantEntity {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED" | "OFFBOARDED";
  plan: string;
  createdAt: Date;
}

export interface UserEntity {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  createdAt: Date;
}

export interface PermissionGrant {
  permission: string;
  tenantId: string;
}

export interface AuditLogEntry {
  eventId: string;
  tenantId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  occurredAt: Date;
  correlationId?: string;
}
