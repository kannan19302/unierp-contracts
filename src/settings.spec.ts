/**
 * D13 exit criterion: "The contract is published at L0 and the
 * specification names every scope level. Nothing may define a setting
 * outside it."
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  registerSetting,
  getSettingDefinition,
  getAllSettingDefinitions,
  assertNoUnregisteredSettings,
  assertValidScopeForSetting,
  SETTING_SCOPE_LEVELS,
  UnregisteredSettingError,
  InvalidSettingScopeError,
  __resetSettingsRegistryForTests,
} from "./settings.js";

describe("D13 · settings schema specification — the single L0 contract", () => {
  beforeEach(() => {
    __resetSettingsRegistryForTests();
  });

  it("the specification NAMES every scope level", () => {
    expect(SETTING_SCOPE_LEVELS).toEqual(["USER", "TEAM", "ORGANIZATION", "TENANT", "PLATFORM"]);
  });

  it("REGISTERS a setting with all the required fields", () => {
    registerSetting({
      key: "billing.invoice.autoNumber",
      owner: "billing",
      type: "boolean",
      scopes: ["TENANT"],
      defaultValue: true,
      permission: "billing.settings.manage",
      helpText: "Automatically assigns the next invoice number.",
      version: 1,
    });
    const def = getSettingDefinition("billing.invoice.autoNumber");
    expect(def?.owner).toBe("billing");
  });

  it("REFUSES an enum setting with no enumValues declared", () => {
    expect(() =>
      registerSetting({
        key: "billing.currency",
        owner: "billing",
        type: "enum",
        scopes: ["TENANT"],
        defaultValue: "USD",
        permission: "billing.settings.manage",
        helpText: "Default billing currency.",
        version: 1,
      }),
    ).toThrow(/enumValues/);
  });

  it("REFUSES a setting declared with an unknown scope", () => {
    expect(() =>
      registerSetting({
        key: "billing.weird",
        owner: "billing",
        type: "boolean",
        scopes: ["GALAXY" as never],
        defaultValue: false,
        permission: "billing.settings.manage",
        helpText: "x",
        version: 1,
      }),
    ).toThrow(/unknown scope/);
  });

  it("REFUSES a DIFFERENT owner claiming an already-registered key", () => {
    registerSetting({ key: "shared.key", owner: "billing", type: "boolean", scopes: ["TENANT"], defaultValue: true, permission: "p", helpText: "h", version: 1 });
    expect(() =>
      registerSetting({ key: "shared.key", owner: "crm", type: "boolean", scopes: ["TENANT"], defaultValue: false, permission: "p", helpText: "h", version: 1 }),
    ).toThrow(/already owned/);
  });

  it("allows the SAME owner to re-register its own key (e.g. across a redeploy)", () => {
    registerSetting({ key: "billing.x", owner: "billing", type: "number", scopes: ["TENANT"], defaultValue: 1, permission: "p", helpText: "h", version: 1 });
    expect(() =>
      registerSetting({ key: "billing.x", owner: "billing", type: "number", scopes: ["TENANT"], defaultValue: 2, permission: "p", helpText: "h", version: 2 }),
    ).not.toThrow();
    expect(getSettingDefinition("billing.x")?.version).toBe(2);
  });

  it("NOTHING MAY DEFINE A SETTING OUTSIDE IT — a key never passed through registerSetting() is refused by assertNoUnregisteredSettings()", () => {
    registerSetting({ key: "billing.known", owner: "billing", type: "boolean", scopes: ["TENANT"], defaultValue: true, permission: "p", helpText: "h", version: 1 });

    expect(() => assertNoUnregisteredSettings(["billing.known"])).not.toThrow();
    expect(() => assertNoUnregisteredSettings(["billing.known", "billing.rogue"])).toThrow(UnregisteredSettingError);
  });

  it("REFUSES setting a value at a scope the setting was never declared for", () => {
    registerSetting({ key: "billing.tenantOnly", owner: "billing", type: "boolean", scopes: ["TENANT"], defaultValue: true, permission: "p", helpText: "h", version: 1 });

    expect(() => assertValidScopeForSetting("billing.tenantOnly", "TENANT")).not.toThrow();
    expect(() => assertValidScopeForSetting("billing.tenantOnly", "USER")).toThrow(InvalidSettingScopeError);
  });

  it("getAllSettingDefinitions() is the queryable registry any settings-runtime UI reads", () => {
    registerSetting({ key: "a.one", owner: "a", type: "boolean", scopes: ["TENANT"], defaultValue: true, permission: "p", helpText: "h", version: 1 });
    registerSetting({ key: "b.one", owner: "b", type: "string", scopes: ["USER"], defaultValue: "", permission: "p", helpText: "h", version: 1 });

    expect(getAllSettingDefinitions().map((d) => d.key).sort()).toEqual(["a.one", "b.one"]);
  });
});
