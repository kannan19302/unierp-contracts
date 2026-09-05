/**
 * @file query.ts
 * @description L0 Query AST, Allowed Operators, Grouping, Comparison, Drillthrough & Limit Enforcers.
 * Zero-dependency Zod schemas for the Visual Query Builder and Pivot Query Engine.
 */

import { z } from "zod";
import { metricAggregationFnSchema } from "./dashboards.js";

export const allowedOperatorSchema = z.enum([
  "EQUALS",
  "NOT_EQUALS",
  "GREATER_THAN",
  "GREATER_THAN_OR_EQUAL",
  "LESS_THAN",
  "LESS_THAN_OR_EQUAL",
  "IN",
  "NOT_IN",
  "BETWEEN",
  "NOT_BETWEEN",
  "CONTAINS",
  "NOT_CONTAINS",
  "STARTS_WITH",
  "ENDS_WITH",
  "IS_NULL",
  "IS_NOT_NULL",
  "REGEX_MATCH",
]);

export type AllowedOperator = z.infer<typeof allowedOperatorSchema>;

export const timeGrainSchema = z.enum([
  "SECOND",
  "MINUTE",
  "HOUR",
  "DAY",
  "WEEK",
  "MONTH",
  "QUARTER",
  "YEAR",
]);

export type TimeGrain = z.infer<typeof timeGrainSchema>;

export const queryFilterConditionSchema = z.object({
  field: z.string().min(1, "Filter field is required"),
  operator: allowedOperatorSchema,
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
    z.null(),
  ]),
  secondValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export type QueryFilterCondition = z.infer<typeof queryFilterConditionSchema>;

export const queryFilterGroupSchema = z.object({
  combinator: z.enum(["AND", "OR"]).default("AND"),
  conditions: z.array(queryFilterConditionSchema).min(1, "Group must have at least one condition"),
});

export type QueryFilterGroup = z.infer<typeof queryFilterGroupSchema>;

export const querySortSchema = z.object({
  field: z.string().min(1),
  direction: z.enum(["ASC", "DESC"]).default("ASC"),
  nullsLast: z.boolean().default(true),
});

export type QuerySort = z.infer<typeof querySortSchema>;

export const queryPaginationSchema = z.object({
  limit: z.number().int().min(1).max(10000, "Maximum query row limit is 10,000").default(100),
  offset: z.number().int().min(0).default(0),
});

export type QueryPagination = z.infer<typeof queryPaginationSchema>;

export const queryComparisonTypeSchema = z.enum([
  "PREVIOUS_PERIOD",
  "PREVIOUS_YEAR",
  "CUSTOM_RANGE",
]);

export type QueryComparisonType = z.infer<typeof queryComparisonTypeSchema>;

export const queryComparisonSchema = z.object({
  type: queryComparisonTypeSchema,
  baselineStartDate: z.string().optional(),
  baselineEndDate: z.string().optional(),
});

export type QueryComparison = z.infer<typeof queryComparisonSchema>;

export const queryDrillthroughSchema = z.object({
  targetEntity: z.string().min(1),
  parentFilters: z.array(queryFilterConditionSchema).default([]),
  childDimension: z.string().min(1),
});

export type QueryDrillthrough = z.infer<typeof queryDrillthroughSchema>;

export const queryAstSelectFieldSchema = z.object({
  field: z.string().min(1),
  alias: z.string().optional(),
  aggregation: metricAggregationFnSchema.optional(),
  expression: z.string().optional(),
});

export type QueryAstSelectField = z.infer<typeof queryAstSelectFieldSchema>;

export const queryAstSchema = z.object({
  source: z.string().min(1, "Query source table or view is required"),
  fields: z.array(queryAstSelectFieldSchema).min(1, "At least one select field is required"),
  filters: z.array(queryFilterConditionSchema).optional().default([]),
  filterGroups: z.array(queryFilterGroupSchema).optional().default([]),
  groupBy: z.array(z.string().min(1)).optional().default([]),
  timeGrain: timeGrainSchema.optional(),
  timeField: z.string().optional(),
  comparison: queryComparisonSchema.optional(),
  drillthrough: queryDrillthroughSchema.optional(),
  orderBy: z.array(querySortSchema).optional().default([]),
  limit: z.number().int().min(1).max(10000, "Limit cannot exceed 10,000").default(100),
  offset: z.number().int().min(0).default(0),
});

export type QueryAst = z.infer<typeof queryAstSchema>;

export const executeVisualQueryRequestSchema = z.object({
  sourceTable: z.string().min(1, "sourceTable is required").default("analytics_events"),
  selectFields: z.array(z.string().min(1)).min(1, "At least one selectField is required"),
  filters: z.array(queryFilterConditionSchema).optional().default([]),
  filterGroups: z.array(queryFilterGroupSchema).optional().default([]),
  groupBy: z.array(z.string().min(1)).optional().default([]),
  orderBy: z.array(querySortSchema).optional().default([]),
  limit: z.number().int().min(1).max(10000).default(100),
  offset: z.number().int().min(0).default(0),
});

export type ExecuteVisualQueryRequest = z.infer<typeof executeVisualQueryRequestSchema>;

export const executeVisualQueryResponseSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.record(z.unknown())),
  totalCount: z.number().int().nonnegative(),
  executionTimeMs: z.number().int().nonnegative(),
  queryHash: z.string().optional(),
});

export type ExecuteVisualQueryResponse = z.infer<typeof executeVisualQueryResponseSchema>;

export const pivotAggregationSchema = z.object({
  field: z.string().min(1),
  fn: metricAggregationFnSchema,
});

export type PivotAggregation = z.infer<typeof pivotAggregationSchema>;

export const pivotQuerySpecSchema = z.object({
  source: z.string().min(1),
  rowFields: z.array(z.string().min(1)).min(1, "At least one rowField is required"),
  colFields: z.array(z.string().min(1)).default([]),
  aggregations: z.array(pivotAggregationSchema).min(1, "At least one aggregation is required"),
  filters: z.array(queryFilterConditionSchema).optional().default([]),
});

export type PivotQuerySpec = z.infer<typeof pivotQuerySpecSchema>;

export const pivotAggregationInputSchema = z.union([
  pivotAggregationSchema,
  z.string().min(1),
]);

export type PivotAggregationInput = z.infer<typeof pivotAggregationInputSchema>;

export const executePivotQueryRequestSchema = z.object({
  source: z.string().min(1).default("analytics_events"),
  rowFields: z.array(z.string().min(1)).min(1),
  colFields: z.array(z.string().min(1)).default([]),
  aggregations: z.array(pivotAggregationInputSchema).min(1),
  filters: z.array(queryFilterConditionSchema).optional().default([]),
});

export type ExecutePivotQueryRequest = z.infer<typeof executePivotQueryRequestSchema>;

export const executePivotQueryResponseSchema = z.object({
  rowHeaders: z.array(z.string()),
  colHeaders: z.array(z.string()),
  matrix: z.array(z.array(z.union([z.number(), z.string(), z.null()]))),
  totals: z.object({
    rowTotals: z.array(z.number()),
    colTotals: z.array(z.number()),
    grandTotal: z.number(),
  }),
});

export type ExecutePivotQueryResponse = z.infer<typeof executePivotQueryResponseSchema>;
