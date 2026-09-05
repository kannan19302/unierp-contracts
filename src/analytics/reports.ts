/**
 * @file reports.ts
 * @description L0 BI Reports, Query Parameters, Execution History, Schedules, Deliveries & Subscriptions Contracts.
 * Zero-dependency Zod schemas for Builder, SQL, and Pivot reports.
 */

import { z } from "zod";
import { isoDateTimeSchema } from "./common.js";

export const reportTypeSchema = z.enum(["BUILDER", "SQL", "PIVOT"]);
export type ReportType = z.infer<typeof reportTypeSchema>;

export const reportParameterTypeSchema = z.enum([
  "STRING",
  "NUMBER",
  "DATE",
  "BOOLEAN",
  "SELECT",
  "MULTI_SELECT",
]);
export type ReportParameterType = z.infer<typeof reportParameterTypeSchema>;

export const reportParameterOptionSchema = z.object({
  label: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export type ReportParameterOption = z.infer<typeof reportParameterOptionSchema>;

export const reportParameterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  label: z.string().min(1),
  type: reportParameterTypeSchema,
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  isRequired: z.boolean().default(false),
  options: z.array(reportParameterOptionSchema).optional(),
});

export type ReportParameter = z.infer<typeof reportParameterSchema>;

export const reportExecutionStatusSchema = z.enum([
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);
export type ReportExecutionStatus = z.infer<typeof reportExecutionStatusSchema>;

export const reportExecutionSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  reportId: z.string().min(1),
  tenantId: z.string().min(1),
  triggeredBy: z.string().min(1),
  status: reportExecutionStatusSchema,
  parameters: z.record(z.unknown()).optional(),
  startedAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.optional().nullable(),
  durationMs: z.number().int().nonnegative().optional().nullable(),
  rowCount: z.number().int().nonnegative().optional().nullable(),
  artifactUrl: z.string().url().optional().nullable(),
  errorMessage: z.string().max(2000).optional().nullable(),
});

export type ReportExecution = z.infer<typeof reportExecutionSchema>;

export const reportScheduleSchema = z.object({
  id: z.string().min(1),
  reportId: z.string().min(1),
  cronExpression: z.string().min(1, "Cron expression is required"),
  timezone: z.string().default("UTC"),
  isActive: z.boolean().default(true),
  lastRunAt: isoDateTimeSchema.optional().nullable(),
  nextRunAt: isoDateTimeSchema.optional().nullable(),
});

export type ReportSchedule = z.infer<typeof reportScheduleSchema>;

export const reportDeliveryFormatSchema = z.enum(["CSV", "XLSX", "PDF", "JSON", "PARQUET"]);
export type ReportDeliveryFormat = z.infer<typeof reportDeliveryFormatSchema>;

export const reportDeliveryChannelSchema = z.enum(["EMAIL", "SLACK", "WEBHOOK", "SFTP", "S3"]);
export type ReportDeliveryChannel = z.infer<typeof reportDeliveryChannelSchema>;

export const reportDeliverySchema = z.object({
  id: z.string().min(1),
  channel: reportDeliveryChannelSchema,
  recipients: z.array(z.string().min(1)).min(1, "At least one recipient is required"),
  format: reportDeliveryFormatSchema.default("CSV"),
  customWebhookUrl: z.string().url().optional(),
});

export type ReportDelivery = z.infer<typeof reportDeliverySchema>;

export const reportSubscriptionSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  reportId: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  deliveryChannel: reportDeliveryChannelSchema.default("EMAIL"),
  scheduleId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  createdAt: isoDateTimeSchema,
});

export type ReportSubscription = z.infer<typeof reportSubscriptionSchema>;

export const reportSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  tenantId: z.string().min(1, "Tenant ID is required"),
  orgId: z.string().min(1, "Organization ID is required"),
  name: z.string().min(1, "Report name is required").max(100),
  description: z.string().max(1000).optional().nullable(),
  type: reportTypeSchema.default("BUILDER"),
  version: z.number().int().positive("Version must be a positive integer").default(1),
  query: z.record(z.unknown()).default({}),
  parameters: z.array(reportParameterSchema).default([]),
  schedules: z.array(reportScheduleSchema).default([]),
  deliveries: z.array(reportDeliverySchema).default([]),
  tags: z.array(z.string().min(1)).default([]),
  createdBy: z.string().optional().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type Report = z.infer<typeof reportSchema>;

export const createReportSchema = z.object({
  name: z.string().min(1, "Report name is required").max(100),
  description: z.string().max(1000).optional().nullable(),
  type: reportTypeSchema.optional().default("BUILDER"),
  query: z.record(z.unknown()).optional().default({}),
  parameters: z.array(reportParameterSchema).optional().default([]),
  tags: z.array(z.string().min(1)).optional().default([]),
});

export type CreateReportRequest = z.infer<typeof createReportSchema>;

export const updateReportSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  type: reportTypeSchema.optional(),
  query: z.record(z.unknown()).optional(),
  parameters: z.array(reportParameterSchema).optional(),
  tags: z.array(z.string().min(1)).optional(),
  expectedVersion: z.number().int().positive("expectedVersion must be positive for optimistic locking").optional(),
});

export type UpdateReportRequest = z.infer<typeof updateReportSchema>;

export type ReportEntity = Report;

export const reportResponseSchema = z.object({
  report: reportSchema,
});

export type ReportResponse = z.infer<typeof reportResponseSchema>;

export const reportListResponseSchema = z.object({
  reports: z.array(reportSchema),
});

export type ReportListResponse = z.infer<typeof reportListResponseSchema>;
