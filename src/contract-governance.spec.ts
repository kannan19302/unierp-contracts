import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateContractChangeGovernance,
  ContractGovernanceReviewMissingError,
  BLAST_RADIUS_GOVERNANCE_POLICY,
} from "../dist/contract-governance.js";
import type { CanonicalEndpointContract } from "../dist/contract-compatibility.js";

describe("Contract Governance Review Requirements (P12-080)", () => {
  const baseEndpoint: CanonicalEndpointContract = {
    operationId: "postAuthTokens",
    method: "POST",
    path: "/v1/auth/tokens",
    responses: [
      { statusCode: 200, description: "OK" },
      { statusCode: 401, description: "Unauthorized" },
    ],
  };

  const baselineContracts: CanonicalEndpointContract[] = [baseEndpoint];

  it("trivial change (no changes) requires no review", () => {
    // Identical baseline and proposed → TIER_1_TRIVIAL
    const res = evaluateContractChangeGovernance(
      baselineContracts,
      [...baselineContracts],
      []
    );

    assert.equal(res.tier, "TIER_1_TRIVIAL");
    assert.equal(res.governancePassed, true);
    assert.deepEqual(res.requiredReviews, BLAST_RADIUS_GOVERNANCE_POLICY["TIER_1_TRIVIAL"]);
  });

  it("compatible extension (new endpoint added) requires api-peer-review", () => {
    const extendedContracts: CanonicalEndpointContract[] = [
      ...baselineContracts,
      {
        operationId: "getAuthTokenInfo",
        method: "GET",
        path: "/v1/auth/tokens/:id",
        responses: [{ statusCode: 200, description: "OK" }],
      },
    ];

    const res = evaluateContractChangeGovernance(baselineContracts, extendedContracts, [
      { approverRole: "api-peer-review", approved: true },
    ]);

    assert.equal(res.tier, "TIER_2_COMPATIBLE_EXT");
    assert.equal(res.governancePassed, true);
  });

  it("compatible extension without peer review throws with missing role", () => {
    const extendedContracts: CanonicalEndpointContract[] = [
      ...baselineContracts,
      {
        operationId: "getAuthTokenInfo",
        method: "GET",
        path: "/v1/auth/tokens/:id",
        responses: [{ statusCode: 200, description: "OK" }],
      },
    ];

    assert.throws(
      () => evaluateContractChangeGovernance(baselineContracts, extendedContracts, []),
      (err) => {
        assert.ok(err instanceof ContractGovernanceReviewMissingError);
        assert.equal(err.tier, "TIER_2_COMPATIBLE_EXT");
        assert.ok(err.missingApprovals.includes("api-peer-review"));
        return true;
      }
    );
  });

  it("breaking change (endpoint removed) requires api-steward + lead-architect and is blocked without them", () => {
    // Remove the only endpoint → BREAKING
    const emptyContracts: CanonicalEndpointContract[] = [];

    assert.throws(
      () => evaluateContractChangeGovernance(baselineContracts, emptyContracts, []),
      (err) => {
        assert.ok(err instanceof ContractGovernanceReviewMissingError);
        assert.equal(err.tier, "TIER_3_BREAKING_MAJOR");
        assert.ok(err.missingApprovals.includes("api-steward"));
        assert.ok(err.missingApprovals.includes("lead-architect"));
        return true;
      }
    );
  });

  it("breaking change passes when all required reviews are present", () => {
    const emptyContracts: CanonicalEndpointContract[] = [];

    const res = evaluateContractChangeGovernance(baselineContracts, emptyContracts, [
      { approverRole: "api-steward", approved: true },
      { approverRole: "lead-architect", approved: true },
    ]);

    assert.equal(res.tier, "TIER_3_BREAKING_MAJOR");
    assert.equal(res.governancePassed, true);
    assert.equal(res.requiredReviews.requiresMigrationGuide, true);
    assert.equal(res.requiredReviews.requiresDeprecationNotice, true);
  });

  it("unapproved reviewer does not count", () => {
    const emptyContracts: CanonicalEndpointContract[] = [];

    // api-steward present but NOT approved; lead-architect absent entirely
    assert.throws(
      () =>
        evaluateContractChangeGovernance(baselineContracts, emptyContracts, [
          { approverRole: "api-steward", approved: false },
        ]),
      (err) => {
        assert.ok(err instanceof ContractGovernanceReviewMissingError);
        assert.equal(err.tier, "TIER_3_BREAKING_MAJOR");
        assert.ok(err.missingApprovals.includes("api-steward"));
        assert.ok(err.missingApprovals.includes("lead-architect"));
        return true;
      }
    );
  });
});
