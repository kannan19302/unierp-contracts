/**
 * @file money.ts
 * @description L0 Money value type — Decimal(19,4) amount with ISO 4217 currency.
 *
 * Enforces money discipline across all service boundaries:
 *   1. An amount without an explicit currency is invalid and does not typecheck.
 *   2. The numeric representation is exact (Decimal string / string literal), never Float.
 */

export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD"
  | "CHF"
  | "CNY"
  | "INR"
  | "SGD"
  | "HKD"
  | "NZD"
  | (string & {});

export interface Money {
  /** Exact amount represented as string to prevent binary float IEEE 754 drift */
  amount: string;
  /** ISO 4217 3-letter currency code */
  currency: CurrencyCode;
}

export function createMoney(amount: string | number, currency: CurrencyCode): Money {
  if (typeof amount === "number") {
    if (!Number.isFinite(amount)) {
      throw new Error(`Invalid non-finite number provided for Money: ${amount}`);
    }
  }
  return {
    amount: String(amount),
    currency,
  };
}
