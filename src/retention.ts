/**
 * @file retention.ts
 * @description Canonical retention policies, statutory legal holds, schedule evaluation, and purge primitives.
 * Phase P12-046: Retention primitives.
 */

export type RetentionAction = "ANONYMIZE" | "HARD_DELETE" | "ARCHIVE_COLD" | "RETAIN_LEGAL_HOLD";

export interface RetentionPolicy {
  /** Model / Entity name governed by this policy */
  modelName: string;
  /** Statutory or compliance retention duration in days (e.g. 2555 days for 7-year statutory tax hold) */
  retentionDays: number;
  /** Primary timestamp field used to calculate age (default: createdAt or closedAt) */
  timestampField: string;
  /** Action executed upon policy expiration */
  action: RetentionAction;
  /** Legal or regulatory justification */
  regulatoryBasis: string;
}

export interface LegalHoldRecord {
  id: string;
  tenantId: string;
  modelName: string;
  recordId: string;
  reason: string;
  placedBy: string;
  placedAt: string;
  active: boolean;
  releasedAt?: string;
  releasedBy?: string;
  releaseReason?: string;
}

export interface PurgePlanItem {
  modelName: string;
  recordId: string;
  tenantId: string;
  action: RetentionAction;
  eligibleAt: string;
  hasActiveLegalHold: boolean;
}

export interface PurgeExecutionResult {
  tenantId: string;
  executedAt: string;
  processedCount: number;
  anonymizedCount: number;
  deletedCount: number;
  heldCount: number;
  errors: Array<{ recordId: string; modelName: string; message: string }>;
}

/**
 * Calculates whether a record is eligible for retention action based on policy and active legal holds.
 */
export function evaluateRetentionEligibility(
  recordDate: Date,
  policy: RetentionPolicy,
  now: Date = new Date(),
  hasActiveLegalHold: boolean = false
): { eligible: boolean; action: RetentionAction; reason: string } {
  if (hasActiveLegalHold) {
    return {
      eligible: false,
      action: "RETAIN_LEGAL_HOLD",
      reason: "Active legal hold prevents purge or anonymization",
    };
  }

  const ageInDays = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
  if (ageInDays >= policy.retentionDays) {
    return {
      eligible: true,
      action: policy.action,
      reason: `Record age (${Math.floor(ageInDays)} days) exceeds statutory retention period of ${policy.retentionDays} days`,
    };
  }

  return {
    eligible: false,
    action: "RETAIN_LEGAL_HOLD",
    reason: `Record within retention period (${Math.floor(ageInDays)} / ${policy.retentionDays} days)`,
  };
}
