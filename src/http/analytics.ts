/**
 * L0 Analytics HTTP contracts — request/response shapes for Dashboards,
 * Reports, KPIs, Visual Queries, and Predictive Intelligence endpoints.
 */

import type {
  DashboardEntity,
  ReportEntity,
  KpiEntity,
  QueryAst,
  AnomalyAlertEntity,
  ForecastModelEntity,
  RealtimeTelemetrySnapshot,
  ChartType,
} from "../entities/analytics.js";

export interface CreateDashboardRequest {
  name: string;
  description?: string;
  layout?: Array<{
    id: string;
    title: string;
    chartType: ChartType;
    source: string;
    width: 1 | 2 | 3 | 4;
  }>;
}

export interface UpdateDashboardRequest {
  name?: string;
  description?: string;
  layout?: unknown;
}

export interface DashboardResponse {
  dashboard: DashboardEntity;
}

export interface DashboardListResponse {
  dashboards: DashboardEntity[];
}

export interface CreateReportRequest {
  name: string;
  description?: string;
  query?: QueryAst | Record<string, unknown>;
  type?: "BUILDER" | "SQL" | "PIVOT";
}

export interface ReportResponse {
  report: ReportEntity;
}

export interface ReportListResponse {
  reports: ReportEntity[];
}

export interface KpiListResponse {
  kpis: KpiEntity[];
}

export interface ExecuteVisualQueryRequest {
  selectFields: string[];
  filterGroups?: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  sourceTable?: string;
  limit?: number;
}

export interface ExecuteVisualQueryResponse {
  columns: string[];
  rows: Record<string, unknown>[];
  totalCount: number;
  executionTimeMs: number;
}

export interface ExecutePivotQueryRequest {
  rowFields: string[];
  colFields: string[];
  aggregations: string[];
}

export interface ExecutePivotQueryResponse {
  rowHeaders: string[];
  colHeaders: string[];
  matrix: (number | string | null)[][];
  totals: {
    rowTotals: number[];
    colTotals: number[];
    grandTotal: number;
  };
}

export interface AnomalyAlertListResponse {
  anomalies: AnomalyAlertEntity[];
}

export interface ForecastResponse {
  forecast: ForecastModelEntity;
}

export interface RealtimeTelemetryResponse {
  telemetry: RealtimeTelemetrySnapshot;
}
