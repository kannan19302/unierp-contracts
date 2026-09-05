/**
 * L0 HTTP contracts — Zod-compatible schema definitions for API endpoints.
 * Generated artifacts: OpenAPI 3.1, NestJS DTOs, TS/Python/Java/Go clients.
 * Zero dependencies — this file is the root of the dependency graph.
 */

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

// Common API response envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

// Tenant provisioning (control-plane)
export interface ProvisionTenantRequest {
  name: string;
  slug: string;
  plan: string;
  adminEmail: string;
}

export interface ProvisionTenantResponse {
  tenantId: string;
  adminUserId: string;
  setupToken: string;
}

export * from "./notification.js";
