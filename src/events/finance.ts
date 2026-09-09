/**
 * L0 Finance Domain Events.
 */
import type { DomainEvent } from "./index.js";

/** Dependency direction: taskId waits for dependsOnTaskId. IDs are tenant scoped. */
export interface CloseDependencyPayload {
  dependencyId: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: string;
  lagDays: number;
  isCritical: boolean;
}

export interface CloseDependencyCreatedEvent extends DomainEvent<CloseDependencyPayload> {
  eventType: "finance.close.dependency.created";
  version: 1;
}

export interface CloseDependencyDeletedEvent extends DomainEvent<CloseDependencyPayload> {
  eventType: "finance.close.dependency.deleted";
  version: 1;
}

/** Emitted for each immutable policy revision; tenant identity is in the envelope. */
export interface CloseSlaPolicyVersionCreatedEvent extends DomainEvent<{
  policyId: string;
  policyVersionId: string;
  policyVersion: number;
}> {
  eventType: "finance.close.sla.policy.version.created";
  version: 1;
}

/** A retired policy cannot receive revisions or new task assignments. */
export interface CloseSlaPolicyRetiredEvent extends DomainEvent<{
  policyId: string;
  lastVersion: number;
  retiredBy: string;
}> {
  eventType: "finance.close.sla.policy.retired";
  version: 1;
}

export interface CloseEscalationRuleChangedEvent extends DomainEvent<{
  ruleId: string;
  action: "created" | "updated" | "retired";
  isActive: boolean;
}> {
  eventType: "finance.close.escalation-rule.changed";
  version: 1;
}

export interface CloseAnalyticsSnapshotCapturedEvent extends DomainEvent<{
  snapshotId: string;
  periodId: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  breachedSlas: number;
}> {
  eventType: "finance.close.analytics.snapshot.captured";
  version: 1;
}

/** Applied deadlines are snapshots and must not be recomputed from a later policy revision. */
export interface CloseTaskSlaAssignedEvent extends DomainEvent<{
  taskSlaId: string;
  taskId: string;
  policyVersionId: string | null;
  startedAt: string;
  responseDeadlineAt: string | null;
  deadlineAt: string;
}> {
  eventType: "finance.close.sla.task.assigned";
  version: 1;
}

export interface CloseTaskSlaStatusChangedEvent extends DomainEvent<{
  taskSlaId: string;
  taskId: string;
  previousStatus: string;
  status: string;
  changedBy: string;
}> {
  eventType: "finance.close.sla.task.status.changed";
  version: 1;
}

export interface InvoiceCreatedEvent extends DomainEvent<{
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  totalAmount: number;
  currency: string;
}> {
  eventType: "finance.invoice.created";
}

export interface InvoiceApprovedEvent extends DomainEvent<{
  invoiceId: string;
  amount: number;
  currency: string;
  customerId: string;
}> {
  eventType: "finance.invoice.approved";
}

export interface InvoicePaidEvent extends DomainEvent<{
  invoiceId: string;
  paymentId: string;
  amountPaid: number;
  remainingBalance: number;
  currency: string;
}> {
  eventType: "finance.invoice.paid";
}

export interface JournalPostedEvent extends DomainEvent<{
  journalEntryId: string;
  entryNumber: string;
  periodId: string;
  totalDebit: number;
  totalCredit: number;
  postingDate: string;
}> {
  eventType: "finance.journal.posted";
}

export interface PeriodClosedEvent extends DomainEvent<{
  periodId: string;
  periodName: string;
  closedBy: string;
  closedAt: string;
}> {
  eventType: "finance.period.closed";
}

export interface AssetDepreciatedEvent extends DomainEvent<{
  assetId: string;
  depreciationAmount: number;
  newBookValue: number;
  periodId: string;
}> {
  eventType: "finance.asset.depreciated";
}

export interface AssetDisposedEvent extends DomainEvent<{
  assetId: string;
  assetNumber: string;
  costBasis: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  proceeds: number;
  gainOrLoss: number;
  disposalDate: string;
  journalEntryId?: string;
}> {
  eventType: "finance.asset.disposed";
}

export interface AssetImpairedEvent extends DomainEvent<{
  assetId: string;
  carryingValue: number;
  recoverableAmount: number;
  impairmentLoss: number;
  impairmentDate: string;
  journalEntryId?: string;
}> {
  eventType: "finance.asset.impaired";
}

export interface LeaseRemeasuredEvent extends DomainEvent<{
  leaseId: string;
  leaseNumber: string;
  previousLiability: number;
  remeasuredLiability: number;
  liabilityAdjustment: number;
  previousRouAsset: number;
  remeasuredRouAsset: number;
  effectiveDate: string;
}> {
  eventType: "finance.lease.remeasured";
}

export interface LeaseTerminatedEvent extends DomainEvent<{
  leaseId: string;
  terminationDate: string;
  derecognizedLiability: number;
  derecognizedRouAsset: number;
  terminationGainOrLoss: number;
}> {
  eventType: "finance.lease.terminated";
}

export interface SoxViolationDetectedEvent extends DomainEvent<{
  violationId: string;
  violationType: "TOXIC_ROLE_CONFLICT" | "MAKER_CHECKER_INVARIANT";
  ruleCode: string;
  actorUserId: string;
  entityType: string;
  entityId: string;
  severity: "HIGH" | "CRITICAL";
  detectedAt: string;
}> {
  eventType: "finance.compliance.sox_violation";
}

export interface BankStatementParsedEvent extends DomainEvent<{
  statementId: string;
  bankAccountId: string;
  format: "MT940" | "CAMT053";
  openingBalance: number;
  closingBalance: number;
  transactionCount: number;
  statementDate: string;
}> {
  eventType: "finance.bank_statement.parsed";
}
