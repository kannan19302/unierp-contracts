/**
 * @file analytics-contracts.spec.ts
 * @description Comprehensive test suite validating L0 Zod contracts for Analytics.
 * Tests serialization, exactness, validation rejections, optimistic locking, query limits, and envelopes.
 */

import { describe, it, expect } from "vitest";
import {
  // Common
  isoDateTimeSchema,
  decimalStringSchema,
  currencyCodeSchema,
  analyticsMoneySchema,
  ownerSchema,
  certificationSchema,
  freshnessSchema,
  dataQualitySchema,
  // Metrics
  metricDefinitionSchema,
  createMetricDefinitionSchema,
  updateMetricDefinitionSchema,
  metricValueSnapshotSchema,
  // Dashboards
  chartTypeSchema,
  widgetLayoutSchema,
  dashboardFilterSchema,
  dashboardSchema,
  createDashboardSchema,
  updateDashboardSchema,
  // Reports
  reportSchema,
  reportParameterSchema,
  reportScheduleSchema,
  reportDeliverySchema,
  // Query
  queryAstSchema,
  allowedOperatorSchema,
  executeVisualQueryRequestSchema,
  executePivotQueryRequestSchema,
  // Predictive
  funnelAnalysisSchema,
  cohortAnalysisSchema,
  trendAnalysisSchema,
  anomalyAlertSchema,
  forecastModelSchema,
  // Pipelines
  dataPipelineSchema,
  pipelineRefreshRunSchema,
  dataQualityResultSchema,
  realtimeTelemetrySnapshotSchema,
  // Exports
  exportRequestSchema,
  exportJobSchema,
  // Envelopes
  createSuccessEnvelopeSchema,
  apiErrorEnvelopeSchema,
  validationErrorEnvelopeSchema,
  forbiddenErrorEnvelopeSchema,
  staleVersionEnvelopeSchema,
  createPaginatedEnvelopeSchema,
  asyncJobEnvelopeSchema,
} from "../index.js";
import { z } from "zod";

