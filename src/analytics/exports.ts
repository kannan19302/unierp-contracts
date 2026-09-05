/**
 * @file exports.ts
 * @description L0 Data Export Requests, Jobs, Retention Expiry, Audits & Download Authorization Contracts.
 * Zero-dependency Zod schemas for CSV, XLSX, PDF, JSON, and Parquet data exports.
 */

import { z } from "zod";
import { isoDateTimeSchema } from "./common.js";
import { queryAstSchema } from "./query.js";

export const exportFormatSchema = z.enum(["CSV", "XLSX", "PDF", "JSON", "PARQUET"]);
export type ExportFormat = z.infer<typeof exportFormatSchema>;

export const exportStatusSchema = z.enum([
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "EXPIRED",
]);
export type ExportStatus = z.infer<typeof exportStatusSchema>;

export const exportEntityTypeSchema = z.enum([
  "DASHBOARD",
  "REPORT",
  "QUERY",
  "METRIC_CATALOG",
]);
export type ExportEntityType = z.infer<typeof exportEntityTypeSchema>;

export const exportDateRangeSchema = z.object({
  startDate: isoDateTimeSchema,
  endDate: isoDateTimeSchema,
});

export type ExportDateRange = z.infer<typeof exportDateRangeSchema>;

export const exportRequestSchema = z.object({
  entityType: exportEntityTypeSchema,
  entityId: z.string().optional(),
  format: exportFormatSchema.default("CSV"),
  queryAst: queryAstSchema.optional(),
  dateRange: exportDateRangeSchema.optional(),
  timezone: z.string().default("UTC"),
  includeMetadata: z.boolean().default(true),
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;

export const exportJobSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  tenantId: z.string().min(1),
  requestedBy: z.string().min(1),
  entityType: exportEntityTypeSchema,
  entityId: z.string().optional().nullable(),
  format: exportFormatSchema,
  status: exportStatusSchema.default("QUEUED"),
  rowCount: z.number().int().nonnegative().optional().nullable(),
  fileSizeBytes: z.number().int().nonnegative().optional().nullable(),
  artifactUri: z.string().optional().nullable(),
  sha256Checksum: z.string().regex(/^[a-f0-9]{64}$/i, "Must be a valid 64-char hex SHA-256 hash").optional().nullable(),
  errorDetails: z.string().max(2000).optional().nullable(),
  createdAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.optional().nullable(),
  expiresAt: isoDateTimeSchema,
});

export type ExportJob = z.infer<typeof exportJobSchema>;

export const exportAuditSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  exportJobId: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  downloadedAt: isoDateTimeSchema,
  ipAddress: z.string().ip().optional().nullable(),
  userAgent: z.string().max(500).optional().nullable(),
});

export type ExportAudit = z.infer<typeof exportAuditSchema>;

export const downloadAuthorizationSchema = z.object({
  exportJobId: z.string().min(1),
  downloadToken: z.string().min(1),
  downloadUrl: z.string().url(),
  expiresAt: isoDateTimeSchema,
});

export type DownloadAuthorization = z.infer<typeof downloadAuthorizationSchema>;
