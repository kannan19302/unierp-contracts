import { describe, expect, it } from "vitest";
import { ChangeTaxJurisdictionRateRequestSchema, ComputeTaxReconciliationRequestSchema, CreateAmendedTaxFilingRequestSchema, CreateWithholdingCertificateRequestSchema } from "./http/finance.js";

describe("Finance advanced tax operation contracts", () => {
  it("accepts effective-dated rates only within percentage bounds", () => {
    expect(ChangeTaxJurisdictionRateRequestSchema.safeParse({ rate: 7.25, effectiveFrom: "2027-01-01" }).success).toBe(true);
    expect(ChangeTaxJurisdictionRateRequestSchema.safeParse({ rate: 101, effectiveFrom: "2027-01-01" }).success).toBe(false);
  });
  it("rejects reversed reconciliation periods", () => {
    expect(ComputeTaxReconciliationRequestSchema.safeParse({ periodStart: "2027-02-01", periodEnd: "2027-01-01", taxType: "VAT" }).success).toBe(false);
  });
  it("rejects withholding greater than gross amount", () => {
    expect(CreateWithholdingCertificateRequestSchema.safeParse({ vendorId: "v1", year: 2027, grossAmount: 100, taxWithheld: 101 }).success).toBe(false);
  });
  it("rejects an amendment that simultaneously claims a refund and additional tax", () => {
    expect(CreateAmendedTaxFilingRequestSchema.safeParse({ originalFilingId: "f1", amendedReason: "Correction", refundAmount: 1, additionalTax: 1 }).success).toBe(false);
  });
});
