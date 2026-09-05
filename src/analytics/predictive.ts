/**
 * @file predictive.ts
 * @description L0 Predictive Intelligence, Funnels, Cohorts, Trends, Anomalies & Forecasting Contracts.
 * Zero-dependency Zod schemas for Statistical Forecasts, Anomaly Detection, and Machine Learning Provenance.
 */

import { z } from "zod";
import { isoDateTimeSchema } from "./common.js";
import { timeGrainSchema, queryFilterConditionSchema } from "./query.js";

// ─── Funnel Analysis ──────────────────────────────────────────────────────────

export const funnelStepDefinitionSchema = z.object({
  stepOrder: z.number().int().positive("stepOrder must be >= 1"),
  name: z.string().min(1),
  eventName: z.string().min(1),
  filterConditions: z.array(queryFilterConditionSchema).optional().default([]),
});

export type FunnelStepDefinition = z.infer<typeof funnelStepDefinitionSchema>;

export const funnelStepResultSchema = z.object({
  stepOrder: z.number().int().positive(),
  name: z.string().min(1),
  entrantsCount: z.number().int().nonnegative(),
  dropoffCount: z.number().int().nonnegative(),
  conversionRatePercent: z.number().min(0).max(100),
  medianTimeFromPrevStepSec: z.number().nonnegative().optional().nullable(),
});

export type FunnelStepResult = z.infer<typeof funnelStepResultSchema>;

export const funnelAnalysisSchema = z.object({
  funnelId: z.string().min(1),
  name: z.string().min(1),
  steps: z.array(funnelStepResultSchema),
  overallConversionRatePercent: z.number().min(0).max(100),
});

export type FunnelAnalysis = z.infer<typeof funnelAnalysisSchema>;

// ─── Cohort Analysis ──────────────────────────────────────────────────────────

export const cohortTypeSchema = z.enum(["RETENTION", "REVENUE", "ACTIVITY"]);
export type CohortType = z.infer<typeof cohortTypeSchema>;

export const cohortCellSchema = z.object({
  periodIndex: z.number().int().nonnegative(),
  size: z.number().int().nonnegative(),
  retentionRatePercent: z.number().min(0).max(100),
  metricValue: z.number().optional().nullable(),
});

export type CohortCell = z.infer<typeof cohortCellSchema>;

export const cohortRowSchema = z.object({
  cohortPeriod: z.string().min(1),
  cohortSize: z.number().int().nonnegative(),
  cells: z.array(cohortCellSchema),
});

export type CohortRow = z.infer<typeof cohortRowSchema>;

export const cohortAnalysisSchema = z.object({
  cohortType: cohortTypeSchema,
  timeGrain: timeGrainSchema,
  rows: z.array(cohortRowSchema),
});

export type CohortAnalysis = z.infer<typeof cohortAnalysisSchema>;

// ─── Trend Analysis ───────────────────────────────────────────────────────────

export const trendPointSchema = z.object({
  timestamp: isoDateTimeSchema,
  actualValue: z.number(),
  trendValue: z.number(),
  changePercentage: z.number(),
});

export type TrendPoint = z.infer<typeof trendPointSchema>;

export const trendDirectionSchema = z.enum(["UPWARD", "DOWNWARD", "FLAT"]);
export type TrendDirection = z.infer<typeof trendDirectionSchema>;

export const trendAnalysisSchema = z.object({
  metricCode: z.string().min(1),
  baselineValue: z.number(),
  points: z.array(trendPointSchema),
  trendDirection: trendDirectionSchema,
});

export type TrendAnalysis = z.infer<typeof trendAnalysisSchema>;

// ─── Anomaly Alerts ───────────────────────────────────────────────────────────

export const anomalySeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type AnomalySeverity = z.infer<typeof anomalySeveritySchema>;

export const anomalyStatusSchema = z.enum([
  "DETECTED",
  "INVESTIGATING",
  "RESOLVED",
  "DISMISSED",
]);
export type AnomalyStatus = z.infer<typeof anomalyStatusSchema>;

export const anomalyAlertSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  tenantId: z.string().min(1),
  metric: z.string().min(1),
  severity: anomalySeveritySchema,
  status: anomalyStatusSchema,
  currentValue: z.number(),
  expectedValue: z.number(),
  deviationPercent: z.number(),
  zScore: z.number().optional().default(0),
  detectedAt: isoDateTimeSchema,
  resolvedAt: isoDateTimeSchema.optional().nullable(),
  rootCauseAnalysis: z.string().max(1000).optional().nullable(),
});

export type AnomalyAlert = z.infer<typeof anomalyAlertSchema>;

// ─── Forecast Models ──────────────────────────────────────────────────────────

export const forecastHorizonSchema = z.enum(["7D", "30D", "90D", "180D", "1Y"]);
export type ForecastHorizon = z.infer<typeof forecastHorizonSchema>;

export const forecastMethodSchema = z.enum([
  "LINEAR",
  "EXPONENTIAL",
  "ARIMA",
  "PROPHET",
  "HOLT_WINTERS",
  "ENSEMBLE",
]);
export type ForecastMethod = z.infer<typeof forecastMethodSchema>;

export const forecastHistoricalPointSchema = z.object({
  timestamp: isoDateTimeSchema,
  value: z.number(),
});

export type ForecastHistoricalPoint = z.infer<typeof forecastHistoricalPointSchema>;

export const forecastProjectionPointSchema = z.object({
  timestamp: isoDateTimeSchema,
  projected: z.number(),
  upperBound: z.number(),
  lowerBound: z.number(),
  confidenceInterval: z.number().min(0).max(1).default(0.95),
});

export type ForecastProjectionPoint = z.infer<typeof forecastProjectionPointSchema>;

export const forecastExplanationFactorSchema = z.object({
  factorName: z.string().min(1),
  impactPercent: z.number(),
});

export type ForecastExplanationFactor = z.infer<typeof forecastExplanationFactorSchema>;

export const forecastExplanationSchema = z.object({
  factors: z.array(forecastExplanationFactorSchema).default([]),
  seasonalityDetected: z.boolean().default(false),
  detectedChangepoints: z.array(isoDateTimeSchema).default([]),
});

export type ForecastExplanation = z.infer<typeof forecastExplanationSchema>;

export const forecastProvenanceSchema = z.object({
  modelArtifactUri: z.string().min(1),
  trainedAt: isoDateTimeSchema,
  algorithmVersion: z.string().min(1),
  trainingWindowDays: z.number().int().positive(),
  hyperparameters: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type ForecastProvenance = z.infer<typeof forecastProvenanceSchema>;

export const forecastModelSchema = z.object({
  metric: z.string().min(1),
  horizon: forecastHorizonSchema,
  method: forecastMethodSchema,
  historicalPoints: z.array(forecastHistoricalPointSchema),
  forecastPoints: z.array(forecastProjectionPointSchema),
  confidenceScore: z.number().min(0).max(1),
  explanations: forecastExplanationSchema.optional(),
  provenance: forecastProvenanceSchema.optional(),
  generatedAt: isoDateTimeSchema,
});

export type ForecastModel = z.infer<typeof forecastModelSchema>;

export type AnomalyAlertEntity = AnomalyAlert;
export type ForecastModelEntity = ForecastModel;

export const anomalyAlertListResponseSchema = z.object({
  anomalies: z.array(anomalyAlertSchema),
});

export type AnomalyAlertListResponse = z.infer<typeof anomalyAlertListResponseSchema>;

export const forecastResponseSchema = z.object({
  forecast: forecastModelSchema,
});

export type ForecastResponse = z.infer<typeof forecastResponseSchema>;
