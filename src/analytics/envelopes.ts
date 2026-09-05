/**
 * @file envelopes.ts
 * @description L0 Standard Success, RFC 7807 Error, Validation, Forbidden, Stale-Version, Paginated & Async Envelopes.
 * Zero-dependency Zod envelope constructors guaranteeing standard wire format across all analytics HTTP boundaries.
 */

import { z } from "zod";
import { isoDateTimeSchema } from "./common.js";

// ─── Standard Metadata ────────────────────────────────────────────────────────

export const apiMetaSchema = z.object({
  requestId: z.string().min(1, "requestId is required"),
  timestamp: isoDateTimeSchema,
  version: z.string().default("1.0.0"),
  tenantId: z.string().optional(),
  durationMs: z.number().int().nonnegative().optional(),
});

export type ApiMeta = z.infer<typeof apiMetaSchema>;

// ─── Success Envelope ─────────────────────────────────────────────────────────

export function createSuccessEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: apiMetaSchema,
  });
}

export type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  meta: ApiMeta;
};

// ─── RFC 7807 Error Envelopes ─────────────────────────────────────────────────

export const invalidParamErrorSchema = z.object({
  name: z.string().min(1),
  reason: z.string().min(1),
  code: z.string().optional(),
});

export type InvalidParamError = z.infer<typeof invalidParamErrorSchema>;

export const apiErrorBodySchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  target: z.string().optional(),
  details: z.unknown().optional(),
  invalidParams: z.array(invalidParamErrorSchema).optional(),
});

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

export const apiErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: apiErrorBodySchema,
  meta: apiMetaSchema,
});

export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;

// ─── Specialized Error Envelopes ──────────────────────────────────────────────

export const validationErrorBodySchema = z.object({
  code: z.literal("VALIDATION_FAILED"),
  message: z.string().min(1),
  invalidParams: z.array(invalidParamErrorSchema).min(1),
});

export const validationErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: validationErrorBodySchema,
  meta: apiMetaSchema,
});

export type ValidationErrorEnvelope = z.infer<typeof validationErrorEnvelopeSchema>;

export const forbiddenErrorBodySchema = z.object({
  code: z.literal("FORBIDDEN"),
  message: z.string().min(1),
  requiredPermissions: z.array(z.string().min(1)).min(1),
});

export const forbiddenErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: forbiddenErrorBodySchema,
  meta: apiMetaSchema,
});

export type ForbiddenErrorEnvelope = z.infer<typeof forbiddenErrorEnvelopeSchema>;

export const conflictErrorBodySchema = z.object({
  code: z.literal("CONFLICT"),
  message: z.string().min(1),
  conflictReason: z.string().min(1),
});

export const conflictErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: conflictErrorBodySchema,
  meta: apiMetaSchema,
});

export type ConflictErrorEnvelope = z.infer<typeof conflictErrorEnvelopeSchema>;

export const staleVersionBodySchema = z.object({
  code: z.literal("STALE_VERSION"),
  message: z.string().min(1),
  currentVersion: z.number().int().positive(),
  requestedVersion: z.number().int().positive(),
});

export const staleVersionEnvelopeSchema = z.object({
  success: z.literal(false),
  error: staleVersionBodySchema,
  meta: apiMetaSchema,
});

export type StaleVersionEnvelope = z.infer<typeof staleVersionEnvelopeSchema>;

// ─── Paginated Envelope ───────────────────────────────────────────────────────

export const paginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
  nextCursor: z.string().optional().nullable(),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export function createPaginatedEnvelopeSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: paginationMetaSchema,
    meta: apiMetaSchema,
  });
}

export type PaginatedEnvelope<T> = {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  meta: ApiMeta;
};

// ─── Asynchronous Job Envelope ────────────────────────────────────────────────

export const asyncJobStatusSchema = z.enum(["QUEUED", "PROCESSING", "COMPLETED", "FAILED"]);
export type AsyncJobStatus = z.infer<typeof asyncJobStatusSchema>;

export const asyncJobDataSchema = z.object({
  jobId: z.string().min(1),
  status: asyncJobStatusSchema,
  progressPercentage: z.number().min(0).max(100).default(0),
  estimatedTimeRemainingSec: z.number().int().nonnegative().optional().nullable(),
  statusUrl: z.string().url().or(z.string().min(1)),
  resultUrl: z.string().url().or(z.string().min(1)).optional().nullable(),
  errorDetails: z.string().max(2000).optional().nullable(),
});

export type AsyncJobData = z.infer<typeof asyncJobDataSchema>;

export const asyncJobEnvelopeSchema = z.object({
  success: z.literal(true),
  data: asyncJobDataSchema,
  meta: apiMetaSchema,
});

export type AsyncJobEnvelope = z.infer<typeof asyncJobEnvelopeSchema>;
