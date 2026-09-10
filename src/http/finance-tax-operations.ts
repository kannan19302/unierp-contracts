import { z } from "zod";

const id = z.string().trim().min(1).max(255);
const date = z.string().date();
const amount = z.number().finite();
const rate = z.number().finite().min(0).max(100);

export const CreateTaxJurisdictionRequestSchema = z.object({ name: id, code: id, country: id, state: id.optional(), county: id.optional(), taxType: id, rate, effectiveFrom: date, effectiveTo: date.optional(), description: z.string().max(4000).optional() }).strict();
export const UpdateTaxJurisdictionRequestSchema = z.object({ name: id.optional(), effectiveTo: date.optional(), isActive: z.boolean().optional(), description: z.string().max(4000).optional() }).strict().refine((v) => Object.keys(v).length > 0, "At least one field is required");
export const ChangeTaxJurisdictionRateRequestSchema = z.object({ rate, effectiveFrom: date }).strict();
export const CreateTaxExemptionCertificateRequestSchema = z.object({ entityType: id, entityId: id, jurisdictionId: id, certificateNumber: id, exemptionType: id, exemptionPct: rate.optional(), validFrom: date, validTo: date.optional(), documentUrl: z.string().url().optional(), notes: z.string().max(4000).optional() }).strict();
export const UpdateTaxExemptionCertificateRequestSchema = z.object({ status: z.enum(["ACTIVE", "EXPIRED", "REVOKED"]).optional(), validTo: date.optional(), documentUrl: z.string().url().optional(), notes: z.string().max(4000).optional() }).strict().refine((v) => Object.keys(v).length > 0, "At least one field is required");
export const ComputeTaxReconciliationRequestSchema = z.object({ periodStart: date, periodEnd: date, taxType: id }).strict().refine((v) => v.periodStart <= v.periodEnd, { message: "Period start must not follow period end", path: ["periodEnd"] });
export const UpdateTaxReconciliationRequestSchema = z.object({ paymentsMade: amount.nonnegative().optional(), status: z.enum(["DRAFT", "RECONCILED", "CLOSED"]).optional(), notes: z.string().max(4000).optional() }).strict().refine((v) => Object.keys(v).length > 0, "At least one field is required");
export const CreateWithholdingCertificateRequestSchema = z.object({ vendorId: id, year: z.number().int().min(1900).max(9999), grossAmount: amount.nonnegative(), taxWithheld: amount.nonnegative(), withholdingTaxId: id.optional(), certificateNumber: id.optional() }).strict().refine((v) => v.taxWithheld <= v.grossAmount, { message: "Tax withheld cannot exceed gross amount", path: ["taxWithheld"] });
export const BulkGenerateWithholdingCertificatesRequestSchema = z.object({ year: z.number().int().min(1900).max(9999) }).strict();
export const CreateAmendedTaxFilingRequestSchema = z.object({ originalFilingId: id, amendedReason: z.string().trim().min(1).max(4000), changes: z.record(z.string(), z.unknown()).optional(), refundAmount: amount.nonnegative().optional(), additionalTax: amount.nonnegative().optional() }).strict().refine((v) => !(v.refundAmount && v.additionalTax), { message: "An amendment cannot claim both a refund and additional tax" });
export const UpdateAmendedTaxFilingStatusRequestSchema = z.object({ status: z.enum(["ACCEPTED", "REJECTED"]) }).strict();

export type CreateTaxJurisdictionRequest = z.infer<typeof CreateTaxJurisdictionRequestSchema>;
export type CreateTaxExemptionCertificateRequest = z.infer<typeof CreateTaxExemptionCertificateRequestSchema>;
export type ComputeTaxReconciliationRequest = z.infer<typeof ComputeTaxReconciliationRequestSchema>;
export type CreateWithholdingCertificateRequest = z.infer<typeof CreateWithholdingCertificateRequestSchema>;
export type CreateAmendedTaxFilingRequest = z.infer<typeof CreateAmendedTaxFilingRequestSchema>;
