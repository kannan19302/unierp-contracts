import { z } from "zod";

const id = z.string().trim().min(1).max(255);
const amount = z.number().finite();
const rate = z.number().finite().min(0).max(100);

export const CreateTaxProvisionRunRequestSchema = z.object({
  fiscalYear: z.number().int().min(1900).max(9999),
  period: id,
  pretaxIncome: amount.optional(),
  statutoryRate: rate.optional(),
}).strict();

export const UpdateTaxProvisionRunRequestSchema = z.object({
  pretaxIncome: amount.optional(),
  statutoryRate: rate.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const CreateTaxProvisionDetailRequestSchema = z.object({
  runId: id,
  jurisdiction: id,
  taxableIncome: amount,
  taxRate: rate,
  credits: amount.nonnegative().optional(),
  payments: amount.nonnegative().optional(),
  withholding: amount.nonnegative().optional(),
  temporaryDifferences: z.record(z.string(), z.unknown()).optional(),
  filingStatus: z.enum(["ESTIMATED", "FILED", "AMENDED"]).optional(),
}).strict();

export const UpdateTaxProvisionDetailRequestSchema = CreateTaxProvisionDetailRequestSchema
  .omit({ runId: true, jurisdiction: true }).partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const CreateDeferredTaxScheduleRequestSchema = z.object({
  runId: id,
  accountId: id,
  temporaryDifference: amount,
  taxRate: rate,
  reversalYear: z.number().int().min(1900).max(9999).optional(),
  reversalType: id.optional(),
  categorization: id.optional(),
}).strict();

export const UpdateDeferredTaxScheduleRequestSchema = CreateDeferredTaxScheduleRequestSchema
  .omit({ runId: true, accountId: true }).partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const CreateUncertainTaxPositionRequestSchema = z.object({
  runId: id,
  positionName: id,
  jurisdiction: id,
  description: z.string().trim().min(1).max(4000),
  taxAmountAtRisk: amount.nonnegative(),
  probabilityOfLoss: rate,
}).strict();

export const UpdateUncertainTaxPositionRequestSchema = CreateUncertainTaxPositionRequestSchema
  .omit({ runId: true }).partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const EvaluateUncertainTaxPositionRequestSchema = z.object({ probabilityOfLoss: rate }).strict();
export const ReserveUncertainTaxPositionRequestSchema = z.object({ reserveAmount: amount.nonnegative() }).strict();
export const SettleUncertainTaxPositionRequestSchema = z.object({ settlementAmount: amount.nonnegative() }).strict();

export const CreateValuationAllowanceRequestSchema = z.object({
  runId: id,
  jurisdiction: id,
  deferredTaxAssetId: id.optional(),
  allowanceAmount: amount.nonnegative(),
  assessmentType: id,
  positiveEvidence: z.record(z.string(), z.unknown()).optional(),
  negativeEvidence: z.record(z.string(), z.unknown()).optional(),
  conclusion: z.string().trim().max(4000).optional(),
}).strict();

export const UpdateValuationAllowanceRequestSchema = CreateValuationAllowanceRequestSchema
  .omit({ runId: true, jurisdiction: true }).partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const ComputeEffectiveRateReconciliationRequestSchema = z.object({ runId: id }).strict();

export type CreateTaxProvisionRunRequest = z.infer<typeof CreateTaxProvisionRunRequestSchema>;
export type UpdateTaxProvisionRunRequest = z.infer<typeof UpdateTaxProvisionRunRequestSchema>;
export type CreateTaxProvisionDetailRequest = z.infer<typeof CreateTaxProvisionDetailRequestSchema>;
export type CreateDeferredTaxScheduleRequest = z.infer<typeof CreateDeferredTaxScheduleRequestSchema>;
export type CreateUncertainTaxPositionRequest = z.infer<typeof CreateUncertainTaxPositionRequestSchema>;
export type CreateValuationAllowanceRequest = z.infer<typeof CreateValuationAllowanceRequestSchema>;
