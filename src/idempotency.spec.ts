import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertMutatingEndpointIdempotency,
  MissingIdempotencySupportError,
} from "./idempotency.ts";
import type { MutatingEndpointContract } from "./idempotency.ts";

describe("Idempotency convention", () => {
  it("passes when mutating endpoint contract specifies idempotency support", () => {
    const endpoint: MutatingEndpointContract = {
      endpointId: "api.v1.payments.charge",
      method: "POST",
      path: "/api/v1/payments/charge",
      idempotency: {
        headerName: "Idempotency-Key",
        required: true,
        ttlSeconds: 86400,
      },
    };

    const res = assertMutatingEndpointIdempotency(endpoint);
    assert.equal(res.verified, true);
  });

  it("throws MissingIdempotencySupportError when mutating endpoint lacks idempotency specification", () => {
    const invalidEndpoint: any = {
      endpointId: "api.v1.payments.unsafe",
      method: "POST",
      path: "/api/v1/payments/unsafe",
      idempotency: null,
    };

    assert.throws(
      () => assertMutatingEndpointIdempotency(invalidEndpoint),
      (err: any) => {
        return (
          err instanceof MissingIdempotencySupportError &&
          err.endpointId === "api.v1.payments.unsafe" &&
          err.method === "POST"
        );
      }
    );
  });
});