describe("L0 Analytics Contracts Verification Suite", () => {
  // ─── 1. Common Enforcers ───────────────────────────────────────────────────

  describe("Common Governance & Exactness Enforcers", () => {
    it("accepts valid ISO 8601 UTC date-time and rejects invalid formats", () => {
      const validIso = "2026-09-04T12:00:00.000Z";
      expect(isoDateTimeSchema.parse(validIso)).toBe(validIso);

      expect(() => isoDateTimeSchema.parse("not-a-date")).toThrow();
      expect(() => isoDateTimeSchema.parse("2026-09-04")).toThrow();
      expect(() => isoDateTimeSchema.parse(1725451200000)).toThrow();
    });

    it("enforces Decimal(19,4) numeric string exactness (anti-IEEE 754 drift)", () => {
      expect(decimalStringSchema.parse("1250000.50")).toBe("1250000.50");
      expect(decimalStringSchema.parse("-99.1234")).toBe("-99.1234");
      expect(decimalStringSchema.parse("100")).toBe("100");

      // Reject floating point numbers
      expect(() => decimalStringSchema.parse(100.5 as unknown as string)).toThrow();
      // Reject excessive decimal precision (>4 places)
      expect(() => decimalStringSchema.parse("100.12345")).toThrow();
      // Reject non-numeric strings
      expect(() => decimalStringSchema.parse("abc")).toThrow();
    });

    it("validates currency codes and money amounts", () => {
      expect(currencyCodeSchema.parse("USD")).toBe("USD");
      expect(currencyCodeSchema.parse("EUR")).toBe("EUR");
      expect(() => currencyCodeSchema.parse("XYZ")).toThrow();

      const money = analyticsMoneySchema.parse({
        amount: "54200.75",
        currency: "USD",
      });
      expect(money.amount).toBe("54200.75");
      expect(money.currency).toBe("USD");
    });

    it("validates data quality scores and governance owners", () => {
      const owner = ownerSchema.parse({
        userId: "usr_123",
        email: "cfo@meridian.com",
        role: "EXECUTIVE",
      });
      expect(owner.email).toBe("cfo@meridian.com");

      const quality = dataQualitySchema.parse({
        score: 98.5,
        passedRules: 42,
        failedRules: 1,
        lastAuditDate: "2026-09-04T12:00:00.000Z",
      });
      expect(quality.score).toBe(98.5);

      // Quality score must be between 0 and 100
      expect(() =>
        dataQualitySchema.parse({
          score: 105,
          passedRules: 1,
          failedRules: 0,
          lastAuditDate: "2026-09-04T12:00:00.000Z",
        })
      ).toThrow();
    });
  });

  // ─── 2. Metric Definitions ─────────────────────────────────────────────────

  describe("Metric Definitions & Value Snapshots", () => {
    it("parses valid metric definition with versioning, lineage and freshness", () => {
      const metric = metricDefinitionSchema.parse({
        id: "d83f8b0e-3b2d-4b8f-9a1b-2c3d4e5f6a7b",
        tenantId: "tenant_meridian",
        name: "Monthly Recurring Revenue",
        code: "MRR_TOTAL",
        description: "Sum of all active recurring subscription billings",
        category: "FINANCE",
        version: 2,
        unit: "CURRENCY",
        currency: "USD",
        source: "subscription_invoices",
        expression: "SUM(monthly_amount)",
        dimensions: ["customer_tier", "region", "billing_cycle"],
        certification: {
          level: "GOLD",
          certifiedBy: "lead_financial_analyst",
          certifiedAt: "2026-09-01T00:00:00.000Z",
        },
        freshness: {
          lastRefreshedAt: "2026-09-04T12:00:00.000Z",
          slaMinutes: 60,
          isStale: false,
        },
        isActive: true,
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-04T12:00:00.000Z",
      });

      expect(metric.code).toBe("MRR_TOTAL");
      expect(metric.version).toBe(2);
      expect(metric.certification?.level).toBe("GOLD");
    });

    it("rejects invalid metric code format", () => {
      expect(() =>
        metricDefinitionSchema.parse({
          id: "m1",
          tenantId: "t1",
          name: "Test",
          code: "invalid-lowercase-code",
          category: "FINANCE",
          source: "orders",
          expression: "COUNT(*)",
          createdAt: "2026-09-04T12:00:00.000Z",
          updatedAt: "2026-09-04T12:00:00.000Z",
        })
      ).toThrow();
    });

    it("supports optimistic concurrency in updateMetricDefinitionSchema", () => {
      const updatePayload = updateMetricDefinitionSchema.parse({
        description: "Updated description",
        expectedVersion: 3,
      });
      expect(updatePayload.expectedVersion).toBe(3);
    });
  });

  // ─── 3. Dashboards & Layouts ───────────────────────────────────────────────

  describe("Dashboards, Grid Layouts & Filters", () => {
    it("parses valid dashboard with responsive grid layout and filters", () => {
      const dashboard = dashboardSchema.parse({
        id: "dash_001",
        tenantId: "tenant_meridian",
        orgId: "org_finance",
        name: "Executive Financial Pulse",
        version: 1,
        layout: [
          {
            id: "widget_mrr",
            title: "Net MRR",
            chartType: "METRIC_CARD",
            source: "metrics.MRR_TOTAL",
            x: 0,
            y: 0,
            width: 4,
            height: 3,
            aggregation: "SUM",
          },
          {
            id: "widget_revenue_trend",
            title: "Revenue by Month",
            chartType: "BAR",
            source: "invoices",
            x: 4,
            y: 0,
            width: 8,
            height: 6,
            dimension: "billing_month",
            aggregation: "SUM",
          },
        ],
        filters: [
          {
            id: "flt_region",
            field: "region",
            label: "Geographic Region",
            operator: "IN",
            values: ["NA", "EMEA", "APAC"],
          },
        ],
        createdAt: "2026-09-04T12:00:00.000Z",
        updatedAt: "2026-09-04T12:00:00.000Z",
      });

      expect(dashboard.layout.length).toBe(2);
      expect(dashboard.layout[0].width).toBe(4);
      expect(dashboard.filters[0].operator).toBe("IN");
    });

    it("rejects widget layout exceeding 12 grid columns", () => {
      expect(() =>
        widgetLayoutSchema.parse({
          id: "w1",
          title: "Too wide widget",
          chartType: "LINE",
          source: "events",
          width: 13,
        })
      ).toThrow();
    });

    it("validates updateDashboardSchema with optimistic concurrency", () => {
      const update = updateDashboardSchema.parse({
        name: "Renamed Dashboard",
        expectedVersion: 4,
      });
      expect(update.expectedVersion).toBe(4);
      expect(update.name).toBe("Renamed Dashboard");
    });
  });

  // ─── 4. Reports & Deliveries ───────────────────────────────────────────────

  describe("BI Reports, Parameters & Schedules", () => {
    it("parses report with parameters, cron schedule, and email delivery", () => {
      const report = reportSchema.parse({
        id: "rep_001",
        tenantId: "tenant_meridian",
        orgId: "org_ops",
        name: "Weekly Inventory Discrepancy",
        type: "BUILDER",
        version: 1,
        query: { source: "inventory_audit" },
        parameters: [
          {
            id: "param_warehouse",
            name: "warehouseId",
            label: "Warehouse Location",
            type: "SELECT",
            isRequired: true,
          },
        ],
        schedules: [
          {
            id: "sch_weekly",
            reportId: "rep_001",
            cronExpression: "0 8 * * 1",
            timezone: "America/New_York",
            isActive: true,
          },
        ],
        deliveries: [
          {
            id: "del_ops_team",
            channel: "EMAIL",
            recipients: ["ops-lead@meridian.com", "plant-manager@meridian.com"],
            format: "XLSX",
          },
        ],
        createdAt: "2026-09-04T12:00:00.000Z",
        updatedAt: "2026-09-04T12:00:00.000Z",
      });

      expect(report.deliveries[0].format).toBe("XLSX");
      expect(report.schedules[0].cronExpression).toBe("0 8 * * 1");
    });

    it("rejects delivery with zero recipients", () => {
      expect(() =>
        reportDeliverySchema.parse({
          id: "del_empty",
          channel: "EMAIL",
          recipients: [],
          format: "CSV",
        })
      ).toThrow();
    });
  });

  // ─── 5. Query AST & Limits ─────────────────────────────────────────────────

  describe("Query AST, Allowed Operators & Protection Limits", () => {
    it("parses visual query AST with allowed operators, grouping and sorting", () => {
      const ast = queryAstSchema.parse({
        source: "analytics_events",
        fields: [
          { field: "event_name", alias: "event" },
          { field: "amount", aggregation: "SUM", alias: "totalAmount" },
        ],
        filters: [
          {
            field: "status",
            operator: "EQUALS",
            value: "COMPLETED",
          },
          {
            field: "created_at",
            operator: "BETWEEN",
            value: "2026-01-01T00:00:00.000Z",
            secondValue: "2026-06-30T23:59:59.000Z",
          },
        ],
        groupBy: ["event_name"],
        orderBy: [{ field: "totalAmount", direction: "DESC" }],
        limit: 500,
        offset: 0,
      });

      expect(ast.limit).toBe(500);
      expect(ast.filters?.[1].operator).toBe("BETWEEN");
    });

    it("enforces maximum row limit of 10,000 to prevent denial-of-service", () => {
      expect(() =>
        queryAstSchema.parse({
          source: "big_table",
          fields: [{ field: "id" }],
          limit: 10001,
        })
      ).toThrow();
    });

    it("rejects illegal/unwhitelisted query filter operators", () => {
      expect(() =>
        allowedOperatorSchema.parse("DROP_TABLE" as unknown as string)
      ).toThrow();
    });

    it("validates pivot query request format", () => {
      const pivot = executePivotQueryRequestSchema.parse({
        source: "sales_transactions",
        rowFields: ["region", "country"],
        colFields: ["quarter"],
        aggregations: [{ field: "revenue", fn: "SUM" }],
      });

      expect(pivot.rowFields).toEqual(["region", "country"]);
      expect(pivot.aggregations[0].fn).toBe("SUM");
    });
  });

  // ─── 6. Predictive Intelligence ────────────────────────────────────────────

  describe("Predictive Intelligence, Funnels & Forecasts", () => {
    it("parses funnel analysis with conversion rates", () => {
      const funnel = funnelAnalysisSchema.parse({
        funnelId: "funnel_onboarding",
        name: "Self-Service Sign Up Funnel",
        steps: [
          {
            stepOrder: 1,
            name: "Landing Page View",
            entrantsCount: 10000,
            dropoffCount: 3000,
            conversionRatePercent: 70,
          },
          {
            stepOrder: 2,
            name: "Workspace Created",
            entrantsCount: 7000,
            dropoffCount: 2000,
            conversionRatePercent: 71.4,
          },
        ],
        overallConversionRatePercent: 50,
      });

      expect(funnel.steps.length).toBe(2);
      expect(funnel.overallConversionRatePercent).toBe(50);
    });

    it("parses anomaly alert with severity and deviation", () => {
      const anomaly = anomalyAlertSchema.parse({
        id: "anom_001",
        tenantId: "tenant_meridian",
        metric: "PAYMENT_FAILURE_RATE",
        severity: "CRITICAL",
        status: "DETECTED",
        currentValue: 14.8,
        expectedValue: 1.2,
        deviationPercent: 1133.3,
        zScore: 4.8,
        detectedAt: "2026-09-04T12:00:00.000Z",
        rootCauseAnalysis: "Payment gateway upstream latency spike",
      });

      expect(anomaly.severity).toBe("CRITICAL");
      expect(anomaly.deviationPercent).toBe(1133.3);
    });

    it("parses statistical forecast with confidence intervals and provenance", () => {
      const forecast = forecastModelSchema.parse({
        metric: "CASH_FLOW_PREDICTION",
        horizon: "90D",
        method: "ARIMA",
        historicalPoints: [
          { timestamp: "2026-08-01T00:00:00.000Z", value: 1200000 },
          { timestamp: "2026-09-01T00:00:00.000Z", value: 1250000 },
        ],
        forecastPoints: [
          {
            timestamp: "2026-10-01T00:00:00.000Z",
            projected: 1300000,
            upperBound: 1350000,
            lowerBound: 1250000,
            confidenceInterval: 0.95,
          },
        ],
        confidenceScore: 0.92,
        provenance: {
          modelArtifactUri: "s3://models/cash-flow-arima-v2.bin",
          trainedAt: "2026-09-04T00:00:00.000Z",
          algorithmVersion: "2.4.1",
          trainingWindowDays: 365,
        },
        generatedAt: "2026-09-04T12:00:00.000Z",
      });

      expect(forecast.method).toBe("ARIMA");
      expect(forecast.confidenceScore).toBe(0.92);
      expect(forecast.provenance?.trainingWindowDays).toBe(365);
    });
  });

  // ─── 7. Pipelines & Realtime Telemetry ──────────────────────────────────────

  describe("Data Pipelines & Telemetry", () => {
    it("parses pipeline definition and refresh run history", () => {
      const pipeline = dataPipelineSchema.parse({
        id: "pip_001",
        tenantId: "tenant_meridian",
        name: "Snowflake Ingestion Pipeline",
        sourceSystem: "ERP_POSTGRES",
        targetModel: "ANALYTICS_WAREHOUSE",
        cronSchedule: "0 */2 * * *",
        status: "RUNNING",
        isRealtime: false,
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-04T12:00:00.000Z",
      });
      expect(pipeline.status).toBe("RUNNING");

      const run = pipelineRefreshRunSchema.parse({
        id: "run_999",
        pipelineId: "pip_001",
        tenantId: "tenant_meridian",
        triggerType: "SCHEDULED",
        status: "COMPLETED",
        startedAt: "2026-09-04T10:00:00.000Z",
        completedAt: "2026-09-04T10:04:12.000Z",
        durationSeconds: 252,
        recordsProcessed: 145000,
        recordsFailed: 0,
      });
      expect(run.recordsProcessed).toBe(145000);
    });

    it("parses realtime telemetry snapshot with active users and Kafka lag", () => {
      const telemetry = realtimeTelemetrySnapshotSchema.parse({
        tenantId: "tenant_meridian",
        timestamp: "2026-09-04T12:00:00.000Z",
        activeUsersNow: 412,
        requestsPerSecond: 185.5,
        p99LatencyMs: 42.1,
        activeSessions: [
          {
            id: "sess_1",
            location: "US-East",
            activePage: "/analytics/dashboards",
            durationSeconds: 340,
          },
        ],
        ingestionLagMs: 85,
        kafkaLagOffsets: [
          {
            topic: "analytics.events",
            partition: 0,
            currentOffset: 100500,
            endOffset: 100505,
            lagRecords: 5,
          },
        ],
      });

      expect(telemetry.activeUsersNow).toBe(412);
      expect(telemetry.kafkaLagOffsets?.[0].lagRecords).toBe(5);
    });
  });

  // ─── 8. Exports & Audit ────────────────────────────────────────────────────

  describe("Data Exports & SHA-256 Audit Verification", () => {
    it("parses export job with SHA-256 checksum and retention expiry", () => {
      const job = exportJobSchema.parse({
        id: "job_exp_01",
        tenantId: "tenant_meridian",
        requestedBy: "usr_auditor",
        entityType: "REPORT",
        entityId: "rep_financial_audit",
        format: "PARQUET",
        status: "COMPLETED",
        rowCount: 500000,
        fileSizeBytes: 15485760,
        artifactUri: "s3://exports/audit-2026-09-04.parquet",
        sha256Checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        createdAt: "2026-09-04T11:00:00.000Z",
        completedAt: "2026-09-04T11:02:15.000Z",
        expiresAt: "2026-09-11T11:00:00.000Z",
      });

      expect(job.format).toBe("PARQUET");
      expect(job.sha256Checksum).toBe(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      );
    });

    it("rejects non-SHA-256 checksum", () => {
      expect(() =>
        exportJobSchema.parse({
          id: "job_bad",
          tenantId: "t1",
          requestedBy: "u1",
          entityType: "DASHBOARD",
          format: "CSV",
          sha256Checksum: "not-a-valid-sha256-hex-hash",
          createdAt: "2026-09-04T11:00:00.000Z",
          expiresAt: "2026-09-11T11:00:00.000Z",
        })
      ).toThrow();
    });
  });

  // ─── 9. Standard Envelopes ─────────────────────────────────────────────────

  describe("API Wire Envelopes & RFC 7807 Error Standards", () => {
    it("wraps successful responses with meta envelope", () => {
      const envelopeSchema = createSuccessEnvelopeSchema(z.object({ totalRevenue: z.string() }));
      const response = envelopeSchema.parse({
        success: true,
        data: { totalRevenue: "10500000.00" },
        meta: {
          requestId: "req_pulse_01",
          timestamp: "2026-09-04T12:00:00.000Z",
          version: "1.0.0",
          durationMs: 14,
        },
      });

      expect(response.success).toBe(true);
      expect(response.data.totalRevenue).toBe("10500000.00");
    });

    it("parses validation error envelope with invalidParams array", () => {
      const valError = validationErrorEnvelopeSchema.parse({
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Request validation failed",
          invalidParams: [
            {
              name: "layout[0].width",
              reason: "Width must not exceed 12 grid columns",
            },
          ],
        },
        meta: {
          requestId: "req_err_01",
          timestamp: "2026-09-04T12:00:00.000Z",
          version: "1.0.0",
        },
      });

      expect(valError.error.code).toBe("VALIDATION_FAILED");
      expect(valError.error.invalidParams[0].name).toBe("layout[0].width");
    });

    it("parses stale version (optimistic concurrency) error envelope", () => {
      const staleError = staleVersionEnvelopeSchema.parse({
        success: false,
        error: {
          code: "STALE_VERSION",
          message: "Dashboard has been modified by another user. Please refresh and retry.",
          currentVersion: 5,
          requestedVersion: 4,
        },
        meta: {
          requestId: "req_lock_01",
          timestamp: "2026-09-04T12:00:00.000Z",
          version: "1.0.0",
        },
      });

      expect(staleError.error.code).toBe("STALE_VERSION");
      expect(staleError.error.currentVersion).toBe(5);
      expect(staleError.error.requestedVersion).toBe(4);
    });

    it("parses paginated envelope with totalPages and pagination controls", () => {
      const paginatedSchema = createPaginatedEnvelopeSchema(z.object({ name: z.string() }));
      const result = paginatedSchema.parse({
        success: true,
        data: [{ name: "Dash 1" }, { name: "Dash 2" }],
        pagination: {
          total: 100,
          page: 1,
          limit: 2,
          totalPages: 50,
          hasNext: true,
          hasPrev: false,
        },
        meta: {
          requestId: "req_page_01",
          timestamp: "2026-09-04T12:00:00.000Z",
          version: "1.0.0",
        },
      });

      expect(result.pagination.totalPages).toBe(50);
      expect(result.pagination.hasNext).toBe(true);
    });

    it("parses asynchronous job envelope with progress percentage", () => {
      const asyncJob = asyncJobEnvelopeSchema.parse({
        success: true,
        data: {
          jobId: "job_async_77",
          status: "PROCESSING",
          progressPercentage: 45,
          estimatedTimeRemainingSec: 30,
          statusUrl: "/api/v1/analytics/jobs/job_async_77",
        },
        meta: {
          requestId: "req_async_01",
          timestamp: "2026-09-04T12:00:00.000Z",
          version: "1.0.0",
        },
      });

      expect(asyncJob.data.status).toBe("PROCESSING");
      expect(asyncJob.data.progressPercentage).toBe(45);
    });
  });
});
