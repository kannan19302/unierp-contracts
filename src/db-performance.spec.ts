import { describe, it, expect } from "vitest";
import {
  validateDatabasePerformanceSla,
  PRODUCTION_100M_BUDGETS,
  QueryBudgetBreachError,
} from "./db-performance.js";

describe("Database 100M-row Performance SLA Primitives", () => {
  it("validates queries meeting the 100M-row performance budget", () => {
    const measurement = {
      profileName: "GL_JOURNAL_LOOKUP_BY_TENANT_ID",
      operationType: "POINT_LOOKUP" as const,
      rowCount: 100_000_000,
      measuredLatencyP95Ms: 2.1,
      measuredLatencyP99Ms: 4.8,
      measuredMemoryKb: 32,
      indexUsed: "gl_journal_entries_tenant_id_id_idx",
      executionPlan: "Index Scan using gl_journal_entries_tenant_id_id_idx",
    };

    const res = validateDatabasePerformanceSla(measurement);
    expect(res.valid).toBe(true);
    expect(res.budget.maxLatencyP95Ms).toBe(5);
  });

  it("throws QueryBudgetBreachError when p95 latency exceeds 100M-row budget", () => {
    const slowQuery = {
      profileName: "UNINDEXED_TRANSACTION_SCAN",
      operationType: "INDEX_SCAN_PAGINATED" as const,
      rowCount: 100_000_000,
      measuredLatencyP95Ms: 85.0, // Budget is 25ms
      measuredLatencyP99Ms: 120.0,
      measuredMemoryKb: 256,
      indexUsed: "partial_scan",
      executionPlan: "Bitmap Heap Scan",
    };

    expect(() => validateDatabasePerformanceSla(slowQuery)).toThrow(QueryBudgetBreachError);
  });
});
