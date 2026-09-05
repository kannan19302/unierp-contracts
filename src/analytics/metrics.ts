/**
 * @file metrics.ts
 * @description L0 Metric Governance, Dimensions, Measures, Certification, Quality & Freshness Contracts.
 * Zero-dependency Zod schemas for BI Metric Definitions, Calculated Measures, and Value Snapshots.
 */

import { z } from "zod";
import {
  isoDateTimeSchema,
  decimalStringSchema,
  currencyCodeSchema,
  ownerSchema,
  certificationSchema,
  lineageSchema,
  freshnessSchema,
  dataQualitySchema,
} from "./common.js";

export const biMetricCategorySchema = z.enum([
  "FINANCE",
  "SALES",
  "SUPPLY_CHAIN",
  "HR",
  "OPERATIONS",
  "PROJECTS",
  "MANUFACTURING",
  "CUSTOM",
]);

export type BiMetricCategory = z.infer<typeof biMetricCategorySchema>;

export const metricUnitSchema = z.enum([
  "CURRENCY",
  "PERCENT",
  "COUNT",
  "DURATION_MS",
  "DURATION_SEC",
  "DURATION_HOURS",
  "DURATION_DAYS",
  "BYTES",
  "SCORE",
  "RATIO",
  "CUSTOM",
]);

export type MetricUnit = z.infer<typeof metricUnitSchema>;

export const metricDimensionSchema = z.object({
  name: z.string().min(1, "Dimension name is required"),
  label: z.string().min(1, "Dimension label is required"),
  dataType: z.enum(["STRING", "NUMBER", "BOOLEAN", "DATE", "DATETIME"]),
  description: z.string().optional(),
  hierarchicalPath: z.string().optional(),
});

export type MetricDimension = z.infer<typeof metricDimensionSchema>;

export const metricMeasureSchema = z.object({
  name: z.string().min(1, "Measure name is required"),
  label: z.string().min(1, "Measure label is required"),
  aggregation: z.enum([
    "SUM",
    "AVG",
    "COUNT",
    "COUNT_DISTINCT",
    "MIN",
    "MAX",
    "PERCENTILE_95",
    "PERCENTILE_99",
    "STDDEV",
    "MEDIAN",
  ]),
  expression: z.string().min(1, "Calculation expression is required"),
  formatString: z.string().optional(),
});

export type MetricMeasure = z.infer<typeof metricMeasureSchema>;

export const metricDefinitionSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  tenantId: z.string().min(1, "Tenant ID is required"),
  name: z.string().min(1, "Metric name is required").max(100),
  code: z.string().regex(/^[A-Z0-9_]+$/, "Metric code must be uppercase alphanumeric with underscores"),
  description: z.string().max(1000).optional().nullable(),
  category: biMetricCategorySchema,
  version: z.number().int().positive("Version must be a positive integer").default(1),
  unit: metricUnitSchema.default("COUNT"),
  customUnitLabel: z.string().max(30).optional().nullable(),
  currency: currencyCodeSchema.optional().nullable(),
  source: z.string().min(1, "Source table or view is required"),
  expression: z.string().min(1, "SQL or calculated expression is required"),
  dimensions: z.array(z.string().min(1)).default([]),
  dimensionMetadata: z.array(metricDimensionSchema).optional(),
  measures: z.array(metricMeasureSchema).optional(),
  owner: ownerSchema.optional().nullable(),
  certification: certificationSchema.optional().nullable(),
  lineage: lineageSchema.optional().nullable(),
  freshness: freshnessSchema.optional().nullable(),
  dataQuality: dataQualitySchema.optional().nullable(),
  isActive: z.boolean().default(true),
  isSystem: z.boolean().default(false),
  tags: z.array(z.string().min(1)).default([]),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type MetricDefinition = z.infer<typeof metricDefinitionSchema>;

export const createMetricDefinitionSchema = metricDefinitionSchema
  .omit({
    id: true,
    tenantId: true,
    version: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    dimensions: z.array(z.string().min(1)).optional().default([]),
  });

export type CreateMetricDefinitionRequest = z.infer<typeof createMetricDefinitionSchema>;

export const updateMetricDefinitionSchema = createMetricDefinitionSchema
  .partial()
  .extend({
    expectedVersion: z.number().int().positive("expectedVersion must be a positive integer for optimistic concurrency").optional(),
  });

export type UpdateMetricDefinitionRequest = z.infer<typeof updateMetricDefinitionSchema>;

export const metricValueSnapshotSchema = z.object({
  metricId: z.string().min(1),
  metricCode: z.string().min(1),
  tenantId: z.string().min(1),
  timestamp: isoDateTimeSchema,
  rawNumericValue: decimalStringSchema,
  formattedValue: z.string(),
  currency: currencyCodeSchema.optional().nullable(),
  trendDeltaPercent: z.number().optional().nullable(),
  sparkline: z.array(z.number()).default([]),
  freshness: freshnessSchema.optional().nullable(),
  qualityScore: z.number().min(0).max(100).optional().nullable(),
});

export type MetricValueSnapshot = z.infer<typeof metricValueSnapshotSchema>;

export type BiMetricDefinitionEntity = MetricDefinition;

export const kpiEntitySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  orgId: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().optional().nullable(),
  trend: z.array(z.number()).default([]),
  lastUpdated: isoDateTimeSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type KpiEntity = z.infer<typeof kpiEntitySchema>;

export const kpiListResponseSchema = z.object({
  kpis: z.array(kpiEntitySchema),
});

export type KpiListResponse = z.infer<typeof kpiListResponseSchema>;
