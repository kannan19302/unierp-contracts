import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertListEndpointConvention,
  OffConventionPaginationError,
  type StandardListQuery,
} from "./pagination.ts";

describe("Pagination, filtering and sorting conventions", () => {
  it("passes compliant list query and response format", () => {
    const query: StandardListQuery = {
      page: 1,
      limit: 50,
      sortBy: [{ field: "createdAt", order: "DESC" }],
      filters: [{ field: "status", operator: "EQ", value: "ACTIVE" }],
    };

    const response = {
      data: [{ id: "order_1" }],
      pagination: {
        page: 1,
        limit: 50,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    const res = assertListEndpointConvention("/api/v1/orders", query, response);
    assert.equal(res.verified, true);
  });

  it("throws OffConventionPaginationError when limit exceeds 100", () => {
    const invalidQuery: StandardListQuery = {
      page: 1,
      limit: 250, // exceeds ceiling
    };

    assert.throws(
      () => assertListEndpointConvention("/api/v1/orders", invalidQuery),
      (err: any) => {
        return (
          err instanceof OffConventionPaginationError &&
          err.endpoint === "/api/v1/orders" &&
          err.violation.includes("out of allowable convention bounds")
        );
      }
    );
  });

  it("throws OffConventionPaginationError when response payload deviates from standard structure", () => {
    const query: StandardListQuery = { page: 1, limit: 20 };
    const nonCompliantResponse = {
      items: [{ id: "order_1" }], // should be 'data'
      total: 1, // should be within 'pagination'
    };

    assert.throws(
      () => assertListEndpointConvention("/api/v1/orders", query, nonCompliantResponse),
      (err: any) => {
        return (
          err instanceof OffConventionPaginationError &&
          err.violation.includes("must encapsulate items in 'data' array")
        );
      }
    );
  });
});
