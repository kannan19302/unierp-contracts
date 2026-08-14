import { describe, it, expect, beforeEach } from "vitest";
import {
  EventSchemaRegistry,
  UnregisteredEventSchemaError,
  IncompatibleEventSchemaMutationError,
  EventPayloadValidationError,
} from "./schema-registry.js";

describe("Event Schema Registry and Compatibility Primitives", () => {
  beforeEach(() => {
    EventSchemaRegistry.clear();
    EventSchemaRegistry.registerSchema({
      eventType: "order.created",
      version: 1,
      description: "Order creation event",
      compatibility: "BACKWARD",
      requiredFields: ["orderId", "total"],
      fieldTypes: { orderId: "string", total: "number" },
    });
  });

  it("validates registered event schemas before publish", () => {
    expect(() =>
      EventSchemaRegistry.validateEventForPublish({
        eventType: "order.created",
        version: 1,
        payload: { orderId: "ord-1", total: 100 },
      })
    ).not.toThrow();
  });

  it("rejects publication of unregistered event types", () => {
    expect(() =>
      EventSchemaRegistry.validateEventForPublish({
        eventType: "unregistered.custom.event",
        version: 1,
        payload: {},
      })
    ).toThrow(UnregisteredEventSchemaError);
  });

  it("rejects publication of malformed payload violating required fields or types", () => {
    expect(() =>
      EventSchemaRegistry.validateEventForPublish({
        eventType: "order.created",
        version: 1,
        payload: { orderId: "ord-1" }, // missing 'total'
      })
    ).toThrow(EventPayloadValidationError);

    expect(() =>
      EventSchemaRegistry.validateEventForPublish({
        eventType: "order.created",
        version: 1,
        payload: { orderId: "ord-1", total: "not-a-number" as any },
      })
    ).toThrow(EventPayloadValidationError);
  });

  it("enforces schema immutability: forbids mutating an existing schema version", () => {
    expect(() =>
      EventSchemaRegistry.registerSchema({
        eventType: "order.created",
        version: 1,
        description: "Attempted mutation of v1",
        compatibility: "BACKWARD",
        requiredFields: ["orderId", "total", "mutatedField"],
        fieldTypes: { orderId: "string", total: "number", mutatedField: "string" },
      })
    ).toThrow(IncompatibleEventSchemaMutationError);
  });

  it("allows versioned schema evolution with backward compatibility rules", () => {
    // v2 adds optional customerId while keeping existing v1 fields
    expect(() =>
      EventSchemaRegistry.registerSchema({
        eventType: "order.created",
        version: 2,
        description: "Order creation event v2",
        compatibility: "BACKWARD",
        requiredFields: ["orderId", "total"],
        fieldTypes: { orderId: "string", total: "number", customerId: "string" },
      })
    ).not.toThrow();
  });
});
