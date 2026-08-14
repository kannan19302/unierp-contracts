import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CANONICAL_WEBHOOK_EVENT_CONTRACTS,
  classifyEventPayloadChange,
  assertEventPayloadVersionLifecycle,
  type WebhookEventContract,
} from "./webhook-contracts.ts";

describe("Webhook and Event Contracts (P12-078)", () => {
  it("defines canonical outbound event contracts with payload schemas and versions", () => {
    assert.ok(CANONICAL_WEBHOOK_EVENT_CONTRACTS.length >= 2);
    const tenantEvent = CANONICAL_WEBHOOK_EVENT_CONTRACTS.find((e) => e.eventType === "tenant.provisioned");
    assert.ok(tenantEvent);
    assert.equal(tenantEvent.version, "v1");
    assert.ok(tenantEvent.payloadSchema.tenantId);
  });

  it("classifies compatible event payload additions correctly", () => {
    const prev: WebhookEventContract = {
      eventType: "order.placed",
      version: "v1",
      description: "Order placed",
      payloadSchema: { orderId: "string", totalAmount: "string" },
      metadata: { producerModule: "sales", releasedAt: "2026-01-01" },
    };

    const next: WebhookEventContract = {
      ...prev,
      payloadSchema: { orderId: "string", totalAmount: "string", discountCode: "string" },
    };

    const res = classifyEventPayloadChange(prev, next);
    assert.equal(res.isBreaking, false);
    assert.equal(res.classification, "COMPATIBLE");
  });

  it("classifies breaking event payload removals correctly", () => {
    const prev: WebhookEventContract = {
      eventType: "order.placed",
      version: "v1",
      description: "Order placed",
      payloadSchema: { orderId: "string", totalAmount: "string" },
      metadata: { producerModule: "sales", releasedAt: "2026-01-01" },
    };

    const next: WebhookEventContract = {
      ...prev,
      payloadSchema: { orderId: "string" }, // totalAmount removed
    };

    const res = classifyEventPayloadChange(prev, next);
    assert.equal(res.isBreaking, true);
    assert.equal(res.classification, "BREAKING");

    assert.throws(
      () => assertEventPayloadVersionLifecycle(prev, next),
      /Breaking event payload change detected/
    );
  });
});
