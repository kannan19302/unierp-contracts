/**
 * @file pipelines.ts
 * @description L0 Data Pipelines, Refresh Runs, Quality Audits & Realtime Telemetry Contracts.
 * Zero-dependency Zod schemas for Ingestion Pipelines, Kafka Partition Lags, and Realtime Telemetry.
 */

import { z } from "zod";
import { isoDateTimeSchema } from "./common.js";

// ─── Pipeline Management ──────────────────────────────────────────────────────

export const pipelineStatusSchema = z.enum(["IDLE", "RUNNING", "SUCCESS", "FAILED", "PAUSED"]);
export type PipelineStatus = z.infer<typeof pipelineStatusSchema>;

export const pipelineTriggerTypeSchema = z.enum([
  "SCHEDULED",
  "MANUAL",
  "EVENT",
  "STREAMING",
]);
export type PipelineTriggerType = z.infer<typeof pipelineTriggerTypeSchema>;

export const dataPipelineSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  tenantId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  sourceSystem: z.string().min(1),
  targetModel: z.string().min(1),
  cronSchedule: z.string().optional().nullable(),
  status: pipelineStatusSchema.default("IDLE"),
  isRealtime: z.boolean().default(false),
  lastRunAt: isoDateTimeSchema.optional().nullable(),
  nextRunAt: isoDateTimeSchema.optional().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type DataPipeline = z.infer<typeof dataPipelineSchema>;

// ─── Pipeline Execution Runs ──────────────────────────────────────────────────

export const refreshRunStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);
export type RefreshRunStatus = z.infer<typeof refreshRunStatusSchema>;

export const pipelineRefreshRunSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  pipelineId: z.string().min(1),
  tenantId: z.string().min(1),
  triggerType: pipelineTriggerTypeSchema,
  status: refreshRunStatusSchema,
  startedAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.optional().nullable(),
  durationSeconds: z.number().int().nonnegative().optional().nullable(),
  recordsProcessed: z.number().int().nonnegative().optional().nullable(),
  recordsFailed: z.number().int().nonnegative().optional().nullable(),
  errorDetails: z.string().max(2000).optional().nullable(),
});

export type PipelineRefreshRun = z.infer<typeof pipelineRefreshRunSchema>;

// ─── Data Quality Audits ──────────────────────────────────────────────────────

export const qualityCheckSeveritySchema = z.enum(["INFO", "WARNING", "CRITICAL"]);
export type QualityCheckSeverity = z.infer<typeof qualityCheckSeveritySchema>;

export const qualityCheckFailureSchema = z.object({
  ruleId: z.string().min(1),
  ruleName: z.string().min(1),
  severity: qualityCheckSeveritySchema,
  failureCount: z.number().int().nonnegative(),
  sampleViolations: z.array(z.string()).default([]),
});

export type QualityCheckFailure = z.infer<typeof qualityCheckFailureSchema>;

export const dataQualityResultSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  pipelineId: z.string().min(1),
  tenantId: z.string().min(1),
  executedAt: isoDateTimeSchema,
  qualityScore: z.number().min(0).max(100),
  totalChecks: z.number().int().nonnegative(),
  passedChecks: z.number().int().nonnegative(),
  failedChecks: z.number().int().nonnegative(),
  failures: z.array(qualityCheckFailureSchema).default([]),
});

export type DataQualityResult = z.infer<typeof dataQualityResultSchema>;

// ─── Realtime Telemetry & Stream Metrics ──────────────────────────────────────

export const activeSessionTelemetrySchema = z.object({
  id: z.string().min(1),
  location: z.string(),
  activePage: z.string(),
  durationSeconds: z.number().int().nonnegative(),
});

export type ActiveSessionTelemetry = z.infer<typeof activeSessionTelemetrySchema>;

export const kafkaPartitionLagSchema = z.object({
  topic: z.string().min(1),
  partition: z.number().int().nonnegative(),
  currentOffset: z.number().int().nonnegative(),
  endOffset: z.number().int().nonnegative(),
  lagRecords: z.number().int().nonnegative(),
});

export type KafkaPartitionLag = z.infer<typeof kafkaPartitionLagSchema>;

export const realtimeTelemetrySnapshotSchema = z.object({
  tenantId: z.string().min(1),
  timestamp: isoDateTimeSchema,
  activeUsersNow: z.number().int().nonnegative(),
  requestsPerSecond: z.number().nonnegative(),
  p99LatencyMs: z.number().nonnegative(),
  activeSessions: z.array(activeSessionTelemetrySchema).default([]),
  ingestionLagMs: z.number().int().nonnegative().optional().default(0),
  kafkaLagOffsets: z.array(kafkaPartitionLagSchema).optional().default([]),
});

export type RealtimeTelemetrySnapshot = z.infer<typeof realtimeTelemetrySnapshotSchema>;

export const realtimeTelemetryResponseSchema = z.object({
  telemetry: realtimeTelemetrySnapshotSchema,
});

export type RealtimeTelemetryResponse = z.infer<typeof realtimeTelemetryResponseSchema>;
