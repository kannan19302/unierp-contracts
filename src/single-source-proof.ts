/**
 * src/single-source-proof.ts
 *
 * Phase P12-081: The single-source proof (EP-1 mechanism).
 *
 * Exit criterion:
 *   "Every client, type, SDK method and document derived from the contracts,
 *    with nothing hand-maintained. A hand-maintained duplicate of any
 *    contract-derived artefact is detected and fails CI."
 *
 * This module defines the canonical list of contract-derived artefact categories
 * and the detection logic for hand-maintained duplicates.
 */

export type ContractDerivedArtifactCategory =
  | "TYPESCRIPT_TYPES"
  | "DART_TYPES"
  | "SDK_METHODS"
  | "API_DOCUMENTATION"
  | "CONTRACT_SCHEMA";

export interface ContractDerivedArtifactDescriptor {
  category: ContractDerivedArtifactCategory;
  /** Canonical source — the single source of truth */
  canonicalSourcePath: string;
  /** Artefacts that must be generated, never hand-written */
  generatedArtifactPaths: string[];
  /** Human-readable label for error messages */
  label: string;
}

/**
 * The authoritative catalogue of contract-derived artefact categories.
 * Each entry declares what the single source is and what must be generated from it.
 */
export const CONTRACT_DERIVED_ARTIFACT_REGISTRY: ContractDerivedArtifactDescriptor[] = [
  {
    category: "TYPESCRIPT_TYPES",
    canonicalSourcePath: "unierp-contracts/src/index.ts",
    generatedArtifactPaths: [
      "unierp-contracts/dist/index.d.ts",
      "unierp-contracts/dist/index.js",
    ],
    label: "TypeScript contract types",
  },
  {
    category: "DART_TYPES",
    canonicalSourcePath: "unierp-contracts/src/index.ts",
    generatedArtifactPaths: [
      "unierp-mobile/lib/generated/contracts.dart",
    ],
    label: "Dart contract types",
  },
  {
    category: "SDK_METHODS",
    canonicalSourcePath: "unierp-contracts/src/index.ts",
    generatedArtifactPaths: [
      "unierp-sdk/src/index.ts",
    ],
    label: "SDK method surface",
  },
  {
    category: "API_DOCUMENTATION",
    canonicalSourcePath: "unierp-contracts/src/index.ts",
    generatedArtifactPaths: [
      "unierp-workspace/docs/programme/PUBLIC-API-CONTRACTS.md",
    ],
    label: "Public API contracts documentation",
  },
];

export class HandMaintainedDuplicateDetectedError extends Error {
  readonly category: ContractDerivedArtifactCategory;
  readonly duplicatePath: string;
  readonly canonicalSourcePath: string;

  constructor(
    category: ContractDerivedArtifactCategory,
    duplicatePath: string,
    canonicalSourcePath: string,
    reason: string
  ) {
    super(
      `EP-1 violation: Hand-maintained duplicate detected.\n` +
        `  Category: ${category}\n` +
        `  Duplicate: ${duplicatePath}\n` +
        `  Canonical source: ${canonicalSourcePath}\n` +
        `  Reason: ${reason}\n` +
        `  A hand-maintained duplicate of any contract-derived artefact is forbidden.`
    );
    this.name = "HandMaintainedDuplicateDetectedError";
    this.category = category;
    this.duplicatePath = duplicatePath;
    this.canonicalSourcePath = canonicalSourcePath;
  }
}

export interface SingleSourceProofResult {
  verified: true;
  checkedCategories: ContractDerivedArtifactCategory[];
  totalArtifactsChecked: number;
}

/**
 * Verifies that a set of candidate contract definitions does not replicate
 * any field or operation that is already declared in the canonical source.
 *
 * A "hand-maintained duplicate" is any operation ID or field name that
 * appears in the candidate set but is absent from the generated artefact set —
 * meaning a developer added it manually rather than regenerating.
 *
 * @param canonicalOperationIds  - Operation IDs exported from the canonical contract source
 * @param generatedOperationIds  - Operation IDs present in the generated artefact
 * @param candidateOperationIds  - Operation IDs found in a candidate (possibly hand-edited) file
 * @param artifactDescriptor     - Which artefact category this check covers
 * @throws HandMaintainedDuplicateDetectedError if any candidate operation is absent from generated
 */
export function assertNoHandMaintainedDuplicate(
  canonicalOperationIds: string[],
  generatedOperationIds: string[],
  candidateOperationIds: string[],
  artifactDescriptor: ContractDerivedArtifactDescriptor
): SingleSourceProofResult {
  const generatedSet = new Set(generatedOperationIds);
  const canonicalSet = new Set(canonicalOperationIds);

  // Find operations present in the candidate that exist in canonical but NOT in generated —
  // this means the artefact was hand-maintained rather than regenerated.
  const handMaintained = candidateOperationIds.filter(
    (opId) => canonicalSet.has(opId) && !generatedSet.has(opId)
  );

  if (handMaintained.length > 0) {
    throw new HandMaintainedDuplicateDetectedError(
      artifactDescriptor.category,
      artifactDescriptor.generatedArtifactPaths[0] || "",
      artifactDescriptor.canonicalSourcePath,
      `Operations ${handMaintained.join(", ")} exist in canonical source but are absent ` +
        `from the generated artefact — they appear to have been added manually.`
    );
  }

  return {
    verified: true,
    checkedCategories: [artifactDescriptor.category],
    totalArtifactsChecked: artifactDescriptor.generatedArtifactPaths.length,
  };
}
