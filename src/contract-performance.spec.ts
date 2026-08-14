import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertNoWaterfallOnJourney,
  assertNoOverFetchingOnJourney,
  WaterfallDetectedError,
  OverFetchingDetectedError,
  CANONICAL_CONSUMER_JOURNEYS,
  OVER_FETCH_RATIO_THRESHOLD,
} from "./contract-performance.ts";

describe("Contract performance implications — P12-082", () => {
  const invoiceJourney = CANONICAL_CONSUMER_JOURNEYS.find(
    (j) => j.journeyId === "J001_LIST_INVOICES_WITH_TENANT"
  )!;

  const dashboardJourney = CANONICAL_CONSUMER_JOURNEYS.find(
    (j) => j.journeyId === "J004_DASHBOARD_SUMMARY"
  )!;

  describe("assertNoWaterfallOnJourney", () => {
    it("passes when call count matches exactly what the journey declares", () => {
      const result = assertNoWaterfallOnJourney(
        invoiceJourney,
        ["GET /invoices"],
        "GET /invoices"
      );
      assert.equal(result.verified, true);
      assert.equal(result.journeyId, "J001_LIST_INVOICES_WITH_TENANT");
      assert.equal(result.callCount, 1);
    });

    it("passes when journey allows a single call and only one is made", () => {
      const result = assertNoWaterfallOnJourney(
        dashboardJourney,
        ["GET /dashboard/summary"],
        "GET /dashboard/summary"
      );
      assert.equal(result.verified, true);
      assert.equal(result.callCount, 1);
    });

    it("detects waterfall: 2 calls required for a single-call journey", () => {
      assert.throws(
        () =>
          assertNoWaterfallOnJourney(
            invoiceJourney,
            ["GET /invoices", "GET /tenants/:id"], // requires second round-trip
            "GET /invoices"
          ),
        (err) => {
          assert.ok(err instanceof WaterfallDetectedError);
          assert.equal(err.journeyId, "J001_LIST_INVOICES_WITH_TENANT");
          assert.equal(err.callCount, 2);
          assert.ok(err.message.includes("waterfall detected"));
          return true;
        }
      );
    });

    it("detects waterfall: N+1 — 3 sequential calls forced for 1-call journey", () => {
      assert.throws(
        () =>
          assertNoWaterfallOnJourney(
            dashboardJourney,
            [
              "GET /invoices/count",
              "GET /invoices/pending",
              "GET /invoices/overdue",
            ],
            "GET /dashboard/summary"
          ),
        (err) => {
          assert.ok(err instanceof WaterfallDetectedError);
          assert.equal(err.callCount, 3);
          return true;
        }
      );
    });
  });

  describe("assertNoOverFetchingOnJourney", () => {
    it("passes when returned fields are within the threshold", () => {
      // Journey consumes 5 fields; returning 10 = ratio 2x < 3x threshold
      const result = assertNoOverFetchingOnJourney(
        invoiceJourney,
        ["id", "invoiceNumber", "amount", "status", "tenantId", "createdAt", "updatedAt", "currency", "dueDate", "notes"],
        "GET /invoices"
      );
      assert.equal(result.verified, true);
      assert.ok(result.ratio < OVER_FETCH_RATIO_THRESHOLD);
    });

    it("passes when returned fields exactly match consumed fields", () => {
      const result = assertNoOverFetchingOnJourney(
        invoiceJourney,
        ["id", "invoiceNumber", "amount", "status", "tenantId"],
        "GET /invoices"
      );
      assert.equal(result.verified, true);
      assert.equal(result.ratio, 1.0);
    });

    it("detects over-fetching: 20 fields returned but journey only uses 5 (4x ratio)", () => {
      const massiveResponseFields = Array.from({ length: 20 }, (_, i) => `field_${i}`);
      assert.throws(
        () =>
          assertNoOverFetchingOnJourney(
            invoiceJourney,
            massiveResponseFields, // 20 fields, consumer only uses 5
            "GET /invoices"
          ),
        (err) => {
          assert.ok(err instanceof OverFetchingDetectedError);
          assert.equal(err.journeyId, "J001_LIST_INVOICES_WITH_TENANT");
          assert.equal(err.returnedFieldCount, 20);
          assert.equal(err.consumedFieldCount, 5);
          assert.ok(err.overfetchRatio > OVER_FETCH_RATIO_THRESHOLD);
          assert.ok(err.message.includes("over-fetching detected"));
          return true;
        }
      );
    });

    it("handles empty field lists gracefully — both directions", () => {
      // Zero consumed fields: ratio undefined, should not throw
      const emptyJourney = { ...invoiceJourney, consumedResponseFields: [] };
      const result1 = assertNoOverFetchingOnJourney(emptyJourney, ["id", "status"], "GET /invoices");
      assert.equal(result1.verified, true);

      // Zero returned fields: also should not throw
      const result2 = assertNoOverFetchingOnJourney(invoiceJourney, [], "GET /invoices");
      assert.equal(result2.verified, true);
    });
  });

  describe("CANONICAL_CONSUMER_JOURNEYS registry", () => {
    it("covers at least 4 documented journeys", () => {
      assert.ok(
        CANONICAL_CONSUMER_JOURNEYS.length >= 4,
        `Expected ≥4 consumer journeys, got ${CANONICAL_CONSUMER_JOURNEYS.length}`
      );
    });

    it("every journey has at least one required endpoint call", () => {
      for (const j of CANONICAL_CONSUMER_JOURNEYS) {
        assert.ok(
          j.requiredEndpointCalls.length >= 1,
          `Journey ${j.journeyId} must have at least one endpoint call`
        );
      }
    });

    it("every journey has at least one consumed response field", () => {
      for (const j of CANONICAL_CONSUMER_JOURNEYS) {
        assert.ok(
          j.consumedResponseFields.length >= 1,
          `Journey ${j.journeyId} must declare at least one consumed field`
        );
      }
    });

    it("OVER_FETCH_RATIO_THRESHOLD is a sensible value (2–5x)", () => {
      assert.ok(
        OVER_FETCH_RATIO_THRESHOLD >= 2.0 && OVER_FETCH_RATIO_THRESHOLD <= 5.0,
        `Expected threshold 2–5x, got ${OVER_FETCH_RATIO_THRESHOLD}`
      );
    });
  });
});
