/**
 * @file common.ts
 * @description L0 Common Governance Primitives & Serialization Enforcers for Analytics Contracts.
 * Zero-dependency contracts enforcing ISO 8601 date serialization, Decimal(19,4) numeric exactness,
 * ISO 4217 currency codes, data ownership, certification tiers, DAG lineage, quality scores, and SLA freshness.
 */

import { z } from "zod";

// ─── ISO 8601 DateTime Serialization ─────────────────────────────────────────

export const isoDateTimeSchema = z
  .string()
  .datetime({ message: "Must be a valid ISO 8601 UTC date-time string (e.g., 2026-09-04T12:00:00.000Z)" });

export type IsoDateTime = z.infer<typeof isoDateTimeSchema>;

// ─── Decimal & Money Exactness (Anti-IEEE 754 Drift) ──────────────────────────

/**
 * Exact decimal string validator supporting up to 4 decimal places of precision (Decimal 19,4).
 * Enforces string serialization at all public API boundaries to avoid binary floating-point drift.
 */
export const decimalStringSchema = z
  .string()
  .regex(/^-?\d+(\.\d{1,4})?$/, {
    message: "Must be a valid Decimal(19,4) numeric string with up to 4 decimal places",
  });

export type DecimalString = z.infer<typeof decimalStringSchema>;

export const currencyCodeSchema = z.enum([
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "INR",
  "SGD",
  "HKD",
  "NZD",
]);

export type AnalyticsCurrencyCode = z.infer<typeof currencyCodeSchema>;

export const analyticsMoneySchema = z.object({
  amount: decimalStringSchema,
  currency: currencyCodeSchema,
});

export type AnalyticsMoney = z.infer<typeof analyticsMoneySchema>;

// ─── Governance & Semantic Metadata Schemas ──────────────────────────────────

export const ownerSchema = z.object({
  userId: z.string().min(1, "Owner user ID is required"),
  email: z.string().email("Valid owner email address is required"),
  role: z.string().optional(),
  teamId: z.string().optional(),
});

export type Owner = z.infer<typeof ownerSchema>;

export const certificationLevelSchema = z.enum([
  "UNCERTIFIED",
  "BRONZE",
  "SILVER",
  "GOLD",
]);

export type CertificationLevel = z.infer<typeof certificationLevelSchema>;

export const certificationSchema = z.object({
  level: certificationLevelSchema,
  certifiedBy: z.string().optional(),
  certifiedAt: isoDateTimeSchema.optional(),
  reviewDueDate: isoDateTimeSchema.optional(),
  notes: z.string().max(1000).optional(),
});

export type Certification = z.infer<typeof certificationSchema>;

export const lineageSchema = z.object({
  upstreamSources: z.array(z.string().min(1)),
  transformationLogic: z.string().optional(),
  downstreamConsumers: z.array(z.string().min(1)).default([]),
  dagLevel: z.number().int().nonnegative().default(0),
});

export type Lineage = z.infer<typeof lineageSchema>;

export const freshnessSchema = z.object({
  lastRefreshedAt: isoDateTimeSchema,
  cronSchedule: z.string().optional(),
  slaMinutes: z.number().int().positive("SLA in minutes must be positive"),
  isStale: z.boolean().default(false),
});

export type Freshness = z.infer<typeof freshnessSchema>;

export const dataQualitySchema = z.object({
  score: z.number().min(0).max(100, "Quality score must be between 0 and 100"),
  passedRules: z.number().int().nonnegative(),
  failedRules: z.number().int().nonnegative(),
  lastAuditDate: isoDateTimeSchema,
  rulesSummary: z.array(z.string()).optional(),
});

export type DataQuality = z.infer<typeof dataQualitySchema>;
