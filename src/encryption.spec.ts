import { describe, it, expect } from "vitest";
import {
  EncryptedPayload,
  isEncryptedPayload,
  serializeEncryptedPayload,
  deserializeEncryptedPayload,
  isEncryptedFormat,
} from "./encryption.js";

describe("Field-level encryption primitives", () => {
  const samplePayload: EncryptedPayload = {
    keyId: "k-2026-01",
    iv: "dGVzdC1pdi0xMjM=",
    tag: "dGVzdC10YWctNDU2",
    ciphertext: "ZW5jcnlwdGVkLXNlY3JldA==",
    algorithm: "AES-256-GCM",
  };

  it("identifies valid EncryptedPayload objects", () => {
    expect(isEncryptedPayload(samplePayload)).toBe(true);
    expect(isEncryptedPayload({ ...samplePayload, algorithm: "DES" as any })).toBe(false);
    expect(isEncryptedPayload(null)).toBe(false);
    expect(isEncryptedPayload("not-an-object")).toBe(false);
  });

  it("serialises payload into canonical storage string", () => {
    const serialized = serializeEncryptedPayload(samplePayload);
    expect(serialized).toBe("enc:v1:k-2026-01:dGVzdC1pdi0xMjM=:dGVzdC10YWctNDU2:ZW5jcnlwdGVkLXNlY3JldA==");
    expect(isEncryptedFormat(serialized)).toBe(true);
  });

  it("deserialises canonical storage string back to EncryptedPayload", () => {
    const serialized = serializeEncryptedPayload(samplePayload);
    const deserialized = deserializeEncryptedPayload(serialized);
    expect(deserialized).toEqual(samplePayload);
  });

  it("returns null for malformed storage strings", () => {
    expect(deserializeEncryptedPayload("plain-text")).toBeNull();
    expect(deserializeEncryptedPayload("enc:v2:too:few")).toBeNull();
    expect(isEncryptedFormat("plain-text")).toBe(false);
  });
});
