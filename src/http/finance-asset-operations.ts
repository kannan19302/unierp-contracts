import { z } from "zod";

const id = z.string().trim().min(1).max(255);
const date = z.string().date();
const money = z.number().finite().nonnegative();
export const CreateAssetInsuranceRequestSchema = z.object({ assetId: id, policyNumber: id, insurer: id, coverageType: id, coverageAmount: money, premium: money, startDate: date, renewalDate: date, documentUrl: z.string().url().optional(), notes: z.string().max(4000).optional() }).strict().refine((v) => v.startDate <= v.renewalDate, { message: "Renewal date must not precede start date", path: ["renewalDate"] });
export const UpdateAssetInsuranceRequestSchema = z.object({ status: id.optional(), renewalDate: date.optional(), premium: money.optional(), notes: z.string().max(4000).optional() }).strict().refine((v) => Object.keys(v).length > 0, "At least one field is required");
export const CreateAssetImpairmentRequestSchema = z.object({ assetId: id, testDate: date, carryingAmount: money, recoverableAmount: money, reason: z.string().max(4000).optional() }).strict();
export const CreateCapitalProjectRequestSchema = z.object({ code: id, name: id, description: z.string().max(4000).optional(), budgetAmount: money, startDate: date, expectedCompletion: date.optional(), costGlAccountId: id.optional() }).strict().refine((v) => !v.expectedCompletion || v.startDate <= v.expectedCompletion, { message: "Expected completion must not precede start date", path: ["expectedCompletion"] });
export const AddCapitalProjectCostRequestSchema = z.object({ costDate: date, description: z.string().max(4000).optional(), costType: id, amount: money, vendorId: id.optional(), invoiceId: id.optional(), glAccountId: id.optional() }).strict();
export const UpdateCapitalProjectRequestSchema = z.object({ status: id.optional(), completedDate: date.optional(), notes: z.string().max(4000).optional() }).strict().refine((v) => Object.keys(v).length > 0, "At least one field is required");
export const ConvertCapitalProjectToAssetRequestSchema = z.object({ assetName: id, categoryId: id, assetDate: date }).strict();
export const BulkUploadAssetRowSchema = z.object({ name: id, categoryId: id.optional(), purchaseDate: date, purchaseCost: money.optional(), purchaseValue: money.optional(), salvageValue: money.optional(), usefulLifeYears: z.number().finite().positive().optional(), locationId: id.optional(), assetCode: id.optional(), depreciationMethod: id.optional(), depreciationRate: z.number().finite().min(0).max(100).optional(), accountId: id.optional(), accumDepAccountId: id.optional(), custodianId: id.optional() }).strict().refine((v) => v.purchaseCost !== undefined || v.purchaseValue !== undefined, "Purchase cost or value is required");
export const BulkUploadAssetsRequestSchema = z.object({ rows: z.array(BulkUploadAssetRowSchema).min(1).max(5000) }).strict();
export const CreateAssetRevaluationRequestSchema = z.object({ assetId: id, revaluationDate: date, revaluedValue: money, notes: z.string().max(4000).optional() }).strict();
export const CreateAssetDisposalRequestSchema = z.object({ assetId: id, disposalDate: date, disposalType: id, salePrice: money.optional(), notes: z.string().max(4000).optional() }).strict();
export const BulkDisposeAssetsRequestSchema = z.object({ assetIds: z.array(id).min(1).max(5000).refine((ids) => new Set(ids).size === ids.length, "Asset IDs must be unique"), disposalDate: date, disposalType: id }).strict();

export type CreateAssetInsuranceRequest = z.infer<typeof CreateAssetInsuranceRequestSchema>;
export type CreateAssetImpairmentRequest = z.infer<typeof CreateAssetImpairmentRequestSchema>;
export type CreateCapitalProjectRequest = z.infer<typeof CreateCapitalProjectRequestSchema>;
export type BulkUploadAssetsRequest = z.infer<typeof BulkUploadAssetsRequestSchema>;
export type CreateAssetRevaluationRequest = z.infer<typeof CreateAssetRevaluationRequestSchema>;
export type CreateAssetDisposalRequest = z.infer<typeof CreateAssetDisposalRequestSchema>;
