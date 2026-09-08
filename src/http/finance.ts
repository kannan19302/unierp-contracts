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

// ─── Strata v2 Finance Workflows & Interactive Actions ───────────────────────

export const MonthEndCloseTaskToggleSchema = z.object({
  taskId: z.string().min(1),
  completed: z.boolean(),
  notes: z.string().optional(),
});
export type MonthEndCloseTaskToggle = z.infer<typeof MonthEndCloseTaskToggleSchema>;

export const ArInvoiceFollowUpSchema = z.object({
  invoiceId: z.string().min(1),
  promisedPaymentDate: z.string().optional(),
  notes: z.string().min(1),
  action: z.enum(["RECORD_PROMISE", "SEND_REMINDER", "ESCALATE_COLLECTION"]).default("RECORD_PROMISE"),
});
export type ArInvoiceFollowUp = z.infer<typeof ArInvoiceFollowUpSchema>;

export const ApResolveVarianceSchema = z.object({
  billId: z.string().min(1),
  varianceAmount: z.number(),
  resolutionType: z.enum(["PRICE_VARIANCE_ACCRUAL", "QUANTITY_SHORTAGE_CREDIT", "APPROVE_UNDER_TOLERANCE"]),
  approvalNotes: z.string().min(1),
});
export type ApResolveVariance = z.infer<typeof ApResolveVarianceSchema>;

export const BankStatementImportSchema = z.object({
  bankAccountId: z.string().min(1),
  format: z.enum(["OFX", "QIF", "CSV", "CAMT053"]).default("OFX"),
  statementDate: z.string(),
  filename: z.string().min(1),
  transactionsCount: z.number().int().nonnegative().optional(),
});
export type BankStatementImport = z.infer<typeof BankStatementImportSchema>;

export const AssetRegistrationSchema = z.object({
  assetNumber: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  location: z.string().min(1),
  acquisitionDate: z.string(),
  cost: z.number().positive(),
  salvageValue: z.number().nonnegative().default(0),
  usefulLifeMonths: z.number().int().positive().default(60),
  depreciationMethod: z.enum(["STRAIGHT_LINE", "DECLINING_BALANCE", "SUM_OF_YEARS_DIGITS"]).default("STRAIGHT_LINE"),
});
export type AssetRegistration = z.infer<typeof AssetRegistrationSchema>;

export const AssetDepreciationRunSchema = z.object({
  period: z.string().min(1), // e.g. "2026-08"
  assetIds: z.array(z.string()).optional(), // if omitted, runs for all active assets
  confirmPosting: z.boolean().default(true),
});
export type AssetDepreciationRun = z.infer<typeof AssetDepreciationRunSchema>;

export const TaxFilingSubmitSchema = z.object({
  filingId: z.string().min(1),
  jurisdiction: z.string().min(1),
  period: z.string().min(1),
  taxAmount: z.number(),
  confirmationCode: z.string().optional(),
});
export type TaxFilingSubmit = z.infer<typeof TaxFilingSubmitSchema>;

export const BudgetDriverUpdateSchema = z.object({
  scenario: z.enum(["BASE", "GROWTH", "DOWNSIDE"]).default("BASE"),
  revenueGrowthPct: z.number().min(-100).max(500),
  headcountGrowthPct: z.number().min(-100).max(500),
  unitCostInflationPct: z.number().min(-100).max(500),
  comments: z.string().optional(),
});
export type BudgetDriverUpdate = z.infer<typeof BudgetDriverUpdateSchema>;

export const FinancialReportExportSchema = z.object({
  reportType: z.enum(["PROFIT_LOSS", "BALANCE_SHEET", "CASH_FLOW", "TRIAL_BALANCE"]),
  period: z.string().min(1),
  format: z.enum(["PDF", "XLSX", "CSV", "JSON"]).default("PDF"),
  comparisonPeriod: z.string().optional(),
});
export type FinancialReportExport = z.infer<typeof FinancialReportExportSchema>;

export const PostGlJournalSchema = z.object({
  entryNumber: z.string().min(1),
  notes: z.string().optional(),
});
export type PostGlJournal = z.infer<typeof PostGlJournalSchema>;

export const RecordArPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.string().default("ACH"),
  reference: z.string().optional(),
  paymentDate: z.string().optional(),
});
export type RecordArPayment = z.infer<typeof RecordArPaymentSchema>;

export const PayApBillSchema = z.object({
  billId: z.string().min(1),
  paymentMethod: z.string().default("ACH_CREDIT"),
  scheduledDate: z.string().optional(),
});
export type PayApBill = z.infer<typeof PayApBillSchema>;

export const ReconcileBankTransactionSchema = z.object({
  transactionId: z.string().min(1),
  matchedRecordId: z.string().optional(),
  reconciliationNotes: z.string().optional(),
});
export type ReconcileBankTransaction = z.infer<typeof ReconcileBankTransactionSchema>;

export const UpdateTaxStatusSchema = z.object({
  returnId: z.string().min(1),
  targetStatus: z.enum(["DRAFT", "VALIDATED", "READY_FOR_APPROVAL", "APPROVED", "FILED"]),
  notes: z.string().optional(),
});
export type UpdateTaxStatus = z.infer<typeof UpdateTaxStatusSchema>;

export const RunFxRevaluationSchema = z.object({
  period: z.string().min(1),
  autoReverse: z.boolean().default(true),
  rates: z.record(z.string(), z.number()).optional(),
});
export type RunFxRevaluation = z.infer<typeof RunFxRevaluationSchema>;

export const RunIntercompanyEliminationsSchema = z.object({
  period: z.string().optional(),
  ruleType: z.string().optional(),
});
export type RunIntercompanyEliminations = z.infer<typeof RunIntercompanyEliminationsSchema>;

export const ReverseGlJournalSchema = z.object({
  entryNumber: z.string().min(1),
  reversalDate: z.string().optional(),
  reason: z.string().min(1),
});
export type ReverseGlJournal = z.infer<typeof ReverseGlJournalSchema>;

export const CreateManualJournalEntrySchema = z.object({
  entryNumber: z.string().optional(),
  date: z.string(),
  reference: z.string().optional(),
  description: z.string().min(1),
  journalType: z.enum(["STANDARD", "ADJUSTING", "CLOSING", "REVERSING"]).default("STANDARD"),
  currency: z.string().default("USD"),
  lines: z
    .array(
      z.object({
        accountId: z.string().optional(),
        accountCode: z.string().min(1),
        accountName: z.string().min(1),
        description: z.string().optional(),
        debit: z.number().nonnegative().default(0),
        credit: z.number().nonnegative().default(0),
      }),
    )
    .min(2),
});
export type CreateManualJournalEntry = z.infer<typeof CreateManualJournalEntrySchema>;
