import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertSdkApiCompatibility,
  UnsupportedApiVersionError,
  CANONICAL_SDK_SUPPORT_MATRIX,
} from "./sdk-compatibility.ts";

describe("SDK versioning and compatibility", () => {
  it("passes when SDK version supports target API version", () => {
    const res = assertSdkApiCompatibility("1.0.x", "v1", CANONICAL_SDK_SUPPORT_MATRIX);
    assert.equal(res.compatible, true);
    assert.equal(res.targetApiVersion, "v1");
  });

  it("fails clearly with UnsupportedApiVersionError when used against an unsupported API version", () => {
    assert.throws(
      () => assertSdkApiCompatibility("1.0.x", "v99", CANONICAL_SDK_SUPPORT_MATRIX),
      (err: any) => {
        return (
          err instanceof UnsupportedApiVersionError &&
          err.sdkVersion === "1.0.x" &&
          err.targetApiVersion === "v99" &&
          err.message.includes("Unsupported API Version")
        );
      }
    );
  });
});
