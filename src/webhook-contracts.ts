/**
 * src/webhook-contracts.ts
 *
 * Phase P12-078: Webhook and event contracts.
 *
 * Exit criterion:
 *   "Outbound event payloads contracted and versioned like endpoints.
 *    An event payload change is classified and versioned like an API change"
 */

export interface WebhookEventContract {
  eventType: string;
  version: string;
  description: string;
  payloadSchema: Record<string, string>; // fieldName -> type signature
  metadata: {
    producerModule: string;
    releasedAt: string;
    deprecated?: boolean;
    sunsetDate?: string;
  };
}

export const CANONICAL_WEBHOOK_EVENT_CONTRACTS: WebhookEventContract[] = [
  {
    eventType: "tenant.provisioned",
    version: "v1",
    description: "Emitted when a new tenant workspace is successfully provisioned.",
    payloadSchema: {
      tenantId: "string",
      slug: "string",
      ownerEmail: "string",
      provisionedAt: "string (ISO8601)",
    },
    metadata: {
      producerModule: "platform",
      releasedAt: "2026-01-01T00:00:00Z",
    },
  },
  {
    eventType: "order.placed",
    version: "v1",
    description: "Emitted when a customer checkout is completed and order created.",
    payloadSchema: {
      orderId: "string",
      tenantId: "string",
      totalAmount: "string (Decimal 19,4)",
      currency: "string",
      placedAt: "string (ISO8601)",
    },
    metadata: {
      producerModule: "sales",
      releasedAt: "2026-01-01T00:00:00Z",
    },
  },
];

export function classifyEventPayloadChange(
  previousEvent: WebhookEventContract,
  nextEvent: WebhookEventContract
): {
  isBreaking: boolean;
  classification: "BREAKING" | "COMPATIBLE" | "IDENTICAL";
  changes: string[];
} {
  const changes: string[] = [];

  // Check event type mismatch
  if (previousEvent.eventType !== nextEvent.eventType) {
    changes.push(`Event type changed from '${previousEvent.eventType}' to '${nextEvent.eventType}'`);
  }

  // Check removed fields
  for (const field of Object.keys(previousEvent.payloadSchema)) {
    if (!(field in nextEvent.payloadSchema)) {
      changes.push(`Required field '${field}' was removed from event payload`);
    }
  }

  // Check altered field types
  for (const [field, prevType] of Object.entries(previousEvent.payloadSchema)) {
    if (field in nextEvent.payloadSchema) {
      const nextType = nextEvent.payloadSchema[field];
      if (prevType !== nextType) {
        changes.push(`Field '${field}' type changed from '${prevType}' to '${nextType}'`);
      }
    }
  }

  // Check added fields
  for (const field of Object.keys(nextEvent.payloadSchema)) {
    if (!(field in previousEvent.payloadSchema)) {
      changes.push(`Optional/new field '${field}' added to payload`);
    }
  }

  const isBreaking = changes.some((c) => c.includes("removed") || c.includes("type changed") || c.includes("Event type changed"));

  return {
    isBreaking,
    classification: isBreaking ? "BREAKING" : changes.length > 0 ? "COMPATIBLE" : "IDENTICAL",
    changes,
  };
}

export function assertEventPayloadVersionLifecycle(
  previousEvent: WebhookEventContract,
  nextEvent: WebhookEventContract
): void {
  const result = classifyEventPayloadChange(previousEvent, nextEvent);
  if (result.isBreaking && previousEvent.version === nextEvent.version) {
    throw new Error(
      `Breaking event payload change detected in event '${nextEvent.eventType}' without version increment: ${result.changes.join(", ")}`
    );
  }
}
