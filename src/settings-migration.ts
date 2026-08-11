/**
 * D16 — settings versioning and migration, over D13's contract.
 *
 * Two independent guarantees, both proven by their own test:
 *
 *   1. A setting RENAMED in a later version must not lose any tenant's
 *      already-stored value under the old key. `registerRename()` +
 *      `migrateStoredValues()` copy the old key's value to the new key
 *      and remove the old key — a tenant's v1 value survives the rename
 *      intact, under the new name.
 *
 *   2. A CHANGED DEFAULT must never silently move a tenant that never
 *      explicitly set a value. `pinDefaultBeforeChange()` writes the
 *      OLD default as an explicit stored value for every tenant with no
 *      existing entry, BEFORE the schema's defaultValue is updated —
 *      so a tenant who was implicitly relying on the old default keeps
 *      behaving exactly as before, and only a tenant who explicitly
 *      opts in (or a genuinely new tenant, with no pinned value at all)
 *      ever sees the new default.
 */

export interface SettingRename {
  oldKey: string;
  newKey: string;
  /** The version the rename took effect in — recorded for audit, not
   *  consulted by migrateStoredValues() itself (which is idempotent
   *  regardless of version). */
  effectiveVersion: number;
}

const renames = new Map<string, SettingRename>();

/** Declares that `oldKey` became `newKey` starting at `effectiveVersion`. */
export function registerRename(oldKey: string, newKey: string, effectiveVersion: number): void {
  renames.set(oldKey, { oldKey, newKey, effectiveVersion });
}

export function getRegisteredRenames(): SettingRename[] {
  return [...renames.values()];
}

/**
 * Applies every registered rename to one tenant's stored values. The
 * new key receives the old key's value ONLY if the new key has no
 * value of its own already (a tenant who already explicitly set the
 * new key, e.g. after upgrading once, is never overwritten by a
 * second migration run — this function is safe to run more than once).
 * The old key is always removed once migrated.
 */
export function migrateStoredValues(storedValues: Record<string, unknown>): Record<string, unknown> {
  const result = { ...storedValues };
  for (const { oldKey, newKey } of renames.values()) {
    if (Object.prototype.hasOwnProperty.call(result, oldKey)) {
      if (!Object.prototype.hasOwnProperty.call(result, newKey)) {
        result[newKey] = result[oldKey];
      }
      delete result[oldKey];
    }
  }
  return result;
}

/**
 * Call BEFORE updating a setting's defaultValue in the registry. Pins
 * the CURRENT (about-to-become-old) default as an explicit value for
 * every tenant in `tenantValuesByTenantId` that has no entry for `key`
 * — so none of them silently inherit the new default once it takes
 * effect. A tenant that already has an explicit value for `key` (any
 * value, including one equal to the old default) is left untouched.
 */
export function pinDefaultBeforeChange(
  tenantValuesByTenantId: Record<string, Record<string, unknown>>,
  key: string,
  oldDefault: unknown,
): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  for (const [tenantId, values] of Object.entries(tenantValuesByTenantId)) {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      result[tenantId] = values;
    } else {
      result[tenantId] = { ...values, [key]: oldDefault };
    }
  }
  return result;
}

export function __resetRenamesForTests(): void {
  renames.clear();
}
