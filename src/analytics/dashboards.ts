/**
 * @file dashboards.ts
 * @description L0 Dashboard, Widget Layout, Filters, Folders, Sharing & Optimistic Concurrency Contracts.
 * Zero-dependency Zod schemas for BI Dashboards, Responsive Grid Layouts, and Interactive Filters.
 */

import { z } from "zod";
import { isoDateTimeSchema } from "./common.js";

export const chartTypeSchema = z.enum([
  "BAR",
  "LINE",
  "AREA",
  "PIE",
  "DONUT",
  "SCATTER",
  "GAUGE",
  "HEATMAP",
  "PIVOT",
  "METRIC_CARD",
  "TABLE",
  "FUNNEL",
  "COHORT",
  "RADAR",
  "TREEMAP",
  "WATERFALL",
]);

export type ChartType = z.infer<typeof chartTypeSchema>;

export const metricAggregationFnSchema = z.enum([
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
]);

export type MetricAggregationFn = z.infer<typeof metricAggregationFnSchema>;

export const widgetVisualConfigSchema = z.object({
  colorPalette: z.string().optional(),
  showLegend: z.boolean().default(true),
  showGridLines: z.boolean().default(true),
  showDataLabels: z.boolean().default(false),
  yAxisMin: z.number().optional(),
  yAxisMax: z.number().optional(),
  formatPattern: z.string().optional(),
  compactNumbers: z.boolean().default(true),
});

export type WidgetVisualConfig = z.infer<typeof widgetVisualConfigSchema>;

export const widgetLayoutSchema = z.object({
  id: z.string().min(1, "Widget ID is required"),
  title: z.string().min(1, "Widget title is required").max(120),
  description: z.string().max(500).optional().nullable(),
  chartType: chartTypeSchema,
  source: z.string().min(1, "Source dataset or entity is required"),
  x: z.number().int().min(0).max(11).default(0),
  y: z.number().int().min(0).default(0),
  width: z.number().int().min(1).max(12).default(4),
  height: z.number().int().min(1).max(24).default(4),
  metricId: z.string().optional().nullable(),
  dimension: z.string().optional().nullable(),
  secondaryDimension: z.string().optional().nullable(),
  aggregation: metricAggregationFnSchema.optional().nullable(),
  refreshIntervalSeconds: z.number().int().min(0).max(86400).optional().nullable(),
  visualConfig: widgetVisualConfigSchema.optional(),
  customProperties: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type WidgetLayout = z.infer<typeof widgetLayoutSchema>;

export const dashboardFilterOperatorSchema = z.enum([
  "EQUALS",
  "NOT_EQUALS",
  "GREATER_THAN",
  "LESS_THAN",
  "IN",
  "NOT_IN",
  "BETWEEN",
  "CONTAINS",
]);

export type DashboardFilterOperator = z.infer<typeof dashboardFilterOperatorSchema>;

export const dashboardFilterSchema = z.object({
  id: z.string().min(1),
  field: z.string().min(1),
  label: z.string().min(1),
  operator: dashboardFilterOperatorSchema.default("EQUALS"),
  values: z.array(z.union([z.string(), z.number(), z.boolean()])).default([]),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  isMandatory: z.boolean().default(false),
  applicableWidgetIds: z.array(z.string()).default([]),
});

export type DashboardFilter = z.infer<typeof dashboardFilterSchema>;

export const dashboardSharingSchema = z.object({
  isPublic: z.boolean().default(false),
  sharedWithUsers: z.array(z.string()).default([]),
  sharedWithRoles: z.array(z.string()).default([]),
  sharedWithTeams: z.array(z.string()).default([]),
  allowDrilldown: z.boolean().default(true),
  allowExport: z.boolean().default(true),
});

export type DashboardSharing = z.infer<typeof dashboardSharingSchema>;

export const dashboardFolderSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  tenantId: z.string().min(1),
  orgId: z.string().min(1),
  name: z.string().min(1).max(80),
  parentFolderId: z.string().optional().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type DashboardFolder = z.infer<typeof dashboardFolderSchema>;

export const dashboardFavoriteSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  dashboardId: z.string().min(1),
  favoritedAt: isoDateTimeSchema,
});

export type DashboardFavorite = z.infer<typeof dashboardFavoriteSchema>;

export const dashboardSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  tenantId: z.string().min(1, "Tenant ID is required"),
  orgId: z.string().min(1, "Organization ID is required"),
  name: z.string().min(1, "Dashboard name is required").max(100),
  description: z.string().max(1000).optional().nullable(),
  isSystem: z.boolean().default(false),
  version: z.number().int().positive("Version must be a positive integer").default(1),
  folderId: z.string().optional().nullable(),
  layout: z.array(widgetLayoutSchema).default([]),
  filters: z.array(dashboardFilterSchema).default([]),
  sharing: dashboardSharingSchema.default({
    isPublic: false,
    sharedWithUsers: [],
    sharedWithRoles: [],
    sharedWithTeams: [],
    allowDrilldown: true,
    allowExport: true,
  }),
  tags: z.array(z.string().min(1)).default([]),
  createdBy: z.string().optional().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type Dashboard = z.infer<typeof dashboardSchema>;

export const createDashboardSchema = z.object({
  name: z.string().min(1, "Dashboard name is required").max(100),
  description: z.string().max(1000).optional().nullable(),
  folderId: z.string().optional().nullable(),
  layout: z.array(widgetLayoutSchema).optional().default([]),
  filters: z.array(dashboardFilterSchema).optional().default([]),
  sharing: dashboardSharingSchema.optional(),
  tags: z.array(z.string().min(1)).optional().default([]),
});

export type CreateDashboardRequest = z.infer<typeof createDashboardSchema>;

export const updateDashboardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  folderId: z.string().optional().nullable(),
  layout: z.array(widgetLayoutSchema).optional(),
  filters: z.array(dashboardFilterSchema).optional(),
  sharing: dashboardSharingSchema.optional(),
  tags: z.array(z.string().min(1)).optional(),
  expectedVersion: z.number().int().positive("expectedVersion must be positive for optimistic locking").optional(),
});

export type UpdateDashboardRequest = z.infer<typeof updateDashboardSchema>;

export type DashboardEntity = Dashboard;
export type AnalyticsWidgetLayout = WidgetLayout;

export const dashboardResponseSchema = z.object({
  dashboard: dashboardSchema,
});

export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;

export const dashboardListResponseSchema = z.object({
  dashboards: z.array(dashboardSchema),
});

export type DashboardListResponse = z.infer<typeof dashboardListResponseSchema>;
