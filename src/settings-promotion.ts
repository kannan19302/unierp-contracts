/**
 * D18 — settings import, export and environment promotion, over D13's
 * contract. `secretKeys` is caller-supplied (the same pattern D17 used
 * for `isSensitive` — D13's SettingDefinition itself carries no
 * "secret" flag, and D13 is already closed, so callers name their own
 * secret keys rather than this phase silently reopening D13).
 *
 * The one invariant every function here upholds: a key in `secretKeys`
 * NEVER appears with its actual value in an exported snapshot, a diff,
 * or a promotion payload — "no secret leaving its scope" is structural,
 * not a redaction applied after the fact that a caller could forget.
 */

export type ConfigurationSnapshot = Record<string, unknown>;

export interface ConfigDiffEntry {
  key: string;
  status: "added" | "removed" | "changed" | "unchanged" | "secret";
  sourceValue?: unknown;
  targetValue?: unknown;
}

/**
 * Exports `values`, OMITTING every key in `secretKeys` entirely — a
 * secret setting never appears in the returned snapshot at all, not
 * even as a placeholder, because a placeholder is still something that
 * left its original scope.
 */
export function exportConfiguration(values: Record<string, unknown>, secretKeys: ReadonlySet<string>): ConfigurationSnapshot {
  const snapshot: ConfigurationSnapshot = {};
  for (const [key, value] of Object.entries(values)) {
    if (secretKeys.has(key)) continue;
    snapshot[key] = value;
  }
  return snapshot;
}

/**
 * A REVIEWABLE diff between a source snapshot and a target's current
 * values. A secret key is reported with status "secret" and NEITHER
 * value shown — reviewable does not mean the secret's value is ever
 * rendered, only that its presence/absence is visible.
 */
export function diffConfiguration(
  source: ConfigurationSnapshot,
  target: Record<string, unknown>,
  secretKeys: ReadonlySet<string>,
): ConfigDiffEntry[] {
  const keys = new Set([...Object.keys(source), ...Object.keys(target)]);
  const entries: ConfigDiffEntry[] = [];

  for (const key of keys) {
    if (secretKeys.has(key)) {
      entries.push({ key, status: "secret" });
      continue;
    }
    const inSource = Object.prototype.hasOwnProperty.call(source, key);
    const inTarget = Object.prototype.hasOwnProperty.call(target, key);
    if (inSource && !inTarget) {
      entries.push({ key, status: "added", sourceValue: source[key] });
    } else if (!inSource && inTarget) {
      entries.push({ key, status: "removed", targetValue: target[key] });
    } else if (JSON.stringify(source[key]) !== JSON.stringify(target[key])) {
      entries.push({ key, status: "changed", sourceValue: source[key], targetValue: target[key] });
    } else {
      entries.push({ key, status: "unchanged", sourceValue: source[key], targetValue: target[key] });
    }
  }
  return entries;
}

export interface PromotionResult {
  dryRun: boolean;
  diff: ConfigDiffEntry[];
  /** Only present when dryRun is false — the values to actually apply
   *  to the target, EXCLUDING every secret key (the target keeps
   *  whatever secret value it already has; promotion never carries one
   *  across scopes). */
  valuesToApply?: Record<string, unknown>;
}

/**
 * Promotes `source` onto `target`. A dry run (the default) returns only
 * the reviewable diff and applies nothing. A real run additionally
 * returns `valuesToApply` — every non-secret changed/added key from the
 * diff — which the caller writes to the target's real storage. No
 * secret key is EVER present in `valuesToApply`, structurally: it is
 * built by filtering the diff, and every secret entry in the diff
 * carries no value to filter in from in the first place.
 */
export function promoteConfiguration(
  source: ConfigurationSnapshot,
  target: Record<string, unknown>,
  secretKeys: ReadonlySet<string>,
  dryRun: boolean = true,
): PromotionResult {
  const diff = diffConfiguration(source, target, secretKeys);
  if (dryRun) return { dryRun: true, diff };

  const valuesToApply: Record<string, unknown> = {};
  for (const entry of diff) {
    if (entry.status === "added" || entry.status === "changed") {
      valuesToApply[entry.key] = entry.sourceValue;
    }
  }
  return { dryRun: false, diff, valuesToApply };
}
