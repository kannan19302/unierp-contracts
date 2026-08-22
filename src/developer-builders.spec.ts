import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_ARTIFACT_KINDS } from "./developer-artifacts.ts";
import { BUILDER_MANIFESTS_V1, builderManifestForKind } from "./developer-builders.ts";

describe("builder manifest registry", () => {
  it("has exactly one manifest for every canonical artifact kind", () => {
    assert.equal(BUILDER_MANIFESTS_V1.length, CANONICAL_ARTIFACT_KINDS.length);
    assert.equal(new Set(BUILDER_MANIFESTS_V1.map((item) => item.id)).size, BUILDER_MANIFESTS_V1.length);
    assert.equal(new Set(BUILDER_MANIFESTS_V1.map((item) => item.artifactKind)).size, BUILDER_MANIFESTS_V1.length);
    for (const kind of CANONICAL_ARTIFACT_KINDS) assert.ok(builderManifestForKind(kind), kind);
  });

  it("never permits secret material in portable artifacts", () => {
    for (const manifest of BUILDER_MANIFESTS_V1) {
      assert.equal(manifest.portability.mayContainSecretMaterial, false, manifest.id);
    }
  });

  it("does not make project-only artifacts package eligible", () => {
    for (const manifest of BUILDER_MANIFESTS_V1) {
      if (manifest.portability.portability === "PROJECT_ONLY") {
        assert.equal(manifest.portability.packageEligible, false, manifest.id);
      }
    }
  });
});
