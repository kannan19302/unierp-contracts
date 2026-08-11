/**
 * D15 — deterministic scope resolution over D13's settings contract.
 * `SETTING_SCOPE_LEVELS` (settings.ts) already lists every scope level,
 * most specific first: USER, TEAM, ORGANIZATION, TENANT, PLATFORM. That
 * ORDER *is* the precedence table — a plain, exported, tested array,
 * never an implementation detail buried inside a resolver function.
 * `resolveEffectiveValue()` walks it top to bottom and returns the
 * first scope that actually supplied a value, so an effective value is
 * always inspectable back to its origin scope.
 */
import { SETTING_SCOPE_LEVELS, type SettingScope, type SettingDefinition } from "./settings.js";

export type SettingSource = SettingScope | "DEFAULT";

export interface ResolvedSetting {
  key: string;
  value: unknown;
  /** Which scope supplied this value — the exit criterion's own words,
   *  made literal as a return field, not something a caller has to
   *  reverse-engineer. */
  sourceScope: SettingSource;
}

/**
 * `valuesByScope` holds whatever value each scope explicitly set for
 * this setting — a scope with no entry (or an explicit `undefined`)
 * means "this scope did not set it," which is different from "set it
 * to a falsy value" (0, false, "" are all valid explicit overrides).
 */
export function resolveEffectiveValue(
  def: Pick<SettingDefinition, "key" | "defaultValue">,
  valuesByScope: Partial<Record<SettingScope, unknown>>,
): ResolvedSetting {
  for (const scope of SETTING_SCOPE_LEVELS) {
    if (Object.prototype.hasOwnProperty.call(valuesByScope, scope) && valuesByScope[scope] !== undefined) {
      return { key: def.key, value: valuesByScope[scope], sourceScope: scope };
    }
  }
  return { key: def.key, value: def.defaultValue, sourceScope: "DEFAULT" };
}
