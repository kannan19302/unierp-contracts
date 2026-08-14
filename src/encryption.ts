/**
 * @file encryption.ts
 * @description Field-level encryption primitives, key management, envelope encryption and rotation contracts.
 * Phase P12-045: Field-level encryption primitives.
 */

export interface EncryptedPayload {
  /** Ciphertext encoded in Base64 or Hex */
  ciphertext: string;
  /** Initialisation Vector (IV) in Base64 or Hex */
  iv: string;
  /** Authentication tag for AEAD ciphers (e.g. AES-256-GCM) */
  tag: string;
  /** Key ID or version used to encrypt this payload */
  keyId: string;
  /** Encryption algorithm identifier */
  algorithm: "AES-256-GCM";
  /** Optional tenant identifier for multi-tenant envelope scoping */
  tenantId?: string;
}

export interface KeyMetadata {
  keyId: string;
  version: number;
  status: "ACTIVE" | "ROTATED" | "REVOKED";
  createdAt: string;
  rotatedAt?: string;
  expiresAt?: string;
  algorithm: "AES-256-GCM";
}

export interface FieldEncryptionConfig {
  /** Field name to encrypt */
  fieldName: string;
  /** Model / Entity name */
  modelName: string;
  /** Active key ID for writes */
  activeKeyId: string;
  /** Allowed key IDs for read decryption during rotation */
  allowedKeyIds: string[];
}

export interface EncryptOptions {
  keyId?: string;
  tenantId?: string;
  additionalAuthenticatedData?: string;
}

export interface DecryptOptions {
  additionalAuthenticatedData?: string;
}

export interface KeyRing {
  /** Map of keyId -> 32-byte hex/raw key */
  keys: Record<string, string>;
  activeKeyId: string;
}

/**
 * Validates that an encrypted payload has all required AEAD components.
 */
export function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<EncryptedPayload>;
  return (
    typeof p.ciphertext === "string" &&
    typeof p.iv === "string" &&
    typeof p.tag === "string" &&
    typeof p.keyId === "string" &&
    p.algorithm === "AES-256-GCM"
  );
}

/**
 * Serialises EncryptedPayload into a canonical storage string: `enc:v1:<keyId>:<iv>:<tag>:<ciphertext>`
 */
export function serializeEncryptedPayload(payload: EncryptedPayload): string {
  return `enc:v1:${payload.keyId}:${payload.iv}:${payload.tag}:${payload.ciphertext}`;
}

/**
 * Deserialises a canonical storage string into EncryptedPayload.
 */
export function deserializeEncryptedPayload(stored: string): EncryptedPayload | null {
  if (typeof stored !== "string" || !stored.startsWith("enc:v1:")) {
    return null;
  }
  const parts = stored.split(":");
  if (parts.length !== 6) return null;
  const keyId = parts[2];
  const iv = parts[3];
  const tag = parts[4];
  const ciphertext = parts[5];
  if (!keyId || !iv || !tag || !ciphertext) return null;
  return {
    keyId,
    iv,
    tag,
    ciphertext,
    algorithm: "AES-256-GCM",
  };
}

/**
 * Checks if a string value is in canonical encrypted format.
 */
export function isEncryptedFormat(value: unknown): boolean {
  return typeof value === "string" && value.startsWith("enc:v1:");
}
