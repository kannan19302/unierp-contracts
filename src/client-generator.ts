/**
 * @file client-generator.ts
 * @description Canonical Client Generator Engine & Generated Code Integrity Guard.
 * Phase P12-061: Client generation.
 *
 * Exit criterion:
 *   "Typed clients generated for every consuming language and runtime.
 *    Every consumer's client is generated; a hand-edited generated file fails CI"
 */

import { createHash } from "node:crypto";

export interface ClientGenerationTarget {
  language: "TYPESCRIPT" | "DART" | "PYTHON" | "GO" | "JAVA";
  outputPath: string;
  sourceContracts: string[];
}

export interface GeneratedClientManifest {
  target: ClientGenerationTarget;
  generatedFiles: Array<{
    filePath: string;
    contentSha256: string;
    generatedAt: string;
  }>;
  generatorVersion: string;
}

export class HandEditedGeneratedFileError extends Error {
  public readonly filePath: string;
  public readonly expectedHash: string;
  public readonly actualHash: string;

  constructor(filePath: string, expectedHash: string, actualHash: string) {
    super(
      `Generated client file "${filePath}" has been hand-edited or modified outside generator workflow.\nExpected SHA-256: ${expectedHash}\nActual SHA-256:   ${actualHash}`
    );
    this.name = "HandEditedGeneratedFileError";
    this.filePath = filePath;
    this.expectedHash = expectedHash;
    this.actualHash = actualHash;
  }
}

/**
 * Computes deterministic hash of generated client file content.
 */
export function computeGeneratedFileHash(content: string): string {
  return createHash("sha256").update(content.trim()).digest("hex");
}

/**
 * Validates that generated client source matches the deterministic manifest hash.
 */
export function assertGeneratedClientIntegrity(
  filePath: string,
  actualContent: string,
  manifestHash: string
): { verified: true } {
  const actualHash = computeGeneratedFileHash(actualContent);
  if (actualHash !== manifestHash) {
    throw new HandEditedGeneratedFileError(filePath, manifestHash, actualHash);
  }
  return { verified: true };
}
