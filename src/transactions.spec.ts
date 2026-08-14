import { describe, it, expect } from "vitest";
import {
  OptimisticConcurrencyConflictError,
  executeWithRetry,
  DEFAULT_OCC_RETRY_POLICY,
} from "./transactions.js";

describe("Transaction and Isolation Standards (OCC Conflict Retry)", () => {
  it("resolves transient OCC conflict and succeeds on retry without lost updates", async () => {
    let attempts = 0;
    let balance = 1000;

    const result = await executeWithRetry(async (attempt) => {
      attempts = attempt;
      if (attempt === 1) {
        // Simulate concurrent conflicting update on attempt 1
        throw new OptimisticConcurrencyConflictError("Account", 1, 2);
      }
      balance -= 200;
      return balance;
    });

    expect(attempts).toBe(2);
    expect(result).toBe(800);
  });

  it("throws documented retryable error if conflict exceeds maxRetries", async () => {
    let attempts = 0;

    await expect(
      executeWithRetry(
        async (attempt) => {
          attempts = attempt;
          throw new OptimisticConcurrencyConflictError("Invoice", 5, 6);
        },
        { ...DEFAULT_OCC_RETRY_POLICY, maxRetries: 2 }
      )
    ).rejects.toThrowError(OptimisticConcurrencyConflictError);

    expect(attempts).toBe(3); // Initial attempt + 2 retries
  });

  it("propagates non-retryable fatal errors immediately", async () => {
    let attempts = 0;

    await expect(
      executeWithRetry(async (attempt) => {
        attempts = attempt;
        throw new Error("Fatal syntax error in SQL");
      })
    ).rejects.toThrow("Fatal syntax error");

    expect(attempts).toBe(1);
  });
});
