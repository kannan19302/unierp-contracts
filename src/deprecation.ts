/**
 * @file deprecation.ts
 * @description Contract Element Deprecation Signaling, Warning, and Window Enforcement.
 * Phase P12-071: Deprecation mechanism.
 *
 * Exit criterion:
 *   "Marking, signalling and enforcing deprecation windows on contract elements.
 *    A deprecated element still works and warns; removal inside its window is refused"
 */

export interface DeprecationMetadata {
  deprecated: boolean;
  deprecatedSince: string; // ISO Date e.g. "2026-01-01"
  sunsetDate: string; // ISO Date e.g. "2026-12-31"
  migrationGuideUrl?: string;
  replacementElement?: string;
}

export interface DeprecatedContractElement {
  elementId: string;
  elementKind: "ENDPOINT" | "FIELD" | "PARAMETER" | "HEADER";
  deprecation: DeprecationMetadata;
}

export class PrematureElementRemovalError extends Error {
  public readonly elementId: string;
  public readonly removalDate: string;
  public readonly sunsetDate: string;

  constructor(elementId: string, removalDate: string, sunsetDate: string) {
    super(
      `Premature removal refused for contract element "${elementId}". Element was removed on ${removalDate} prior to its declared sunset date ${sunsetDate}.`
    );
    this.name = "PrematureElementRemovalError";
    this.elementId = elementId;
    this.removalDate = removalDate;
    this.sunsetDate = sunsetDate;
  }
}

export interface DeprecationSignalResult {
  warningHeader: string;
  sunsetHeader: string;
  linkHeader?: string;
}

/**
 * Generates standard RFC 8594 / RFC 7234 Sunset and Warning response headers for deprecated elements.
 */
export function formatDeprecationHeaders(metadata: DeprecationMetadata): DeprecationSignalResult {
  if (!metadata.deprecated) {
    throw new Error("Cannot format deprecation headers for a non-deprecated element");
  }

  const warningHeader = `299 - "Deprecated element: sunset scheduled for ${metadata.sunsetDate}"`;
  const sunsetHeader = new Date(metadata.sunsetDate).toUTCString();
  const linkHeader = metadata.migrationGuideUrl ? `<${metadata.migrationGuideUrl}>; rel="deprecation"` : undefined;

  return {
    warningHeader,
    sunsetHeader,
    linkHeader,
  };
}

/**
 * Verifies that deprecated elements are not removed prematurely before their sunset date.
 */
export function assertDeprecationWindowEnforcement(
  activeDeprecatedElements: DeprecatedContractElement[],
  candidateElements: string[],
  currentDate: string = new Date().toISOString()
): { verified: true } {
  const candidateSet = new Set(candidateElements);
  const evaluationTime = new Date(currentDate).getTime();

  for (const el of activeDeprecatedElements) {
    if (!candidateSet.has(el.elementId)) {
      const sunsetTime = new Date(el.deprecation.sunsetDate).getTime();
      if (evaluationTime < sunsetTime) {
        throw new PrematureElementRemovalError(el.elementId, currentDate.slice(0, 10), el.deprecation.sunsetDate);
      }
    }
  }

  return { verified: true };
}
