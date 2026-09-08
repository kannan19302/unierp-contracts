/**
 * L0 Finance HTTP Contracts — Zod schemas & DTOs for Finance endpoints.
 */
import { z } from "zod";

// ─── Accounts & Chart of Accounts ──────────────────────────────────────────
export const CreateAccountRequestSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  parentId: z.string().optional().nullable(),
  currency: z.string().default("USD"),
});

export type CreateAccountRequest = z.infer<typeof CreateAccountRequestSchema>;

// ─── Journal Entries ───────────────────────────────────────────────────────
export const JournalLineInputSchema = z.object({
  accountId: z.string().min(1),
  description: z.string().optional(),
  debit: z.number().nonnegative().default(0),
  credit: z.number().nonnegative().default(0),
  currency: z.string().default("USD"),
  exchangeRate: z.number().positive().default(1),
});

export const CreateJournalEntryRequestSchema = z.object({
  postingDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  periodId: z.string().min(1),
  description: z.string().min(1).max(500),
  sourceDocument: z.string().optional(),
  lines: z.array(JournalLineInputSchema).min(2),
});

export type CreateJournalEntryRequest = z.infer<typeof CreateJournalEntryRequestSchema>;

// ─── Invoices ──────────────────────────────────────────────────────────────
export const InvoiceLineItemInputSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  taxRate: z.number().min(0).max(100).default(0),
  productId: z.string().optional().nullable(),
});

export const CreateInvoiceRequestSchema = z.object({
  customerId: z.string().min(1),
  issueDate: z.string().optional(),
  dueDate: z.string().min(1),
  currency: z.string().default("USD"),
  exchangeRate: z.number().positive().default(1),
  notes: z.string().optional(),
  lineItems: z.array(InvoiceLineItemInputSchema).min(1),
});

export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceRequestSchema>;

// ─── Payments ──────────────────────────────────────────────────────────────
export const ProcessPaymentRequestSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  method: z.enum(["BANK_TRANSFER", "CREDIT_CARD", "CHECK", "ACH", "CASH"]).default("BANK_TRANSFER"),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().optional(),
});

export type ProcessPaymentRequest = z.infer<typeof ProcessPaymentRequestSchema>;

// ─── 3-Way Match ───────────────────────────────────────────────────────────
export const ThreeWayMatchRequestSchema = z.object({
  purchaseOrderId: z.string().min(1),
  goodsReceiptId: z.string().min(1),
  vendorInvoiceId: z.string().min(1),
  priceTolerancePct: z.number().min(0).max(100).default(2),
  quantityTolerancePct: z.number().min(0).max(100).default(0),
});

export type ThreeWayMatchRequest = z.infer<typeof ThreeWayMatchRequestSchema>;

// ─── Bank Reconciliation Match ─────────────────────────────────────────────
export const BankReconciliationMatchRequestSchema = z.object({
  bankTransactionId: z.string().min(1),
  ledgerTransactionId: z.string().min(1),
  ruleId: z.string().optional(),
  notes: z.string().optional(),
});

export type BankReconciliationMatchRequest = z.infer<typeof BankReconciliationMatchRequestSchema>;

// ─── Financial Period Close ────────────────────────────────────────────────
export const ClosePeriodRequestSchema = z.object({
  periodId: z.string().min(1),
  notes: z.string().optional(),
  checklistAcknowledged: z.boolean().refine((val) => val === true, {
    message: "All closing checklist steps must be acknowledged before closing.",
  }),
});

export type ClosePeriodRequest = z.infer<typeof ClosePeriodRequestSchema>;

// ─── Financial Reports Query Schemas ────────────────────────────────────────
export const GetBalanceSheetQuerySchema = z.object({
  asOfDate: z.string().optional(),
  bookId: z.string().optional(),
});

export type GetBalanceSheetQuery = z.infer<typeof GetBalanceSheetQuerySchema>;

export const GetProfitLossQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  bookId: z.string().optional(),
});

export type GetProfitLossQuery = z.infer<typeof GetProfitLossQuerySchema>;

export const GetCashFlowQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  bookId: z.string().optional(),
});

export type GetCashFlowQuery = z.infer<typeof GetCashFlowQuerySchema>;

// ─── Dynamic Allocations ────────────────────────────────────────────────────
export const AllocationTargetInputSchema = z.object({
  accountId: z.string().min(1),
  costCenterId: z.string().optional(),
  departmentId: z.string().optional(),
  percentage: z.number().min(0).max(100).optional(),
  ratioWeight: z.number().positive().optional(),
});

export const CreateAllocationRuleRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  allocationType: z.enum(["STATIC_PCT", "DYNAMIC_STAT"]),
  basisType: z.enum(["HEADCOUNT", "SQUARE_FOOTAGE", "REVENUE"]).optional(),
  sourceAccountId: z.string().min(1),
  targetAllocations: z.array(AllocationTargetInputSchema).min(1),
});

export type CreateAllocationRuleRequest = z.infer<typeof CreateAllocationRuleRequestSchema>;

export const ExecuteAllocationRunRequestSchema = z.object({
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
});

export type ExecuteAllocationRunRequest = z.infer<typeof ExecuteAllocationRunRequestSchema>;

// ─── Finance Settings ───────────────────────────────────────────────────────
export const UpdateFinanceSettingsRequestSchema = z.object({
  baseCurrency: z.string().length(3).optional(),
  accountingStandard: z.enum(["GAAP", "IFRS"]).optional(),
  fiscalYearStartMonth: z.number().min(1).max(12).optional(),
  lockDate: z.string().nullable().optional(),
  autoPostRecurring: z.boolean().optional(),
  requireMakerChecker: z.boolean().optional(),
  priceMatchTolerancePct: z.number().min(0).max(100).optional(),
  defaultPaymentTermsDays: z.number().min(0).max(365).optional(),
});

export type UpdateFinanceSettingsRequest = z.infer<typeof UpdateFinanceSettingsRequestSchema>;

