import { describe, expect, it } from "vitest";
import {
  CreateDeferredTaxScheduleRequestSchema,
  CreateTaxProvisionRunRequestSchema,
  CreateUncertainTaxPositionRequestSchema,
} from "./http/finance.js";

describe("Finance tax provisioning HTTP contracts", () => {
  it("accepts the persisted provision-run shape and rejects string fiscal years", () => {
    expect(CreateTaxProvisionRunRequestSchema.parse({ fiscalYear: 2027, period: "Q1", statutoryRate: 21 }))
      .toMatchObject({ fiscalYear: 2027, period: "Q1" });
    expect(CreateTaxProvisionRunRequestSchema.safeParse({ fiscalYear: "2027", period: "Q1" }).success).toBe(false);
  });

  it("requires the owning run for a deferred-tax schedule", () => {
    const value = { runId: "run-1", accountId: "acct-1", temporaryDifference: -500, taxRate: 21 };
    expect(CreateDeferredTaxScheduleRequestSchema.parse(value)).toEqual(value);
    expect(CreateDeferredTaxScheduleRequestSchema.safeParse({ ...value, runId: undefined }).success).toBe(false);
  });

  it("uses loss probability and the persisted amount-at-risk field", () => {
    const value = {
      runId: "run-1", positionName: "Transfer pricing", jurisdiction: "US",
      description: "Open examination", taxAmountAtRisk: 1000, probabilityOfLoss: 35,
    };
    expect(CreateUncertainTaxPositionRequestSchema.parse(value)).toEqual(value);
    expect(CreateUncertainTaxPositionRequestSchema.safeParse({ ...value, probabilityOfLoss: 101 }).success).toBe(false);
  });
});
