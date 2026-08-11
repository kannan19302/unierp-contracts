/**
 * D13 — the settings schema specification. L0, no dependencies: the ONE
 * declarative contract an app declares its settings against, so
 * "forty-five modules each inventing their own settings page" (G-5's own
 * pattern, named in Track D's own § 1) cannot recur for settings.
 * `registerSetting()` is the ONLY way a setting comes to exist here —
 * nothing may define a setting outside it (the exit criterion's own
 * words), enforced by `assertNoUnregisteredSettings()` for any caller
 * that receives a list of setting keys from elsewhere (a form
 * submission, a migration script) and needs to prove every one of them
 * was actually declared through this contract.
 */

/** Every scope level a setting can be declared at, most specific first.
 *  The specification NAMES every one of these — the exit criterion's
 *  own phrase — so a new scope requires a deliberate edit here, never
 *  an ad-hoc string at a call site. */
export const SETTING_SCOPE_LEVELS = ["USER", "TEAM", "ORGANIZATION", "TENANT", "PLATFORM"] as const;
export type SettingScope = (typeof SETTING_SCOPE_LEVELS)[number];

export type SettingType = "string" | "number" | "boolean" | "enum" | "json";

export interface SettingValidation {
  /** Required for type "enum". */
  enumValues?: readonly string[];
  min?: number;
  max?: number;
  pattern?: string;
}

export interface SettingDefinition {
  /** Globally unique, namespaced by the declaring app/module, e.g. "billing.invoice.autoNumber". */
  key: string;
  /** The app or module that owns this setting — the only thing allowed to change its definition. */
  owner: string;
  type: SettingType;
  /** Which scope(s) this setting may be SET at. Read resolution walks from most specific to least. */
  scopes: readonly SettingScope[];
  defaultValue: unknown;
  /** The permission code required to CHANGE this setting (read is always allowed to anyone who can see the scope). */
  permission: string;
  helpText: string;
  validation?: SettingValidation;
  /** Other setting keys that must be set (or set to a specific value) before this one is meaningful. */
  dependsOn?: readonly string[];
  /** Schema version — bumped whenever type/validation changes in a way existing stored values might not satisfy. */
  version: number;
}

export class UnregisteredSettingError extends Error {
  constructor(key: string) {
    super(`Setting "${key}" was never declared via registerSetting() — nothing may define a setting outside the L0 contract (D13).`);
    this.name = "UnregisteredSettingError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidSettingScopeError extends Error {
  constructor(key: string, scope: string, declaredScopes: readonly string[]) {
    super(`Setting "${key}" cannot be set at scope "${scope}" — it is only declared for [${declaredScopes.join(", ")}].`);
    this.name = "InvalidSettingScopeError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const registry = new Map<string, SettingDefinition>();

/** The ONLY way a setting comes to exist. Refuses a scope not in
 *  SETTING_SCOPE_LEVELS and a duplicate key registered by a different
 *  owner (an app may re-register its own key, e.g. across a redeploy;
 *  a DIFFERENT app claiming an existing key is refused). */
export function registerSetting(def: SettingDefinition): void {
  if (def.scopes.length === 0) {
    throw new Error(`Setting "${def.key}" must declare at least one scope`);
  }
  for (const scope of def.scopes) {
    if (!SETTING_SCOPE_LEVELS.includes(scope)) {
      throw new Error(`Setting "${def.key}" declares unknown scope "${scope}" — must be one of ${SETTING_SCOPE_LEVELS.join(", ")}`);
    }
  }
  if (def.type === "enum" && (!def.validation?.enumValues || def.validation.enumValues.length === 0)) {
    throw new Error(`Setting "${def.key}" has type "enum" but no validation.enumValues declared`);
  }
  const existing = registry.get(def.key);
  if (existing && existing.owner !== def.owner) {
    throw new Error(`Setting "${def.key}" is already owned by "${existing.owner}" — "${def.owner}" cannot redefine it`);
  }
  registry.set(def.key, def);
}

export function getSettingDefinition(key: string): SettingDefinition | undefined {
  return registry.get(key);
}

export function getAllSettingDefinitions(): SettingDefinition[] {
  return [...registry.values()];
}

/** Refuses (throws UnregisteredSettingError) the FIRST key in the given
 *  list that was never declared via registerSetting() — the mechanical
 *  form of "nothing may define a setting outside it." */
export function assertNoUnregisteredSettings(keys: readonly string[]): void {
  for (const key of keys) {
    if (!registry.has(key)) {
      throw new UnregisteredSettingError(key);
    }
  }
}

/** Refuses a scope this setting was never declared for. */
export function assertValidScopeForSetting(key: string, scope: SettingScope): void {
  const def = registry.get(key);
  if (!def) throw new UnregisteredSettingError(key);
  if (!def.scopes.includes(scope)) {
    throw new InvalidSettingScopeError(key, scope, def.scopes);
  }
}

export function __resetSettingsRegistryForTests(): void {
  registry.clear();
}
