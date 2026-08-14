import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateRuntimePayload, RuntimeContractDivergenceError } from "./runtime-validator.ts";
import type { RuntimeValidationContext } from "./runtime-validator.ts";

describe("Contract validation at runtime", () => {
  const context: RuntimeValidationContext = {
    endpoint: "POST /api/v1/payments",
    expectedSchema: {
      type: "object",
      required: ["paymentId", "amount", "currency"],
      properties: {
        paymentId: { type: "string" },
        amount: { type: "number" },
        currency: { type: "string" },
      },
    },
  };

  it("validates conforming runtime response payload", () => {
    const validPayload = {
      paymentId: "pay-999",
      amount: 450.5,
      currency: "USD",
    };

    const res = validateRuntimePayload("RESPONSE", validPayload, context);
    assert.equal(res.valid, true);
  });

  it("throws RuntimeContractDivergenceError when runtime response diverges from contract", () => {
    const divergingPayload = {
      paymentId: "pay-999",
      amount: "450.50", // string instead of number
      // missing currency
    };

    assert.throws(() => validateRuntimePayload("RESPONSE", divergingPayload, context), (err: any) => {
      return err instanceof RuntimeContractDivergenceError && err.violations.length >= 2;
    });
  });
});
