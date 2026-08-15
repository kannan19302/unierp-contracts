/**
 * src/contract-governance.ts
 *
 * Phase P12-080: Contract governance.
 *
 * Exit criterion:
 *   "Review requirements for contract changes proportionate to their blast radius.
 *    A breaking contract change cannot land without the declared review, proven by test"
 */

import { classifyContractChanges, type CanonicalEndpointContract } from "./contract-compatibility.js";

export type BlastRadiusTier = "TIER_1_TRIVIAL" | "TIER_2_COMPATIBLE_EXT" | "TIER_3_BREAKING_MAJOR";

export interface GovernanceReviewRequirement {
  tier: BlastRadiusTier;
  requiredApprovals: string[]; // e.g. ["api-steward", "lead-architect"]
  requiresMigrationGuide: boolean;
  requiresDeprecationNotice: boolean;
}

export const BLAST_RADIUS_GOVERNANCE_POLICY: Record<BlastRadiusTier, GovernanceReviewRequirement> = {
  TIER_1_TRIVIAL: {
    tier: "TIER_1_TRIVIAL",
    requiredApprovals: [],
    requiresMigrationGuide: false,
    requiresDeprecationNotice: false,
  },
  TIER_2_COMPATIBLE_EXT: {
    tier: "TIER_2_COMPATIBLE_EXT",
    requiredApprovals: ["api-peer-review"],
    requiresMigrationGuide: false,
    requiresDeprecationNotice: false,
  },
  TIER_3_BREAKING_MAJOR: {
    tier: "TIER_3_BREAKING_MAJOR",
    requiredApprovals: ["api-steward", "lead-architect"],
    requiresMigrationGuide: true,
    requiresDeprecationNotice: true,
  },
};

export class ContractGovernanceReviewMissingError extends Error {
  readonly missingApprovals: string[];
  readonly tier: BlastRadiusTier;

  constructor(missingApprovals: string[], tier: BlastRadiusTier) {
    super(
      `Contract change classified as ${tier} requires approval from [${missingApprovals.join(
        ", "
      )}], but review was missing or unapproved.`
    );
    this.name = "ContractGovernanceReviewMissingError";
    this.missingApprovals = missingApprovals;
    this.tier = tier;
  }
}

/**
 * Evaluates governance requirements for a contract change between two sets of endpoints.
 *
 * @param baselineContracts - The current (before) set of endpoint contracts
 * @param proposedContracts - The proposed (after) set of endpoint contracts
 * @param currentReviews    - Reviews already submitted for this change
 * @returns tier, governancePassed flag, and requiredReviews policy
 * @throws ContractGovernanceReviewMissingError if a required review is absent
 */
export function evaluateContractChangeGovernance(
  baselineContracts: CanonicalEndpointContract[],
  proposedContracts: CanonicalEndpointContract[],
  currentReviews: { approverRole: string; approved: boolean }[] = []
): {
  tier: BlastRadiusTier;
  governancePassed: boolean;
  requiredReviews: GovernanceReviewRequirement;
} {
  const diff = classifyContractChanges(baselineContracts, proposedContracts);

  let tier: BlastRadiusTier = "TIER_1_TRIVIAL";
  if (diff.classification === "BREAKING") {
    tier = "TIER_3_BREAKING_MAJOR";
  } else if (diff.compatibleChanges.length > 0) {
    tier = "TIER_2_COMPATIBLE_EXT";
  }

  const policy = BLAST_RADIUS_GOVERNANCE_POLICY[tier];
  const approvedRoles = new Set(
    currentReviews.filter((r) => r.approved).map((r) => r.approverRole)
  );

  const missingApprovals = policy.requiredApprovals.filter(
    (role) => !approvedRoles.has(role)
  );

  if (missingApprovals.length > 0) {
    throw new ContractGovernanceReviewMissingError(missingApprovals, tier);
  }

  return {
    tier,
    governancePassed: true,
    requiredReviews: policy,
  };
}
