import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ARTIFACT_ENVELOPE_API_VERSION,
  assertArtifactEnvelopeV1,
  validateArtifactEnvelopeV1,
  type ArtifactEnvelopeV1,
  type FormSpecV1,
  validateReleaseManifestV1,
} from "./developer-artifacts.ts";

function form(): ArtifactEnvelopeV1<FormSpecV1> {
  return {
    apiVersion: ARTIFACT_ENVELOPE_API_VERSION,
    kind: "FORM",
    metadata: { id: "artifact_01", namespace: "acme.sales", name: "Lead intake" },
    spec: {
      title: "Lead intake",
      pages: [{ id: "page_1", fields: [{ id: "email", name: "email", type: "email", label: "Email" }] }],
    },
    interfaces: { inputs: [], outputs: [], events: [] },
    dependencies: [],
    capabilities: [],
    tests: [],
    extensions: { "acme.example": { preserved: true } },
  };
}

describe("ArtifactEnvelopeV1", () => {
  it("accepts a canonical pilot form and preserves extension fields", () => {
    const value = form();
    assert.deepEqual(validateArtifactEnvelopeV1(value), []);
    assert.doesNotThrow(() => assertArtifactEnvelopeV1(value));
    assert.deepEqual(value.extensions, { "acme.example": { preserved: true } });
  });

  it("rejects unknown kinds and incomplete metadata", () => {
    const value = form() as any;
    value.kind = "MAGIC_SCREEN";
    value.metadata.namespace = "";
    const issues = validateArtifactEnvelopeV1(value);
    assert.ok(issues.some((issue) => issue.path === "kind"));
    assert.ok(issues.some((issue) => issue.path === "metadata.namespace"));
    assert.throws(() => assertArtifactEnvelopeV1(value), /Invalid ArtifactEnvelopeV1/);
  });

  it("requires explicit dependency, capability and test arrays", () => {
    const value = form() as any;
    delete value.dependencies;
    delete value.capabilities;
    delete value.tests;
    const paths = validateArtifactEnvelopeV1(value).map((issue) => issue.path);
    assert.deepEqual(paths.sort(), ["capabilities", "dependencies", "tests"]);
  });
});

describe("ReleaseManifestV1", () => {
  it("is environment-independent so one immutable manifest promotes unchanged", () => {
    const manifest = {
      apiVersion: "unierp.release/v1",
      releaseId: "release-1",
      projectId: "project-1",
      projectRevision: "fingerprint",
      packages: [], artifacts: [], migrations: [], requiredBindings: [], evidence: [],
      policy: { bundleVersion: "1", decisions: ["allow"], approvals: ["approver-1"] },
      provenance: { builder: "unierp", toolchain: "1", sbomDigest: "sha256:abc", signature: "sig" },
    };
    assert.equal("environmentClass" in manifest, false);
    assert.deepEqual(validateReleaseManifestV1(manifest), []);
  });
});
