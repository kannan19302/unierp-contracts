/**
 * @file schema-registry.ts
 * @description Versioned domain event schema registry with compatibility rules and validation.
 * Phase P12-049: Event schema registry.
 *
 * Exit criterion:
 *   "An event without a registered schema cannot be published. A schema change is versioned, not mutated"
 */

export type SchemaCompatibilityMode = "BACKWARD" | "FORWARD" | "FULL" | "NONE";

export interface EventSchemaDefinition {
  eventType: string;
  version: number;
  description: string;
  compatibility: SchemaCompatibilityMode;
  requiredFields: string[];
  fieldTypes: Record<string, "string" | "number" | "boolean" | "object" | "array">;
}

export class UnregisteredEventSchemaError extends Error {
  constructor(eventType: string, version?: number) {
    super(
      `Publish rejected: No schema registered for event "${eventType}"${version ? ` at version ${version}` : ""}. All events must be registered in the Event Schema Registry before publication.`
    );
    this.name = "UnregisteredEventSchemaError";
  }
}

export class IncompatibleEventSchemaMutationError extends Error {
  constructor(eventType: string, version: number, reason: string) {
    super(
      `Schema mutation rejected for "${eventType}" v${version}: ${reason}. Event schemas are immutable once registered; introduce a new version (e.g. v${version + 1}) instead of mutating existing schema.`
    );
    this.name = "IncompatibleEventSchemaMutationError";
  }
}

export class EventPayloadValidationError extends Error {
  constructor(eventType: string, version: number, details: string) {
    super(
      `Invalid event payload for "${eventType}" v${version}: ${details}`
    );
    this.name = "EventPayloadValidationError";
  }
}

export class EventSchemaRegistry {
  private static schemas = new Map<string, EventSchemaDefinition>();

  /**
   * Registers a versioned event schema. If the version already exists, mutation is rejected.
   */
  public static registerSchema(schema: EventSchemaDefinition): void {
    const key = `${schema.eventType}@v${schema.version}`;
    const existing = this.schemas.get(key);

    if (existing) {
      // Assert immutability: schema definition cannot be mutated once registered
      const isIdentical =
        JSON.stringify(existing.requiredFields) === JSON.stringify(schema.requiredFields) &&
        JSON.stringify(existing.fieldTypes) === JSON.stringify(schema.fieldTypes);
      if (!isIdentical) {
        throw new IncompatibleEventSchemaMutationError(
          schema.eventType,
          schema.version,
          "Attempted to mutate an existing immutable schema version"
        );
      }
      return;
    }

    // If previous version exists, verify compatibility rules
    if (schema.version > 1) {
      const prevKey = `${schema.eventType}@v${schema.version - 1}`;
      const prevSchema = this.schemas.get(prevKey);
      if (prevSchema && (schema.compatibility === "BACKWARD" || schema.compatibility === "FULL")) {
        // Under backward compatibility, new version must not remove required fields of previous version
        for (const req of prevSchema.requiredFields) {
          if (!schema.requiredFields.includes(req) && !schema.fieldTypes[req]) {
            throw new IncompatibleEventSchemaMutationError(
              schema.eventType,
              schema.version,
              `Backward compatibility broken: removed field "${req}" present in v${prevSchema.version}`
            );
          }
        }
      }
    }

    this.schemas.set(key, Object.freeze({ ...schema }));
  }

  public static getSchema(eventType: string, version: number): EventSchemaDefinition | undefined {
    return this.schemas.get(`${eventType}@v${version}`);
  }

  public static hasSchema(eventType: string, version: number): boolean {
    return this.schemas.has(`${eventType}@v${version}`);
  }

  /**
   * Validates that an event has a registered schema and conforms to its required fields and types.
   */
  public static validateEventForPublish<T = Record<string, unknown>>(event: {
    eventType: string;
    version: number;
    payload: T;
  }): void {
    const schema = this.getSchema(event.eventType, event.version);
    if (!schema) {
      throw new UnregisteredEventSchemaError(event.eventType, event.version);
    }

    const payload = (event.payload ?? {}) as Record<string, unknown>;

    for (const requiredField of schema.requiredFields) {
      if (payload[requiredField] === undefined || payload[requiredField] === null) {
        throw new EventPayloadValidationError(
          event.eventType,
          event.version,
          `Missing required field "${requiredField}"`
        );
      }
    }

    for (const [field, expectedType] of Object.entries(schema.fieldTypes)) {
      if (payload[field] !== undefined && payload[field] !== null) {
        const val = payload[field];
        const actualType = Array.isArray(val) ? "array" : typeof val;
        if (actualType !== expectedType) {
          throw new EventPayloadValidationError(
            event.eventType,
            event.version,
            `Field "${field}" expected type ${expectedType}, received ${actualType}`
          );
        }
      }
    }
  }

  public static clear(): void {
    this.schemas.clear();
  }
}

// Pre-register canonical platform events
EventSchemaRegistry.registerSchema({
  eventType: "finance.invoice.approved",
  version: 1,
  description: "Emitted when a customer invoice is approved",
  compatibility: "BACKWARD",
  requiredFields: ["invoiceId", "amount", "currency", "customerId"],
  fieldTypes: {
    invoiceId: "string",
    amount: "number",
    currency: "string",
    customerId: "string",
  },
});

EventSchemaRegistry.registerSchema({
  eventType: "platform.tenant.provisioned",
  version: 1,
  description: "Emitted when a new tenant environment is provisioned",
  compatibility: "BACKWARD",
  requiredFields: ["tenantId", "plan", "adminEmail"],
  fieldTypes: {
    tenantId: "string",
    plan: "string",
    adminEmail: "string",
  },
});

EventSchemaRegistry.registerSchema({
  eventType: "platform.tenant.suspended",
  version: 1,
  description: "Emitted when a tenant account is suspended",
  compatibility: "BACKWARD",
  requiredFields: ["tenantId", "reason"],
  fieldTypes: {
    tenantId: "string",
    reason: "string",
  },
});

EventSchemaRegistry.registerSchema({
  eventType: "platform.extension.installed",
  version: 1,
  description: "Emitted when an extension is installed into a tenant",
  compatibility: "BACKWARD",
  requiredFields: ["extensionId", "version", "installedBy"],
  fieldTypes: {
    extensionId: "string",
    version: "string",
    installedBy: "string",
  },
});
