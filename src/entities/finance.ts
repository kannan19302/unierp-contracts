/**
 * L0 Finance Entity Contracts — Zero dependencies.
 * Canonical domain entity models for General Ledger, Accounts Payable/Receivable,
 * Fixed Assets, Leases, Banking, and Financial Periods.
 */

export interface AccountEntity {
  id: string;
  tenantId: string;
  orgId: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  parentId?: string | null;
  isActive: boolean;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalLineEntity {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  description?: string;
  debit: number;
  credit: number;
  currency: string;
  exchangeRate?: number;
}

export interface JournalEntryEntity {
  id: string;
  tenantId: string;
  orgId: string;
  entryNumber: string;
  postingDate: Date;
  periodId: string;
  description: string;
  status: "DRAFT" | "POSTED" | "VOID";
  sourceDocument?: string;
  lines: JournalLineEntity[];
  totalDebit: number;
  totalCredit: number;
  createdBy: string;
  postedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItemEntity {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  productId?: string;
}

export interface InvoiceEntity {
  id: string;
  tenantId: string;
  orgId: string;
  customerId: string;
  customerName?: string;
  invoiceNumber: string;
  type: "SALE" | "PURCHASE" | "CREDIT_NOTE";
  status: "DRAFT" | "SENT" | "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "VOID";
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  exchangeRate: number;
  notes?: string;
  lineItems: InvoiceLineItemEntity[];
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentEntity {
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  method: "BANK_TRANSFER" | "CREDIT_CARD" | "CHECK" | "ACH" | "CASH";
  reference?: string;
  notes?: string;
  paidAt: Date;
  createdAt: Date;
}

export interface FinancialPeriodEntity {
  id: string;
  tenantId: string;
  orgId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: "OPEN" | "CLOSED" | "LOCKED";
  closedAt?: Date;
  closedBy?: string;
}

export interface FixedAssetEntity {
  id: string;
  tenantId: string;
  assetCode: string;
  name: string;
  category: string;
  purchaseDate: Date;
  purchaseCost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  depreciationMethod: "STRAIGHT_LINE" | "DECLINING_BALANCE" | "MACRS";
  accumulatedDepreciation: number;
  bookValue: number;
  status: "ACTIVE" | "DISPOSED" | "FULLY_DEPRECIATED";
}

export interface FinanceLeaseEntity {
  id: string;
  tenantId: string;
  leaseRef: string;
  description: string;
  startDate: Date;
  endDate: Date;
  leaseType: "OPERATING" | "FINANCE";
  presentValue: number;
  carryingAmount: number;
  interestRate: number;
  status: "ACTIVE" | "TERMINATED" | "EXPIRED";
}

export interface AllocationTargetEntity {
  accountId: string;
  costCenterId?: string;
  departmentId?: string;
  percentage?: number;
  ratioWeight?: number;
}

export interface AllocationRuleEntity {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  allocationType: "STATIC_PCT" | "DYNAMIC_STAT";
  basisType?: "HEADCOUNT" | "SQUARE_FOOTAGE" | "REVENUE" | null;
  sourceAccountId: string;
  targetAllocations: AllocationTargetEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AllocationRunEntity {
  id: string;
  tenantId: string;
  ruleId: string;
  runDate: Date;
  periodStart: Date;
  periodEnd: Date;
  allocatedAmount: number;
  journalId?: string | null;
  status: "DRAFT" | "POSTED";
  createdAt: Date;
}

export interface BudgetScenarioEntity {
  id: string;
  tenantId: string;
  name: string;
  fiscalYear: number;
  description?: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  totalBudgeted: number;
  createdAt: Date;
}

export interface BankStatementTransactionEntity {
  id: string;
  statementId: string;
  date: Date;
  description: string;
  amount: number;
  reference?: string;
  matched: boolean;
}

export interface BankStatementEntity {
  id: string;
  tenantId: string;
  bankAccountId: string;
  format: "MT940" | "CAMT053" | "CSV";
  openingBalance: number;
  closingBalance: number;
  statementDate: Date;
  transactions: BankStatementTransactionEntity[];
  createdAt: Date;
}

export interface TaxJurisdictionEntity {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  country: string;
  stateOrProvince?: string;
  rate: number;
  isActive: boolean;
}

export interface TaxFilingEntity {
  id: string;
  tenantId: string;
  jurisdictionId: string;
  periodStart: Date;
  periodEnd: Date;
  grossRevenue: number;
  taxableRevenue: number;
  taxDue: number;
  taxPaid: number;
  status: "DRAFT" | "FILED" | "PAID";
  filingDate?: Date;
}

export interface FinanceSettingsEntity {
  tenantId: string;
  baseCurrency: string;
  accountingStandard: "GAAP" | "IFRS";
  fiscalYearStartMonth: number; // 1-12
  lockDate?: Date | null;
  autoPostRecurring: boolean;
  requireMakerChecker: boolean;
  priceMatchTolerancePct: number;
  defaultPaymentTermsDays: number;
  updatedAt: Date;
}

