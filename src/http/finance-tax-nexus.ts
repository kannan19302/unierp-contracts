import { z } from "zod";

export const NexusMeasurementPeriodSchema = z.enum([
  "TRAILING_12_MONTHS",
  "CALENDAR_YEAR",
  "PRIOR_CALENDAR_YEAR",
  "PREVIOUS_12_MONTHS",
  "CURRENT_CALENDAR_YEAR",
]);

export const NexusRegistrationStatusSchema = z.enum([
  "NOT_REGISTERED",
  "PENDING",
  "REGISTERED",
  "DEREGISTERED",
]);

export const CreateNexusThresholdRequestSchema = z
  .object({
    country: z.string().trim().min(1).max(10).default("US").optional(),
    state: z.string().trim().min(2).max(2).toUpperCase(),
    revenueThreshold: z.number().finite().min(0),
    transactionThreshold: z.number().int().min(0).optional().nullable(),
    measurementPeriod: NexusMeasurementPeriodSchema.optional(),
    includesExemptSales: z.boolean().optional(),
    marketplaceFacilitatorLaw: z.boolean().optional(),
    sourceUrl: z.string().max(1000).optional(),
    notes: z.string().max(4000).optional(),
  })
  .strict();

export const UpdateNexusThresholdRequestSchema = z
  .object({
    revenueThreshold: z.number().finite().min(0).optional(),
    transactionThreshold: z.number().int().min(0).optional().nullable(),
    measurementPeriod: NexusMeasurementPeriodSchema.optional(),
    includesExemptSales: z.boolean().optional(),
    marketplaceFacilitatorLaw: z.boolean().optional(),
    sourceUrl: z.string().max(1000).optional(),
    notes: z.string().max(4000).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required");

export const CreateNexusRegistrationRequestSchema = z
  .object({
    country: z.string().trim().min(1).max(10).default("US").optional(),
    state: z.string().trim().min(2).max(2).toUpperCase(),
    status: NexusRegistrationStatusSchema.optional(),
    registrationNumber: z.string().trim().max(100).optional(),
    registeredAt: z.string().optional(),
    effectiveDate: z.string().optional(),
    filingFrequency: z.string().trim().max(50).optional(),
    notes: z.string().max(4000).optional(),
  })
  .strict();

export const UpdateNexusRegistrationRequestSchema = z
  .object({
    status: NexusRegistrationStatusSchema.optional(),
    registrationNumber: z.string().trim().max(100).optional(),
    registeredAt: z.string().optional(),
    effectiveDate: z.string().optional(),
    filingFrequency: z.string().trim().max(50).optional(),
    nextFilingDueDate: z.string().optional(),
    notes: z.string().max(4000).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required");

export type CreateNexusThresholdRequest = z.infer<
  typeof CreateNexusThresholdRequestSchema
>;
export type UpdateNexusThresholdRequest = z.infer<
  typeof UpdateNexusThresholdRequestSchema
>;
export type CreateNexusRegistrationRequest = z.infer<
  typeof CreateNexusRegistrationRequestSchema
>;
export type UpdateNexusRegistrationRequest = z.infer<
  typeof UpdateNexusRegistrationRequestSchema
>;
