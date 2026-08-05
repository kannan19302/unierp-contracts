/**
 * L0 Domain event schemas.
 * Generates: outbox publisher types, consumer types, AsyncAPI docs, extension event typings.
 * Consumers are idempotent by receipt table. Every event carries these standard fields.
 */

export interface DomainEvent<T = unknown> {
  eventId: string;
  eventType: string;
  tenantId: string;
  occurredAt: string; // ISO 8601
  version: number;
  correlationId: string;
  causationId?: string;
  actor: {
    id: string;
    type: "user" | "system" | "extension";
  };
  payload: T;
}

// Finance events
export interface InvoiceApprovedEvent extends DomainEvent<{
  invoiceId: string;
  amount: number;
  currency: string;
  customerId: string;
}> {
  eventType: "finance.invoice.approved";
}

// Tenant lifecycle events
export interface TenantProvisionedEvent extends DomainEvent<{
  tenantId: string;
  plan: string;
  adminEmail: string;
}> {
  eventType: "platform.tenant.provisioned";
}

export interface TenantSuspendedEvent extends DomainEvent<{
  tenantId: string;
  reason: string;
}> {
  eventType: "platform.tenant.suspended";
}

// Extension lifecycle events
export interface ExtensionInstalledEvent extends DomainEvent<{
  extensionId: string;
  version: string;
  installedBy: string;
}> {
  eventType: "platform.extension.installed";
}
