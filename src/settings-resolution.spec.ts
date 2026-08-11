/**
 * D15 exit criterion: "Any setting's effective value shows which scope
 * supplied it. Precedence is a tested table, not an implementation
 * detail."
 */
import { describe, it, expect } from "vitest";
import { resolveEffectiveValue } from "./settings-resolution.js";
import { SETTING_SCOPE_LEVELS, type SettingScope } from "./settings.js";

const def = { key: "billing.currency", defaultValue: "USD" };

describe("D15 · deterministic scope resolution", () => {
  it("PRECEDENCE IS A TESTED TABLE: the exact order is USER > TEAM > ORGANIZATION > TENANT > PLATFORM > DEFAULT", () => {
    // A table-driven test: every scope set simultaneously, most specific must win.
    const allSet: Partial<Record<SettingScope, unknown>> = {
      PLATFORM: "platform-value",
      TENANT: "tenant-value",
      ORGANIZATION: "org-value",
      TEAM: "team-value",
      USER: "user-value",
    };
    expect(resolveEffectiveValue(def, allSet)).toEqual({ key: def.key, value: "user-value", sourceScope: "USER" });

    // Remove USER — TEAM must win next.
    const { USER, ...withoutUser } = allSet;
    expect(resolveEffectiveValue(def, withoutUser)).toEqual({ key: def.key, value: "team-value", sourceScope: "TEAM" });

    const { TEAM, ...withoutTeam } = withoutUser;
    expect(resolveEffectiveValue(def, withoutTeam)).toEqual({ key: def.key, value: "org-value", sourceScope: "ORGANIZATION" });

    const { ORGANIZATION, ...withoutOrg } = withoutTeam;
    expect(resolveEffectiveValue(def, withoutOrg)).toEqual({ key: def.key, value: "tenant-value", sourceScope: "TENANT" });

    const { TENANT, ...withoutTenant } = withoutOrg;
    expect(resolveEffectiveValue(def, withoutTenant)).toEqual({ key: def.key, value: "platform-value", sourceScope: "PLATFORM" });

    expect(resolveEffectiveValue(def, {})).toEqual({ key: def.key, value: "USD", sourceScope: "DEFAULT" });
  });

  it("the resolved value's sourceScope ANSWERS 'which scope supplied it' directly — not something a caller reverse-engineers", () => {
    const result = resolveEffectiveValue(def, { TENANT: "EUR" });
    expect(result.sourceScope).toBe("TENANT");
    expect(result.value).toBe("EUR");
  });

  it("a scope explicitly set to a FALSY value (0, false, '') still wins over a less-specific scope — falsy is not 'unset'", () => {
    const boolDef = { key: "feature.enabled", defaultValue: true };
    const result = resolveEffectiveValue(boolDef, { TENANT: true, USER: false });
    expect(result).toEqual({ key: "feature.enabled", value: false, sourceScope: "USER" });
  });

  it("an explicit undefined at the most specific scope is treated as UNSET, falling through to the next scope", () => {
    const result = resolveEffectiveValue(def, { TENANT: "tenant-value", USER: undefined });
    expect(result.sourceScope).toBe("TENANT");
  });

  it("the precedence table itself is the exported, inspectable SETTING_SCOPE_LEVELS constant — never buried inside the resolver", () => {
    expect(SETTING_SCOPE_LEVELS).toEqual(["USER", "TEAM", "ORGANIZATION", "TENANT", "PLATFORM"]);
  });
});
