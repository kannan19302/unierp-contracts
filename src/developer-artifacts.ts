/**
 * Canonical developer-platform metadata contracts.
 *
 * These contracts are deliberately dependency-free: builders, the API, CLI,
 * compilers and import/export tools must all be able to consume the same L0
 * representation without importing a UI or persistence package.
 */

export const ARTIFACT_ENVELOPE_API_VERSION = "unierp.dev/v1" as const;

export const CANONICAL_ARTIFACT_KINDS = [
  "FORM",
  "ADVANCED_FORM",
  "WORKFLOW",
  "BPMN_PROCESS",
  "DASHBOARD",
  "DASHBOARD_WIDGET",
  "DATA_OBJECT",
  "RULE_SET",
  "API_ENDPOINT",
  "SAVED_QUERY",
  "SCRIPT",
  "MOBILE_APP",
  "ETL_PIPELINE",
  "THEME",
  "PAGE",
  "PAGE_SECTION",
  "COMPONENT",
  "COLLECTION",
  "BLOG_POST",
  "MENU",
  "ASSET",
  "SEO_PROFILE",
  "AB_TEST",
  "TEST_SUITE",
  "CONNECTOR_DEFINITION",
  "DATA_MIGRATION",
  "POLICY",
  "SECRET_REFERENCE",
] as const;

export type CanonicalArtifactKind = (typeof CANONICAL_ARTIFACT_KINDS)[number];
export type ArtifactOwnerScope = "PROJECT" | "LIBRARY" | "MANAGE";
export type ProjectKind = "APP" | "SITE";
export type ArtifactRuntimeClass =
  | "TRUSTED_METADATA"
  | "BROWSER"
  | "SANDBOX"
  | "ISOLATED_WORKER";
export type PackageEditability = "MANAGED" | "UNLOCKED" | "INTERNAL";
export type InstallationMode = "LINKED" | "PINNED" | "FORKED" | "EMBEDDED";

export interface ArtifactMetadataV1 {
  /** Stable opaque identity. Names and slugs are mutable attributes. */
  id: string;
  namespace: string;
  name: string;
  description?: string;
  labels?: Record<string, string>;
}

