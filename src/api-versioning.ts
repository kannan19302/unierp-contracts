/**
 * @file api-versioning.ts
 * @description Canonical API Versioning Lifecycle, Support Windows, and Retirement Rules.
 * Phase P12-069: API versioning strategy.
 *
 * Exit criterion:
 *   "The declared versioning model — how a version is expressed, supported and retired.
 *    A version retired inside its support window is refused, enforced mechanically"
 */

export type ApiVersionState = "ACTIVE" | "DEPRECATED" | "SUNSET_ANNOUNCED" | "RETIRED";

export interface ApiVersionLifecycleSpec {
  version: string; // e.g. "v1", "v2"
  state: ApiVersionState;
  releasedAt: string; // ISO 8601
  supportWindowMonths: number; // Minimum mandatory support window (e.g., 12 months)
  deprecatedAt?: string; // ISO 8601
  sunsetDate?: string; // ISO 8601
}

export class PrematureVersionRetirementError extends Error {
  public readonly version: string;
  public readonly sunsetDate: string;
  public readonly minimumAllowedSunsetDate: string;

  constructor(version: string, sunsetDate: string, minimumAllowedSunsetDate: string) {
    super(
      `Premature retirement refused for API version "${version}". Target sunset date (${sunsetDate}) is inside mandatory support window. Minimum allowed sunset date is ${minimumAllowedSunsetDate}.`
    );
    this.name = "PrematureVersionRetirementError";
    this.version = version;
    this.sunsetDate = sunsetDate;
    this.minimumAllowedSunsetDate = minimumAllowedSunsetDate;
  }
}

/**
 * Validates API version lifecycle and asserts that no version is retired within its mandatory support window.
 */
export function assertApiVersionLifecycle(
  spec: ApiVersionLifecycleSpec,
  currentEvaluationDate: string = new Date().toISOString()
): { verified: true } {
  if (spec.state === "RETIRED" || spec.sunsetDate) {
    const releaseTime = new Date(spec.releasedAt).getTime();
    const minSupportMs = spec.supportWindowMonths * 30.4375 * 24 * 60 * 60 * 1000;
    const minSunsetTime = releaseTime + minSupportMs;
    const minSunsetDate = new Date(minSunsetTime).toISOString().slice(0, 10);

    const actualSunsetTime = spec.sunsetDate ? new Date(spec.sunsetDate).getTime() : new Date(currentEvaluationDate).getTime();
    if (actualSunsetTime < minSunsetTime) {
      const targetSunsetStr = spec.sunsetDate || currentEvaluationDate.slice(0, 10);
      throw new PrematureVersionRetirementError(spec.version, targetSunsetStr, minSunsetDate);
    }
  }

  return { verified: true };
}
