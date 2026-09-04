/**
 * L0 Analytics domain entities & Semantic Metric ASTs.
 * Zero-dependency contracts defining the data shapes for BI Dashboards,
 * Reports, KPIs, Visual Query AST, Metric Definitions, Forecasts, and Anomalies.
 */

export type ChartType =
  | "BAR"
  | "LINE"
  | "AREA"
  | "PIE"
  | "DONUT"
  | "SCATTER"
  | "GAUGE"
  | "HEATMAP"
  | "PIVOT"
  | "METRIC_CARD";

export type MetricAggregationFn =
  | "SUM"
  | "AVG"
  | "COUNT"
  | "COUNT_DISTINCT"
  | "MIN"
  | "MAX"
  | "PERCENTILE_95"
  | "STDDEV";

export type TimeGrain =
  | "HOUR"
  | "DAY"
  | "WEEK"
  | "MONTH"
  | "QUARTER"
  | "YEAR";

export type AnomalySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface DashboardEntity {
  id: string;
  tenantId: string;
  orgId: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  layout: AnalyticsWidgetLayout[];
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsWidgetLayout {
  id: string;
  title: string;
  chartType: ChartType;
  source: string;
  width: 1 | 2 | 3 | 4;
  height?: number;
  metricId?: string;
  dimension?: string;
  aggregation?: MetricAggregationFn;
  refreshIntervalSeconds?: number;
}

export interface ReportEntity {
  id: string;
  tenantId: string;
  orgId: string;
  name: string;
  description?: string | null;
  query: QueryAst;
  type: "BUILDER" | "SQL" | "PIVOT";
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KpiEntity {
  id: string;
  tenantId: string;
  orgId: string;
  name: string;
  code: string;
  value: string;
  unit?: string | null;
  trend: number[];
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BiMetricDefinitionEntity {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  category: "FINANCE" | "SALES" | "SUPPLY_CHAIN" | "HR" | "OPERATIONS" | "PROJECTS";
  source: string;
  expression: string;
  unit?: string | null;
  dimensions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueryFilterCondition {
  field: string;
  operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "IN" | "BETWEEN" | "CONTAINS";
  value: unknown;
}

export interface QueryAst {
  source: string;
  fields: Array<{
    field: string;
    alias?: string;
    aggregation?: MetricAggregationFn;
  }>;
  filters?: QueryFilterCondition[];
  groupBy?: string[];
  orderBy?: Array<{
    field: string;
    direction: "ASC" | "DESC";
  }>;
  limit?: number;
  offset?: number;
}

export interface PivotQuerySpec {
  source: string;
  rowFields: string[];
  colFields: string[];
  aggregations: Array<{
    field: string;
    fn: MetricAggregationFn;
  }>;
  filters?: QueryFilterCondition[];
}

export interface AnomalyAlertEntity {
  id: string;
  tenantId: string;
  metric: string;
  severity: AnomalySeverity;
  currentValue: number;
  expectedValue: number;
  deviationPercent: number;
  detectedAt: Date;
  status: "DETECTED" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";
  rootCauseAnalysis?: string | null;
}

export interface ForecastModelEntity {
  metric: string;
  horizon: "7D" | "30D" | "90D" | "1Y";
  method: "LINEAR" | "EXPONENTIAL" | "ARIMA" | "HOLT_WINTERS";
  historicalPoints: Array<{ timestamp: string; value: number }>;
  forecastPoints: Array<{
    timestamp: string;
    projected: number;
    upperBound: number;
    lowerBound: number;
  }>;
  confidenceScore: number;
  generatedAt: Date;
}

export interface RealtimeTelemetrySnapshot {
  tenantId: string;
  timestamp: string;
  activeUsersNow: number;
  requestsPerSecond: number;
  p99LatencyMs: number;
  activeSessions: Array<{
    id: string;
    location: string;
    activePage: string;
    duration: string;
  }>;
}
