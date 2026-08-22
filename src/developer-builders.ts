import type {
  ArtifactPortabilityRuleV1,
  CanonicalArtifactKind,
  InstallationMode,
  ProjectKind,
} from "./developer-artifacts.js";

export const BUILDER_MANIFEST_API_VERSION = "unierp.builder/v1" as const;

export interface BuilderManifestV1 {
  apiVersion: typeof BUILDER_MANIFEST_API_VERSION;
  id: string;
  version: string;
  label: string;
  artifactKind: CanonicalArtifactKind;
  family: "EXPERIENCE" | "DATA" | "LOGIC" | "INTEGRATION" | "INSIGHT" | "CONTENT" | "QUALITY";
  status: "GA" | "BETA" | "EXPERIMENTAL" | "PLANNED";
  portability: ArtifactPortabilityRuleV1;
  schemaRef: string;
  compiler: { id: string; contractVersion: string };
  preview: { runtime: string; fixtureIdentity: boolean; fixtureData: boolean };
  requiredAuthoringPermissions: string[];
  requiredRuntimeCapabilities: string[];
}

const ALL_INSTALL: InstallationMode[] = ["LINKED", "PINNED", "FORKED", "EMBEDDED"];
const PORTABLE_INSTALL: InstallationMode[] = ["LINKED", "PINNED", "FORKED"];

function manifest(input: {
  id: string;
  label: string;
  kind: CanonicalArtifactKind;
  family: BuilderManifestV1["family"];
  owners: ArtifactPortabilityRuleV1["ownerScopes"];
  consumers: ProjectKind[];
  portability?: ArtifactPortabilityRuleV1["portability"];
  modes?: InstallationMode[];
  runtime?: ArtifactPortabilityRuleV1["runtimeClass"];
  packageEligible?: boolean;
  status?: BuilderManifestV1["status"];
}): BuilderManifestV1 {
  const runtime = input.runtime ?? "TRUSTED_METADATA";
  return {
    apiVersion: BUILDER_MANIFEST_API_VERSION,
    id: input.id,
    version: "1.0.0",
    label: input.label,
    artifactKind: input.kind,
    family: input.family,
    status: input.status ?? "BETA",
    portability: {
      kind: input.kind,
      ownerScopes: input.owners,
      consumerProjectKinds: input.consumers,
      portability: input.portability ?? "CONDITIONAL",
      installationModes: input.modes ?? ALL_INSTALL,
      runtimeClass: runtime,
      packageEligible: input.packageEligible ?? true,
      mayContainSecretMaterial: false,
      requiredConformance: [
        "schema-round-trip",
        "revision-migration",
        "dependency-extraction",
        "permission-enforcement",
        "tenant-isolation",
        "deterministic-compilation",
      ],
    },
    schemaRef: `unierp://schemas/artifacts/${input.kind.toLowerCase()}/v1`,
    compiler: { id: `unierp.compiler.${input.id}`, contractVersion: "1" },
    preview: {
      runtime,
      fixtureIdentity: true,
      fixtureData: true,
    },
    requiredAuthoringPermissions: ["artifact.read", "artifact.edit"],
    requiredRuntimeCapabilities: [],
  };
}

