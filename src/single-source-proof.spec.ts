import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertNoHandMaintainedDuplicate,
  HandMaintainedDuplicateDetectedError,
  CONTRACT_DERIVED_ARTIFACT_REGISTRY,
  type ContractDerivedArtifactDescriptor,
} from "./single-source-proof.ts";

describe("Single-source proof — EP-1 mechanism (P12-081)", () => {
  const descriptor: ContractDerivedArtifactDescriptor =
    CONTRACT_DERIVED_ARTIFACT_REGISTRY.find((d) => d.category === "TYPESCRIPT_TYPES")!;

  it("passes when candidate matches generated artefact exactly", () => {
    const canonical = ["getUser", "listUsers", "createUser"];
    const generated = ["getUser", "listUsers", "createUser"];
    const candidate = ["getUser", "listUsers", "createUser"];

    const result = assertNoHandMaintainedDuplicate(canonical, generated, candidate, descriptor);

    assert.equal(result.verified, true);
    assert.deepEqual(result.checkedCategories, ["TYPESCRIPT_TYPES"]);
  });

  it("passes when candidate has a subset of generated operations (partial consumption is fine)", () => {
    const canonical = ["getUser", "listUsers", "createUser", "deleteUser"];
    const generated = ["getUser", "listUsers", "createUser", "deleteUser"];
    const candidate = ["getUser", "listUsers"]; // consumer only uses a subset

    const result = assertNoHandMaintainedDuplicate(canonical, generated, candidate, descriptor);

    assert.equal(result.verified, true);
  });

  it("detects hand-maintained duplicate: operation in canonical + candidate but NOT in generated", () => {
    const canonical = ["getUser", "listUsers", "createUser"];
    // Generated is missing "createUser" — someone added it manually to a client file
    const generated = ["getUser", "listUsers"];
    const candidate = ["getUser", "listUsers", "createUser"];

    assert.throws(
      () => assertNoHandMaintainedDuplicate(canonical, generated, candidate, descriptor),
      (err) => {
        assert.ok(err instanceof HandMaintainedDuplicateDetectedError);
        assert.equal(err.category, "TYPESCRIPT_TYPES");
        assert.ok(err.message.includes("createUser"));
        assert.ok(err.message.includes("EP-1 violation"));
        return true;
      }
    );
  });

  it("does not flag operations unique to candidate that are absent from canonical (new artefacts)", () => {
    const canonical = ["getUser", "listUsers"];
    const generated = ["getUser", "listUsers"];
    // Candidate has a new operation not yet in canonical — this is fine,
    // it means the consumer added something of its own (not a duplicate of a contract)
    const candidate = ["getUser", "listUsers", "getProfile"];

    // getProfile is NOT in canonical, so it can't be a duplicate of a contract-derived artefact
    const result = assertNoHandMaintainedDuplicate(canonical, generated, candidate, descriptor);
    assert.equal(result.verified, true);
  });

  it("detects multiple hand-maintained duplicates in one call", () => {
    const canonical = ["getUser", "listUsers", "createUser", "deleteUser"];
    const generated = []; // nothing regenerated — entire set was hand-maintained
    const candidate = ["getUser", "listUsers", "createUser", "deleteUser"];

    assert.throws(
      () => assertNoHandMaintainedDuplicate(canonical, generated, candidate, descriptor),
      (err) => {
        assert.ok(err instanceof HandMaintainedDuplicateDetectedError);
        assert.equal(err.category, "TYPESCRIPT_TYPES");
        // All four should appear in the error message
        assert.ok(err.message.includes("getUser"));
        assert.ok(err.message.includes("deleteUser"));
        return true;
      }
    );
  });

  it("CONTRACT_DERIVED_ARTIFACT_REGISTRY covers all four required categories", () => {
    const categories = CONTRACT_DERIVED_ARTIFACT_REGISTRY.map((d) => d.category);
    assert.ok(categories.includes("TYPESCRIPT_TYPES"), "must include TYPESCRIPT_TYPES");
    assert.ok(categories.includes("DART_TYPES"), "must include DART_TYPES");
    assert.ok(categories.includes("SDK_METHODS"), "must include SDK_METHODS");
    assert.ok(categories.includes("API_DOCUMENTATION"), "must include API_DOCUMENTATION");
  });

  it("every registry entry declares at least one generated artifact path", () => {
    for (const entry of CONTRACT_DERIVED_ARTIFACT_REGISTRY) {
      assert.ok(
        entry.generatedArtifactPaths.length > 0,
        `Entry ${entry.category} must declare at least one generated artifact path`
      );
      assert.ok(
        entry.canonicalSourcePath.length > 0,
        `Entry ${entry.category} must declare a canonical source path`
      );
    }
  });
});
