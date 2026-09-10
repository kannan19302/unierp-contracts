import { describe, it, expect } from "vitest";
import {
  CreateNexusThresholdRequestSchema,
  UpdateNexusThresholdRequestSchema,
  CreateNexusRegistrationRequestSchema,
  UpdateNexusRegistrationRequestSchema,
} from "./http/finance-tax-nexus.js";

describe("Finance Economic Nexus Contracts", () => {
  describe("CreateNexusThresholdRequestSchema", () => {
    it("validates valid state threshold creation", () => {
      const valid = {
        country: "US",
        state: "CA",
        revenueThreshold: 500000,
        transactionThreshold: null,
        measurementPeriod: "TRAILING_12_MONTHS",
        includesExemptSales: false,
        marketplaceFacilitatorLaw: true,
      };
      const result = CreateNexusThresholdRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("accepts supported measurement period aliases", () => {
      const valid = {
        state: "NY",
        revenueThreshold: 500000,
        transactionThreshold: 100,
        measurementPeriod: "PRIOR_CALENDAR_YEAR",
      };
      const result = CreateNexusThresholdRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects negative revenue thresholds", () => {
      const invalid = {
        state: "TX",
        revenueThreshold: -100,
      };
      const result = CreateNexusThresholdRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid state code length", () => {
      const invalid = {
        state: "CAL",
        revenueThreshold: 100000,
      };
      const result = CreateNexusThresholdRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateNexusThresholdRequestSchema", () => {
    it("requires at least one field to update", () => {
      const result = UpdateNexusThresholdRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("accepts partial updates", () => {
      const result = UpdateNexusThresholdRequestSchema.safeParse({
        revenueThreshold: 250000,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("NexusRegistration schemas", () => {
    it("validates registration creation", () => {
      const valid = {
        state: "WA",
        status: "REGISTERED",
        registrationNumber: "WA-TAX-12345",
        filingFrequency: "MONTHLY",
      };
      const result = CreateNexusRegistrationRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("validates registration update with deregistered status", () => {
      const valid = {
        status: "DEREGISTERED",
      };
      const result = UpdateNexusRegistrationRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
