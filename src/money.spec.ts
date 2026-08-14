import { describe, it, expect } from "vitest";
import { createMoney, type Money } from "./money.js";

describe("Money value object", () => {
  it("creates valid money with amount and currency", () => {
    const m = createMoney("100.5000", "USD");
    expect(m.amount).toBe("100.5000");
    expect(m.currency).toBe("USD");
  });

  it("converts number amount to string", () => {
    const m = createMoney(42.5, "EUR");
    expect(m.amount).toBe("42.5");
    expect(m.currency).toBe("EUR");
  });

  it("throws on non-finite number", () => {
    expect(() => createMoney(NaN, "USD")).toThrow();
    expect(() => createMoney(Infinity, "USD")).toThrow();
  });
});
