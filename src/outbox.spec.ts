import { describe, it, expect } from "vitest";
import {
  createOutboxEventPayload,
  assertTransactionalOutbox,
  DualWriteNonAtomicError,
  OutboxAtomicTx,
} from "./outbox.js";

describe("Transactional Outbox Primitives", () => {
  it("creates valid outbox event payloads for atomic transactions", () => {
    const payload = createOutboxEventPayload({
      tenantId: "tenant-101",
      eventName: "invoice.posted",
      eventVersion: 1,
      aggregateType: "Invoice",
      aggregateId: "inv-900",
      payload: { amount: 1500, currency: "USD" },
      correlationId: "corr-1",
    }, 2);

    expect(payload.tenantId).toBe("tenant-101");
    expect(payload.eventName).toBe("invoice.posted");
    expect(payload.sequence).toBe(2);
    expect(payload.eventKey).toBe("Invoice:inv-900:invoice.posted:2");
    expect(payload.correlationId).toBe("corr-1");
  });

  it("asserts transactional outbox client structure", () => {
    const validTx: OutboxAtomicTx = {
      outboxEvent: {
        create: async () => ({ id: "evt-1", eventKey: "Invoice:1:posted:1" }),
      },
      outboxDelivery: {
        createMany: async () => ({ count: 1 }),
      },
    };

    expect(() => assertTransactionalOutbox(validTx)).not.toThrow();
  });

  it("rejects non-transactional event dispatch (dual-write anti-pattern)", () => {
    expect(() => assertTransactionalOutbox(null)).toThrow(DualWriteNonAtomicError);
    expect(() => assertTransactionalOutbox({})).toThrow(DualWriteNonAtomicError);
    expect(() => assertTransactionalOutbox({ outboxEvent: {} })).toThrow(DualWriteNonAtomicError);
  });
});
