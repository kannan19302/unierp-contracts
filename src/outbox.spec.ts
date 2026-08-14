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

  it("ensures redelivered event produces zero duplicate effect with receipt idempotency", async () => {
    const receiptsStore = new Set<string>();
    let executionCount = 0;

    const event = {
      id: "evt-999",
      tenantId: "t-1",
      eventName: "invoice.approved",
      eventVersion: 1,
      aggregateType: "Invoice",
      aggregateId: "inv-1",
      sequence: 1,
      occurredAt: new Date().toISOString(),
      payload: { amount: 100 },
      eventKey: "Invoice:inv-1:invoice.approved:1",
    };

    const handler = async () => {
      executionCount++;
    };

    // First delivery: should execute
    const firstAttempt = await (await import("./outbox.js")).processOutboxEventIdempotent(
      "consumer-ledger",
      event,
      receiptsStore,
      handler
    );

    expect(firstAttempt.executed).toBe(true);
    expect(firstAttempt.duplicate).toBe(false);
    expect(executionCount).toBe(1);

    // Redelivery / replay: must be ignored with zero duplicate effect
    const secondAttempt = await (await import("./outbox.js")).processOutboxEventIdempotent(
      "consumer-ledger",
      event,
      receiptsStore,
      handler
    );

    expect(secondAttempt.executed).toBe(false);
    expect(secondAttempt.duplicate).toBe(true);
    expect(executionCount).toBe(1); // Still 1!
  });
});