/** Server-authoritative baseline. Clients may filter and decorate it, never redefine it. */
export const BUILDER_MANIFESTS_V1: readonly BuilderManifestV1[] = [
  manifest({ id: "forms", label: "Forms", kind: "FORM", family: "EXPERIENCE", owners: ["PROJECT", "LIBRARY"], consumers: ["APP", "SITE"], status: "GA" }),
  manifest({ id: "advanced-forms", label: "Advanced Forms", kind: "ADVANCED_FORM", family: "EXPERIENCE", owners: ["PROJECT", "LIBRARY"], consumers: ["APP", "SITE"] }),
  manifest({ id: "workflows", label: "Workflows", kind: "WORKFLOW", family: "LOGIC", owners: ["PROJECT", "LIBRARY"], consumers: ["APP", "SITE"], status: "GA" }),
  manifest({ id: "bpmn", label: "BPMN", kind: "BPMN_PROCESS", family: "LOGIC", owners: ["PROJECT", "LIBRARY"], consumers: ["APP"], modes: ["PINNED", "FORKED", "EMBEDDED"] }),
  manifest({ id: "dashboards", label: "Dashboards", kind: "DASHBOARD", family: "INSIGHT", owners: ["PROJECT", "LIBRARY"], consumers: ["APP", "SITE"], status: "GA" }),
  manifest({ id: "dashboard-widgets", label: "Dashboard Widgets", kind: "DASHBOARD_WIDGET", family: "INSIGHT", owners: ["PROJECT", "LIBRARY", "MANAGE"], consumers: ["APP", "SITE"], modes: PORTABLE_INSTALL, runtime: "BROWSER" }),
  manifest({ id: "data-objects", label: "Data Objects", kind: "DATA_OBJECT", family: "DATA", owners: ["PROJECT", "LIBRARY"], consumers: ["APP"], modes: ["PINNED", "FORKED", "EMBEDDED"] }),
  manifest({ id: "rules", label: "Rules", kind: "RULE_SET", family: "LOGIC", owners: ["PROJECT", "LIBRARY"], consumers: ["APP", "SITE"] }),
  manifest({ id: "apis", label: "APIs", kind: "API_ENDPOINT", family: "INTEGRATION", owners: ["PROJECT", "LIBRARY"], consumers: ["APP", "SITE"], modes: ["PINNED", "FORKED", "EMBEDDED"] }),
  manifest({ id: "queries", label: "Saved Queries", kind: "SAVED_QUERY", family: "DATA", owners: ["PROJECT", "LIBRARY", "MANAGE"], consumers: ["APP", "SITE"], modes: PORTABLE_INSTALL }),
  manifest({ id: "scripts", label: "Scripts", kind: "SCRIPT", family: "LOGIC", owners: ["PROJECT", "LIBRARY"], consumers: ["APP", "SITE"], modes: ["PINNED", "FORKED", "EMBEDDED"], runtime: "SANDBOX" }),
  manifest({ id: "mobile", label: "Mobile", kind: "MOBILE_APP", family: "EXPERIENCE", owners: ["PROJECT"], consumers: ["APP"], portability: "PROJECT_ONLY", modes: ["EMBEDDED"], packageEligible: false, runtime: "BROWSER" }),
  manifest({ id: "etl", label: "ETL", kind: "ETL_PIPELINE", family: "INTEGRATION", owners: ["PROJECT", "LIBRARY", "MANAGE"], consumers: ["APP", "SITE"], modes: ["PINNED", "FORKED", "EMBEDDED"], runtime: "ISOLATED_WORKER" }),
  manifest({ id: "themes", label: "Themes", kind: "THEME", family: "EXPERIENCE", owners: ["PROJECT", "LIBRARY", "MANAGE"], consumers: ["APP", "SITE"], portability: "PORTABLE", runtime: "BROWSER" }),
  manifest({ id: "pages", label: "Pages", kind: "PAGE", family: "EXPERIENCE", owners: ["PROJECT", "LIBRARY"], consumers: ["APP", "SITE"], runtime: "BROWSER", status: "GA" }),
  manifest({ id: "page-sections", label: "Page Sections", kind: "PAGE_SECTION", family: "EXPERIENCE", owners: ["PROJECT", "LIBRARY"], consumers: ["APP", "SITE"], portability: "PORTABLE", modes: PORTABLE_INSTALL, runtime: "BROWSER" }),
  manifest({ id: "components", label: "Components", kind: "COMPONENT", family: "EXPERIENCE", owners: ["PROJECT", "LIBRARY", "MANAGE"], consumers: ["APP", "SITE"], modes: PORTABLE_INSTALL, runtime: "BROWSER" }),
  manifest({ id: "collections", label: "Collections", kind: "COLLECTION", family: "CONTENT", owners: ["PROJECT", "LIBRARY"], consumers: ["SITE"], modes: ["PINNED", "FORKED", "EMBEDDED"], status: "GA" }),
  manifest({ id: "blog", label: "Blog Posts", kind: "BLOG_POST", family: "CONTENT", owners: ["PROJECT"], consumers: ["SITE"], portability: "PROJECT_ONLY", modes: ["EMBEDDED"], packageEligible: false, status: "GA" }),
  manifest({ id: "menus", label: "Menus", kind: "MENU", family: "CONTENT", owners: ["PROJECT", "LIBRARY"], consumers: ["APP", "SITE"], status: "GA" }),
  manifest({ id: "assets", label: "Assets", kind: "ASSET", family: "CONTENT", owners: ["PROJECT", "LIBRARY"], consumers: ["APP", "SITE"], portability: "PORTABLE", status: "GA", runtime: "BROWSER" }),
  manifest({ id: "seo", label: "SEO", kind: "SEO_PROFILE", family: "CONTENT", owners: ["PROJECT", "LIBRARY"], consumers: ["SITE"], portability: "PORTABLE", status: "GA" }),
  manifest({ id: "ab-tests", label: "A/B Tests", kind: "AB_TEST", family: "INSIGHT", owners: ["PROJECT"], consumers: ["SITE"], portability: "PROJECT_ONLY", modes: ["EMBEDDED"], packageEligible: false }),
  manifest({ id: "tests", label: "Test Suites", kind: "TEST_SUITE", family: "QUALITY", owners: ["PROJECT", "LIBRARY"], consumers: ["APP", "SITE"], runtime: "ISOLATED_WORKER" }),
  manifest({ id: "connectors", label: "Connectors", kind: "CONNECTOR_DEFINITION", family: "INTEGRATION", owners: ["LIBRARY", "MANAGE"], consumers: ["APP", "SITE"], modes: ["PINNED"], runtime: "ISOLATED_WORKER" }),
  manifest({ id: "migrations", label: "Data Migrations", kind: "DATA_MIGRATION", family: "DATA", owners: ["PROJECT", "LIBRARY"], consumers: ["APP", "SITE"], modes: ["PINNED", "EMBEDDED"], runtime: "ISOLATED_WORKER" }),
  manifest({ id: "policies", label: "Policies", kind: "POLICY", family: "QUALITY", owners: ["PROJECT", "LIBRARY", "MANAGE"], consumers: ["APP", "SITE"], modes: ["PINNED", "FORKED", "EMBEDDED"] }),
  manifest({ id: "secret-references", label: "Secret References", kind: "SECRET_REFERENCE", family: "INTEGRATION", owners: ["PROJECT", "LIBRARY"], consumers: ["APP", "SITE"], portability: "PORTABLE", modes: ["PINNED", "EMBEDDED"], packageEligible: true }),
] as const;

export function builderManifestForKind(kind: CanonicalArtifactKind): BuilderManifestV1 | undefined {
  return BUILDER_MANIFESTS_V1.find((candidate) => candidate.artifactKind === kind);
}
