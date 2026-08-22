import type { ArtifactEnvelopeV1, ArtifactPortabilityRuleV1 } from "./developer-artifacts.js";
import { validateArtifactEnvelopeV1 } from "./developer-artifacts.js";

export const BUILDER_CONFORMANCE_VERSION = "unierp.conformance/v1" as const;
export type ConformanceStatus = "PASS" | "FAIL" | "SKIP";
export interface ConformanceResult { id: string; status: ConformanceStatus; durationMs: number; message?: string }
export interface BuilderConformanceReport { apiVersion: typeof BUILDER_CONFORMANCE_VERSION; builderId: string; passed: boolean; results: ConformanceResult[] }

/** Builders expose pure boundaries and fixtures; this shared kit owns the assertions. */
export interface BuilderConformanceAdapter {
  builderId: string;
  fixture: ArtifactEnvelopeV1;
  portability: ArtifactPortabilityRuleV1;
  serializeVisual(source: ArtifactEnvelopeV1): Promise<unknown> | unknown;
  deserializeVisual(visual: unknown): Promise<ArtifactEnvelopeV1> | ArtifactEnvelopeV1;
  migrate(source: ArtifactEnvelopeV1, fromSchemaVersion: number): Promise<ArtifactEnvelopeV1> | ArtifactEnvelopeV1;
  supportedSchemaVersions: number[];
  extractDependencies(source: ArtifactEnvelopeV1): Promise<unknown[]> | unknown[];
  extractCapabilities(source: ArtifactEnvelopeV1): Promise<unknown[]> | unknown[];
  authorize(action: "AUTHOR" | "RUNTIME", permissions: string[]): Promise<boolean> | boolean;
  preview(source: ArtifactEnvelopeV1, tenantId: string): Promise<{ tenantId: string }>;
  install(source: ArtifactEnvelopeV1): Promise<{ artifactIds: string[] }>;
  remove(installation: { artifactIds: string[] }): Promise<{ orphanIds: string[] }>;
  classifyUpgrade(from: ArtifactEnvelopeV1, to: ArtifactEnvelopeV1): Promise<"COMPATIBLE" | "BREAKING"> | "COMPATIBLE" | "BREAKING";
  compile(source: ArtifactEnvelopeV1): Promise<{ contentHash: string }> | { contentHash: string };
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]));
  return value;
}
const stable = (value: unknown) => JSON.stringify(normalize(value));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export async function runBuilderConformance(adapter: BuilderConformanceAdapter): Promise<BuilderConformanceReport> {
  const results: ConformanceResult[] = [];
  const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
  const test = async (id: string, assertion: () => Promise<void> | void) => {
    const started = Date.now();
    try { await assertion(); results.push({ id, status: "PASS", durationMs: Date.now() - started }); }
    catch (error) { results.push({ id, status: "FAIL", durationMs: Date.now() - started, message: error instanceof Error ? error.message : String(error) }); }
  };
  const fixture = clone(adapter.fixture);
  await test("schema-and-unknown-fields", async () => {
    assert(validateArtifactEnvelopeV1(fixture).length === 0, "Fixture violates ArtifactEnvelopeV1");
    const source = clone(fixture); source.extensions["conformance.unknown"] = { retained: true };
    const result = await adapter.deserializeVisual(await adapter.serializeVisual(source));
    assert(stable(result.extensions["conformance.unknown"]) === stable({ retained: true }), "Unknown extension was not preserved");
  });
  await test("visual-source-round-trip", async () => assert(stable(await adapter.deserializeVisual(await adapter.serializeVisual(fixture))) === stable(fixture), "Visual/source round trip is lossy"));
  await test("revision-migrations", async () => { for (const version of adapter.supportedSchemaVersions) assert(validateArtifactEnvelopeV1(await adapter.migrate(fixture, version)).length === 0, `Migration from schema ${version} is invalid`); });
  await test("deterministic-extraction", async () => {
    assert(stable(await adapter.extractDependencies(fixture)) === stable(await adapter.extractDependencies(fixture)), "Dependency extraction is nondeterministic");
    assert(stable(await adapter.extractCapabilities(fixture)) === stable(await adapter.extractCapabilities(fixture)), "Capability extraction is nondeterministic");
  });
  await test("portability-and-mapping", () => {
    assert(adapter.portability.kind === fixture.kind, "Portability kind does not match fixture");
    assert(adapter.portability.ownerScopes.length > 0 && adapter.portability.consumerProjectKinds.length > 0, "Portability scopes are incomplete");
  });
  await test("permission-enforcement", async () => assert(!(await adapter.authorize("AUTHOR", [])) && !(await adapter.authorize("RUNTIME", [])), "Empty permissions unexpectedly authorize access"));
  await test("preview-tenant-isolation", async () => { const tenantId = `conformance-${adapter.builderId}`; assert((await adapter.preview(fixture, tenantId)).tenantId === tenantId, "Preview crossed tenant boundary"); });
  await test("install-remove-orphans", async () => { const installation = await adapter.install(fixture); assert(installation.artifactIds.length > 0, "Installation created no artifacts"); assert((await adapter.remove(installation)).orphanIds.length === 0, "Removal left orphan artifacts"); });
  await test("upgrade-classification", async () => assert(await adapter.classifyUpgrade(fixture, fixture) === "COMPATIBLE", "Identical source was classified as breaking"));
  await test("deterministic-compilation", async () => { const first = await adapter.compile(fixture), second = await adapter.compile(fixture); assert(Boolean(first.contentHash) && first.contentHash === second.contentHash, "Compilation hash is empty or nondeterministic"); });
  return { apiVersion: BUILDER_CONFORMANCE_VERSION, builderId: adapter.builderId, passed: results.every((result) => result.status === "PASS"), results };
}
