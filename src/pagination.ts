/**
 * @file pagination.ts
 * @description Canonical Pagination, Filtering, and Sorting Contracts for UniERP List Endpoints.
 * Phase P12-065: Pagination, filtering and sorting conventions.
 *
 * Exit criterion:
 *   "One convention across every list endpoint.
 *    An endpoint deviating from the convention fails a gate"
 */

export interface SortParameter {
  field: string;
  order: "ASC" | "DESC";
}

export type FilterOperator =
  | "EQ"
  | "NEQ"
  | "GT"
  | "GTE"
  | "LT"
  | "LTE"
  | "LIKE"
  | "ILIKE"
  | "IN"
  | "NOT_IN"
  | "BETWEEN"
  | "IS_NULL"
  | "IS_NOT_NULL";

export interface FilterParameter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface StandardListQuery {
  page?: number;
  limit?: number; // Maximum 100 enforced across platform
  cursor?: string;
  sortBy?: SortParameter[];
  filters?: FilterParameter[];
  search?: string;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

export interface PaginatedListResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export class OffConventionPaginationError extends Error {
  public readonly endpoint: string;
  public readonly violation: string;

  constructor(endpoint: string, violation: string) {
    super(`Endpoint "${endpoint}" deviates from canonical UniERP pagination/filter/sort convention: ${violation}`);
    this.name = "OffConventionPaginationError";
    this.endpoint = endpoint;
    this.violation = violation;
  }
}

/**
 * Validates list endpoint query parameters and payload schema against standard convention.
 */
export function assertListEndpointConvention(
  endpoint: string,
  query: StandardListQuery,
  responseSchema?: Record<string, unknown>
): { verified: true } {
  if (query.limit !== undefined && (query.limit < 1 || query.limit > 100)) {
    throw new OffConventionPaginationError(
      endpoint,
      `Limit ${query.limit} is out of allowable convention bounds (1 <= limit <= 100).`
    );
  }

  if (query.page !== undefined && query.page < 1) {
    throw new OffConventionPaginationError(
      endpoint,
      `Page index ${query.page} must be 1-indexed (page >= 1).`
    );
  }

  if (responseSchema) {
    if (!("data" in responseSchema) || !("pagination" in responseSchema)) {
      throw new OffConventionPaginationError(
        endpoint,
        `List response must encapsulate items in 'data' array and provide 'pagination' metadata object.`
      );
    }
  }

  return { verified: true };
}
