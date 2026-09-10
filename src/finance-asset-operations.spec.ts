import { describe, expect, it } from "vitest";
import { BulkDisposeAssetsRequestSchema, BulkUploadAssetsRequestSchema, CreateAssetInsuranceRequestSchema, CreateCapitalProjectRequestSchema } from "./http/finance.js";

describe("Finance asset operation contracts", () => {
  it("rejects insurance renewal before policy start", () => expect(CreateAssetInsuranceRequestSchema.safeParse({ assetId: "a", policyNumber: "p", insurer: "i", coverageType: "PROPERTY", coverageAmount: 1, premium: 1, startDate: "2027-02-01", renewalDate: "2027-01-01" }).success).toBe(false));
  it("rejects project completion before project start", () => expect(CreateCapitalProjectRequestSchema.safeParse({ code: "p", name: "Plant", budgetAmount: 1, startDate: "2027-02-01", expectedCompletion: "2027-01-01" }).success).toBe(false));
  it("requires a purchase value in each uploaded row", () => expect(BulkUploadAssetsRequestSchema.safeParse({ rows: [{ name: "Forklift", purchaseDate: "2027-01-01" }] }).success).toBe(false));
  it("rejects duplicate IDs in bulk disposal", () => expect(BulkDisposeAssetsRequestSchema.safeParse({ assetIds: ["a", "a"], disposalDate: "2027-01-01", disposalType: "RETIREMENT" }).success).toBe(false));
});
