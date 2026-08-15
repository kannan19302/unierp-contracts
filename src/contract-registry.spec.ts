import { test, describe } from "node:test";
import assert from "node:assert";
import { ContractRegistry, ContractNotFoundError } from "../dist/contract-registry.js";

describe("ContractRegistry", () => {
  test("registers and retrieves a contract", () => {
    ContractRegistry.clear();
    ContractRegistry.registerContract({
      contractId: "test.api",
      version: "1",
      state: "ACTIVE",
      consumers: []
    });

    const contract = ContractRegistry.getContract("test.api", "1");
    assert.strictEqual(contract.state, "ACTIVE");
  });

  test("throws ContractNotFoundError when retrieving unknown contract", () => {
    ContractRegistry.clear();
    assert.throws(() => {
      ContractRegistry.getContract("unknown.api", "1");
    }, ContractNotFoundError);
  });

  test("queries contracts by state", () => {
    ContractRegistry.clear();
    ContractRegistry.registerContract({
      contractId: "active.api",
      version: "1",
      state: "ACTIVE",
      consumers: []
    });
    ContractRegistry.registerContract({
      contractId: "deprecated.api",
      version: "1",
      state: "DEPRECATED",
      consumers: []
    });

    const results = ContractRegistry.queryContracts({ state: "DEPRECATED" });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].contractId, "deprecated.api");
  });

  test("queries contracts by consumerId", () => {
    ContractRegistry.clear();
    ContractRegistry.registerContract({
      contractId: "consumed.api",
      version: "1",
      state: "ACTIVE",
      consumers: [{ consumerId: "app-a", version: "1", contactEmail: "a@a.com" }]
    });
    ContractRegistry.registerContract({
      contractId: "other.api",
      version: "1",
      state: "ACTIVE",
      consumers: [{ consumerId: "app-b", version: "1", contactEmail: "b@b.com" }]
    });

    const results = ContractRegistry.queryContracts({ consumerId: "app-a" });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].contractId, "consumed.api");
  });
});
