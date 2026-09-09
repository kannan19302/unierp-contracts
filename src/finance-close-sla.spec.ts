import { describe, expect, it } from "vitest";
import {
  AssignCloseTaskSlaRequestSchema, CreateCloseSlaPolicyRequestSchema,
  CloseSlaPolicyListQuerySchema, LegacyCreateCloseSlaPolicyRequestSchema, RetireCloseSlaPolicyRequestSchema,
  ReviseCloseSlaPolicyRequestSchema,
} from "./http/finance-close-sla.js";

const policy = {
  name: "Close review", taskType: "APPROVAL", priority: "HIGH", timeBasis: "ELAPSED",
  responseTimeMs: 60_000, resolutionTimeMs: 3_600_000,
};
const assignment = {
  taskId: "task-a", startedAt: "2026-09-09T09:00:00+05:30",
  idempotencyKey: "00000000-0000-4000-8000-000000000001",
};

describe("Finance SLA policy and task-instance contracts", () => {
  it("represents policies independently of tasks and preserves exact duration units", () => {
    const parsed = CreateCloseSlaPolicyRequestSchema.parse(policy);
    expect(parsed.responseTimeMs).toBe(60_000);
    expect(parsed.escalationRuleIds).toEqual([]);
    expect("taskId" in parsed).toBe(false);
  });

  it.each([0, -1, 0.5, Infinity, NaN, 3_155_760_000_001])(
    "rejects unrepresentable or nonpositive duration %s", (responseTimeMs) => {
      expect(CreateCloseSlaPolicyRequestSchema.safeParse({ ...policy, responseTimeMs }).success).toBe(false);
    },
  );

  it("rejects response deadlines after resolution and repeated escalation references", () => {
    expect(CreateCloseSlaPolicyRequestSchema.safeParse({ ...policy, responseTimeMs: 4_000_000 }).success).toBe(false);
    expect(CreateCloseSlaPolicyRequestSchema.safeParse({ ...policy, escalationRuleIds: ["rule-a", "rule-a"] }).success).toBe(false);
  });

  it("requires a concurrency version when revising a policy", () => {
    expect(ReviseCloseSlaPolicyRequestSchema.safeParse(policy).success).toBe(false);
    expect(ReviseCloseSlaPolicyRequestSchema.parse({ ...policy, expectedVersion: 3 }).expectedVersion).toBe(3);
  });

  it("requires an exact version when retiring a policy", () => {
    expect(RetireCloseSlaPolicyRequestSchema.safeParse({}).success).toBe(false);
    expect(RetireCloseSlaPolicyRequestSchema.parse({ expectedVersion: 3 })).toEqual({ expectedVersion: 3 });
    expect(RetireCloseSlaPolicyRequestSchema.safeParse({ expectedVersion: 3, tenantId: "tenant-b" }).success).toBe(false);
  });

  it("assigns an immutable policy version without accepting client deadline overrides", () => {
    const body = { ...assignment, mode: "POLICY", policyVersionId: "version-a" };
    expect(AssignCloseTaskSlaRequestSchema.safeParse(body).success).toBe(true);
    expect(AssignCloseTaskSlaRequestSchema.safeParse({ ...body, deadlineAt: "2026-09-10T00:00:00Z" }).success).toBe(false);
    expect(AssignCloseTaskSlaRequestSchema.safeParse({ ...body, tenantId: "other-tenant" }).success).toBe(false);
  });

  it("compares manual deadlines by instant across timezone offsets", () => {
    const body = { ...assignment, mode: "MANUAL", priority: "HIGH", deadlineAt: "2026-09-09T04:30:00Z" };
    expect(AssignCloseTaskSlaRequestSchema.safeParse(body).success).toBe(true);
    expect(AssignCloseTaskSlaRequestSchema.safeParse({ ...body, deadlineAt: "2026-09-09T03:30:00Z" }).success).toBe(false);
    expect(AssignCloseTaskSlaRequestSchema.safeParse({ ...body, responseDeadlineAt: "2026-09-09T05:00:00Z" }).success).toBe(false);
    expect(AssignCloseTaskSlaRequestSchema.safeParse({ ...body, startedAt: "2026-09-09T09:00:00" }).success).toBe(false);
  });

  it("retains legacy policy-shaped input without guessing a task or discarding escalation data", () => {
    const legacy = {
      name: "Review", taskType: "APPROVAL", responseTimeHours: 1, resolutionTimeHours: 24,
      escalationRules: { legacyRule: "requires explicit migration" },
    };
    expect(LegacyCreateCloseSlaPolicyRequestSchema.parse(legacy)).toEqual(legacy);
  });

  it("bounds policy-list pagination and accepts only declared filters", () => {
    expect(CloseSlaPolicyListQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(CloseSlaPolicyListQuerySchema.parse({ page: "2", limit: "100", status: "ACTIVE" }))
      .toEqual({ page: 2, limit: 100, status: "ACTIVE" });
    expect(CloseSlaPolicyListQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
    expect(CloseSlaPolicyListQuerySchema.safeParse({ unknown: "value" }).success).toBe(false);
  });
});
