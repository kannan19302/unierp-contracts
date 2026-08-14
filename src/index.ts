/**
 * @kannan19302/contracts — L0, no dependencies.
 * Single source of truth for all API contracts, event schemas, and shared entity types.
 * See PLATFORM_ARCHITECTURE.md § 7.1 and § 4.2.
 */
export * from "./entities/index.js";
export * from "./http/index.js";
export * from "./events/index.js";
export * from "./residency.js";
export * from "./settings.js";
export * from "./settings-resolution.js";
export * from "./settings-migration.js";
export * from "./settings-promotion.js";
export * from "./errors.js";
export * from "./health.js";
export * from "./money.js";
export * from "./online-schema-change.js";
export * from "./fixtures.js";
export * from "./connection-pool.js";
export * from "./transactions.js";
export * from "./soft-delete.js";
export * from "./encryption.js";
export * from "./retention.js";
export * from "./audit.js";
export * from "./outbox.js";
export * from "./db-performance.js";
export * from "./backup-restore.js";


