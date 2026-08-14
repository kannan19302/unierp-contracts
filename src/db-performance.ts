/**
 * @file db-performance.ts
 * @description Database query and write performance benchmarks, budgets, and SLA profiling contracts at production scale (100M rows).
 * Phase P12-051: Database performance at volume.
 *
 * Exit criterion:
 *   "Targets met at 100 million rows on the reference profile, measured"
 */

export interface QueryPerformanceBudget {
  operationType: "POINT_LOOKUP" | "INDEX_SCAN_PAGINATED" | "AGGREGATION_TENANT" | "BATCH_INSERT" | "SINGLE_WRITE";
  maxLatencyP95Ms: number;
  maxLatencyP99Ms: number;
  maxMemoryPerQueryKb: number;
  targetScaleRows: number;
}

export interface QueryPerformanceMeasurement {
  profileName: string;
  operationType: QueryPerformanceBudget["operationType"];
  rowCount: number;
  measuredLatencyP95Ms: number;
  measuredLatencyP99Ms: number;
  measuredMemoryKb: number;
  indexUsed: string;
  executionPlan: string;
}

export const PRODUCTION_100M_BUDGETS: Record<QueryPerformanceBudget["operationType"], QueryPerformanceBudget> = {
  POINT_LOOKUP: {
    operationType: "POINT_LOOKUP",
    maxLatencyP95Ms: 5,
    maxLatencyP99Ms: 15,
    maxMemoryPerQueryKb: 64,
    targetScaleRows: 100_000_000,
  },
  INDEX_SCAN_PAGINATED: {
    operationType: "INDEX_SCAN_PAGINATED",
    maxLatencyP95Ms: 25,
    maxLatencyP99Ms: 50,
    maxMemoryPerQueryKb: 512,
    targetScaleRows: 100_000_000,
  },
  AGGREGATION_TENANT: {
    operationType: "AGGREGATION_TENANT",
    maxLatencyP95Ms: 80,
    maxLatencyP99Ms: 150,
    maxMemoryPerQueryKb: 2048,
    targetScaleRows: 100_000_000,
  },
  SINGLE_WRITE: {
    operationType: "SINGLE_WRITE",
    maxLatencyP95Ms: 15,
    maxLatencyP99Ms: 30,
    maxMemoryPerQueryKb: 128,
    targetScaleRows: 100_000_000,
  },
  BATCH_INSERT: {
    operationType: "BATCH_INSERT",
    maxLatencyP95Ms: 100,
    maxLatencyP99Ms: 250,
    maxMemoryPerQueryKb: 8192,
    targetScaleRows: 100_000_000,
  },
};

export class QueryBudgetBreachError extends Error {
  public readonly profileName: string;
  public readonly metric: string;
  public readonly measured: number;
  public readonly budget: number;

  constructor(
    profileName: string,
    metric: string,
    measured: number,
    budget: number
  ) {
    super(
      `Database performance budget breached for "${profileName}": ${metric} measured ${measured} exceeds SLA budget ${budget} at 100M-row production profile.`
    );
    this.name = "QueryBudgetBreachError";
    this.profileName = profileName;
    this.metric = metric;
    this.measured = measured;
    this.budget = budget;
  }
}

/**
 * Validates a measurement against the reference 100M-row production performance budget.
 */
export function validateDatabasePerformanceSla(
  measurement: QueryPerformanceMeasurement
): { valid: boolean; budget: QueryPerformanceBudget } {
  const budget = PRODUCTION_100M_BUDGETS[measurement.operationType];
  if (!budget) {
    throw new Error(`Unknown operation type: ${measurement.operationType}`);
  }

  if (measurement.measuredLatencyP95Ms > budget.maxLatencyP95Ms) {
    throw new QueryBudgetBreachError(
      measurement.profileName,
      "p95 Latency",
      measurement.measuredLatencyP95Ms,
      budget.maxLatencyP95Ms
    );
  }

  if (measurement.measuredLatencyP99Ms > budget.maxLatencyP99Ms) {
    throw new QueryBudgetBreachError(
      measurement.profileName,
      "p99 Latency",
      measurement.measuredLatencyP99Ms,
      budget.maxLatencyP99Ms
    );
  }

  if (measurement.measuredMemoryKb > budget.maxMemoryPerQueryKb) {
    throw new QueryBudgetBreachError(
      measurement.profileName,
      "Memory Per Query",
      measurement.measuredMemoryKb,
      budget.maxMemoryPerQueryKb
    );
  }

  return { valid: true, budget };
}