export interface ArtifactInterfaceFieldV1 {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

export interface ArtifactInterfacesV1 {
  inputs: ArtifactInterfaceFieldV1[];
  outputs: ArtifactInterfaceFieldV1[];
  events: Array<{ name: string; schemaRef: string; direction: "PUBLISH" | "SUBSCRIBE" }>;
}

export interface ArtifactDependencyV1 {
  alias: string;
  kind: CanonicalArtifactKind;
  /** Stable interface or package coordinate, never a project-local database id. */
  target: string;
  versionRange: string;
  optional?: boolean;
}

export interface ArtifactCapabilityV1 {
  capability: string;
  access: "READ" | "WRITE" | "EXECUTE" | "ADMIN";
  resource?: string;
  reason: string;
}

export interface ArtifactTestReferenceV1 {
  id: string;
  kind: "UNIT" | "COMPONENT" | "CONTRACT" | "INTEGRATION" | "SECURITY" | "E2E";
  required: boolean;
}

export interface ArtifactEnvelopeV1<TSpec = Record<string, unknown>> {
  apiVersion: typeof ARTIFACT_ENVELOPE_API_VERSION;
  kind: CanonicalArtifactKind;
  metadata: ArtifactMetadataV1;
  spec: TSpec;
  interfaces: ArtifactInterfacesV1;
  dependencies: ArtifactDependencyV1[];
  capabilities: ArtifactCapabilityV1[];
  tests: ArtifactTestReferenceV1[];
  /** Vendor/builder extension fields must survive every read/write round trip. */
  extensions: Record<string, unknown>;
}

export interface FormSpecV1 {
  title: string;
  pages: Array<{
    id: string;
    title?: string;
    fields: Array<{
      id: string;
      name: string;
      type: string;
      label: string;
      required?: boolean;
      binding?: { dependencyAlias: string; field: string };
      configuration?: Record<string, unknown>;
    }>;
  }>;
  submit?: { action: string; dependencyAlias?: string };
}

export interface WorkflowSpecV1 {
  trigger: { type: string; eventSchemaRef?: string; configuration?: Record<string, unknown> };
  nodes: Array<{ id: string; type: string; configuration: Record<string, unknown> }>;
  edges: Array<{ id: string; source: string; target: string; condition?: string }>;
}

export interface PageSectionSpecV1 {
  component: string;
  props: Record<string, unknown>;
  bindings?: Array<{ prop: string; dependencyAlias: string; path: string }>;
  children?: PageSectionSpecV1[];
}

export interface PageSpecV1 {
  title: string;
  slug: string;
  sections: PageSectionSpecV1[];
  seo?: Record<string, unknown>;
}

export type PilotArtifactEnvelopeV1 =
  | (ArtifactEnvelopeV1<FormSpecV1> & { kind: "FORM" })
  | (ArtifactEnvelopeV1<WorkflowSpecV1> & { kind: "WORKFLOW" })
  | (ArtifactEnvelopeV1<PageSpecV1> & { kind: "PAGE" })
  | (ArtifactEnvelopeV1<PageSectionSpecV1> & { kind: "PAGE_SECTION" });

export interface ArtifactPortabilityRuleV1 {
  kind: CanonicalArtifactKind;
  ownerScopes: ArtifactOwnerScope[];
  consumerProjectKinds: ProjectKind[];
  portability: "PORTABLE" | "PROJECT_ONLY" | "CONDITIONAL";
  installationModes: InstallationMode[];
  runtimeClass: ArtifactRuntimeClass;
  packageEligible: boolean;
  mayContainSecretMaterial: false;
  requiredConformance: string[];
}

export interface ReleaseManifestV1 {
  apiVersion: "unierp.release/v1";
  releaseId: string;
  projectId: string;
  projectRevision: string;
  packages: Array<{
    packageId: string;
    version: string;
    contentHash: string;
    editability: PackageEditability;
  }>;
  artifacts: Array<{
    artifactId: string;
    revision: number;
    sourceHash: string;
    compiledHash: string;
  }>;
  migrations: Array<{ id: string; checksum: string; rollback: "SAFE" | "LIMITED" | "NONE" }>;
  requiredBindings: Array<{ key: string; kind: string; requiredCapabilities: string[] }>;
  evidence: Array<{ kind: string; id: string; digest: string }>;
  policy: { bundleVersion: string; decisions: string[]; approvals: string[] };
  provenance: { builder: string; toolchain: string; sbomDigest: string; signature: string };
}

export interface ArtifactContractIssue {
  path: string;
  message: string;
}

/** Small boundary validator for callers that cannot carry a schema engine. */
export function validateArtifactEnvelopeV1(value: unknown): ArtifactContractIssue[] {
  const issues: ArtifactContractIssue[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [{ path: "$", message: "Artifact envelope must be an object." }];
  }
  const envelope = value as Partial<ArtifactEnvelopeV1>;
  if (envelope.apiVersion !== ARTIFACT_ENVELOPE_API_VERSION) {
    issues.push({ path: "apiVersion", message: `Expected ${ARTIFACT_ENVELOPE_API_VERSION}.` });
  }
  if (!CANONICAL_ARTIFACT_KINDS.includes(envelope.kind as CanonicalArtifactKind)) {
    issues.push({ path: "kind", message: "Unsupported canonical artifact kind." });
  }
  if (!envelope.metadata || typeof envelope.metadata !== "object") {
    issues.push({ path: "metadata", message: "Metadata is required." });
  } else {
    for (const key of ["id", "namespace", "name"] as const) {
      if (typeof envelope.metadata[key] !== "string" || !envelope.metadata[key]) {
        issues.push({ path: `metadata.${key}`, message: `${key} must be a non-empty string.` });
      }
    }
  }
  if (!envelope.spec || typeof envelope.spec !== "object" || Array.isArray(envelope.spec)) {
    issues.push({ path: "spec", message: "Spec must be an object." });
  }
  for (const key of ["dependencies", "capabilities", "tests"] as const) {
    if (!Array.isArray(envelope[key])) issues.push({ path: key, message: `${key} must be an array.` });
  }
  if (!envelope.interfaces || typeof envelope.interfaces !== "object") {
    issues.push({ path: "interfaces", message: "Interfaces are required." });
  }
  if (!envelope.extensions || typeof envelope.extensions !== "object" || Array.isArray(envelope.extensions)) {
    issues.push({ path: "extensions", message: "Extensions must be an object." });
  }
  return issues;
}

export function assertArtifactEnvelopeV1(value: unknown): asserts value is ArtifactEnvelopeV1 {
  const issues = validateArtifactEnvelopeV1(value);
  if (issues.length > 0) {
    throw new Error(`Invalid ArtifactEnvelopeV1: ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`);
  }
}

export function validateReleaseManifestV1(value: unknown): ArtifactContractIssue[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [{ path: "$", message: "Release manifest must be an object." }];
  }
  const manifest = value as Partial<ReleaseManifestV1>;
  const issues: ArtifactContractIssue[] = [];
  if (manifest.apiVersion !== "unierp.release/v1") {
    issues.push({ path: "apiVersion", message: "Expected unierp.release/v1." });
  }
  for (const key of ["releaseId", "projectId", "projectRevision"] as const) {
    if (typeof manifest[key] !== "string" || !manifest[key]) {
      issues.push({ path: key, message: `${key} must be a non-empty string.` });
    }
  }
  for (const key of ["packages", "artifacts", "migrations", "requiredBindings", "evidence"] as const) {
    if (!Array.isArray(manifest[key])) issues.push({ path: key, message: `${key} must be an array.` });
  }
  if (!manifest.policy || !Array.isArray(manifest.policy.approvals)) {
    issues.push({ path: "policy", message: "Policy decisions and approvals are required." });
  }
  if (!manifest.provenance?.signature || !manifest.provenance?.sbomDigest) {
    issues.push({ path: "provenance", message: "Signed provenance and SBOM digest are required." });
  }
  return issues;
}

export function assertReleaseManifestV1(value: unknown): asserts value is ReleaseManifestV1 {
  const issues = validateReleaseManifestV1(value);
  if (issues.length > 0) {
    throw new Error(`Invalid ReleaseManifestV1: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`);
  }
}
