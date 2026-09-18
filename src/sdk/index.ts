/**
 * @kannan19302/sdk — L1 TypeScript client SDK.
 * Generated from @kannan19302/contracts (L0). Never hand-written.
 * See PLATFORM_ARCHITECTURE.md § 7.3.
 */
import type {
  ProvisionTenantRequest,
  ProvisionTenantResponse,
  ApiResponse,
  PaginationParams,
} from "../index";

/**
 * Public rendering payloads.
 */
export interface PublicPage {
  id?: string;
  slug?: string;
  title?: string;
  blocks?: unknown[];
  sections?: unknown[];
  [key: string]: unknown;
}

export interface PublicSite {
  id?: string;
  name?: string;
  theme?: Record<string, unknown> | null;
  settings?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface PublicChatbot {
  name: string;
  config?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface PublicPageData {
  page: PublicPage;
  settings: Record<string, unknown>;
}

export interface PublicSiteData {
  site: PublicSite;
  page: PublicPage;
  chatbot: PublicChatbot | null;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

export interface SdkConfig {
  baseUrl: string;
  apiKey?: string;
  accessToken?: string;
  tenantId?: string;
  retry?: RetryOptions;
}

export class SdkHttpError extends Error {
  public readonly statusCode: number;
  public readonly responseBody: unknown;

  constructor(statusCode: number, message: string, responseBody?: unknown) {
    super(`UniERP SDK HTTP Error (${statusCode}): ${message}`);
    this.name = "SdkHttpError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export class UniERPClient {
  constructor(private readonly config: SdkConfig) {}

  public async request<T>(
    path: string,
    options?: RequestInit,
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const maxRetries = this.config.retry?.maxRetries ?? 3;
    const initialDelay = this.config.retry?.initialDelayMs ?? 100;

    try {
      const res = await fetch(`${this.config.baseUrl}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(this.config.accessToken
            ? { Authorization: `Bearer ${this.config.accessToken}` }
            : {}),
          ...(this.config.apiKey ? { "X-Api-Key": this.config.apiKey } : {}),
          ...(this.config.tenantId ? { "X-Tenant-Id": this.config.tenantId } : {}),
          ...options?.headers,
        },
      });

      if (!res.ok) {
        if ((res.status === 429 || res.status >= 500) && retryCount < maxRetries) {
          const delay = initialDelay * Math.pow(2, retryCount);
          await new Promise((r) => setTimeout(r, delay));
          return this.request<T>(path, options, retryCount + 1);
        }

        let errBody: unknown;
        try {
          errBody = await res.json();
        } catch {
          errBody = await res.text();
        }
        throw new SdkHttpError(res.status, res.statusText || `Request failed with status ${res.status}`, errBody);
      }

      return (await res.json()) as ApiResponse<T>;
    } catch (error) {
      if (error instanceof SdkHttpError) {
        throw error;
      }
      if (retryCount < maxRetries) {
        const delay = initialDelay * Math.pow(2, retryCount);
        await new Promise((r) => setTimeout(r, delay));
        return this.request<T>(path, options, retryCount + 1);
      }
      throw error;
    }
  }

  // Platform (control-plane) endpoints
  platform = {
    provisionTenant: (data: ProvisionTenantRequest) =>
      this.request<ProvisionTenantResponse>("/api/platform/v1/tenants", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  };

  // Public endpoints for website rendering
  public = {
    getPage: (slug: string) =>
      this.request<PublicPageData>(`/api/v1/public/pages/${slug}`, {
        method: "GET",
      }),
    getSitePage: (host: string, path: string) =>
      this.request<PublicSiteData>(
        `/api/v1/public/sites/${host}/pages?path=${encodeURIComponent(path)}`,
        { method: "GET" },
      ),
    listPages: (params?: PaginationParams) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      if (params?.cursor) qs.set("cursor", params.cursor);
      const query = qs.toString() ? `?${qs.toString()}` : "";
      return this.request<PublicPageData[]>(`/api/v1/public/pages${query}`, { method: "GET" });
    },
  };
}
