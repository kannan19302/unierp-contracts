/**
 * @file sdk-compatibility.ts
 * @description SDK Versions to API Versions Support Matrix and Compatibility Assertion.
 * Phase P12-076: SDK versioning and compatibility.
 *
 * Exit criterion:
 *   "SDK versions mapped to API versions with a stated support matrix.
 *    An SDK used against an unsupported API version fails clearly, not obscurely"
 */

export interface SdkApiSupportMatrixEntry {
  sdkVersion: string; // semver or major version range, e.g. "1.x"
  supportedApiVersions: string[]; // e.g. ["v1", "v2"]
  minimumServerVersion?: string;
  deprecatedApiVersions?: string[];
}

export const CANONICAL_SDK_SUPPORT_MATRIX: Record<string, SdkApiSupportMatrixEntry> = {
  "1.0.x": {
    sdkVersion: "1.0.x",
    supportedApiVersions: ["v1"],
    deprecatedApiVersions: [],
  },
  "1.x": {
    sdkVersion: "1.x",
    supportedApiVersions: ["v1", "v2"],
    deprecatedApiVersions: [],
  },
};

export class UnsupportedApiVersionError extends Error {
  public readonly sdkVersion: string;
  public readonly targetApiVersion: string;
  public readonly supportedVersions: string[];

  constructor(sdkVersion: string, targetApiVersion: string, supportedVersions: string[]) {
    super(
      `Unsupported API Version: SDK version "${sdkVersion}" does not support API version "${targetApiVersion}". Supported API versions: [${supportedVersions.join(", ")}]. Please upgrade your SDK or configure a compatible target API version.`
    );
    this.name = "UnsupportedApiVersionError";
    this.sdkVersion = sdkVersion;
    this.targetApiVersion = targetApiVersion;
    this.supportedVersions = supportedVersions;
  }
}

/**
 * Asserts SDK compatibility against target API version using declared support matrix.
 */
export function assertSdkApiCompatibility(
  sdkVersion: string,
  targetApiVersion: string,
  matrix: Record<string, SdkApiSupportMatrixEntry> = CANONICAL_SDK_SUPPORT_MATRIX
): { compatible: true; targetApiVersion: string } {
  // Find matching matrix entry
  const entry = matrix[sdkVersion] || matrix["1.x"];
  if (!entry) {
    throw new UnsupportedApiVersionError(sdkVersion, targetApiVersion, []);
  }

  if (!entry.supportedApiVersions.includes(targetApiVersion)) {
    throw new UnsupportedApiVersionError(sdkVersion, targetApiVersion, entry.supportedApiVersions);
  }

  return { compatible: true, targetApiVersion };
}
