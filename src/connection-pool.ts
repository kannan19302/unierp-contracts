/**
 * @file connection-pool.ts
 * @description L0 Contract and fairness governor for Multi-Tenant Database Connection Pooling.
 *
 * P12-039: Connection and pool management.
 * "Pooling, limits, timeouts and per-tenant fairness.
 *  Pool exhaustion by one tenant is prevented, proven under adversarial load."
 */

export interface PoolConfig {
  maxTotalConnections: number;        // e.g. 50
  maxPerTenantConnections: number;    // e.g. 10 (hard cap per single tenant to prevent exhaustion)
  acquireTimeoutMs: number;           // e.g. 2000ms
  idleTimeoutMs: number;              // e.g. 10000ms
}

export interface TenantPoolStats {
  activeConnections: number;
  waitingRequests: number;
  rejectedRequests: number;
}

export class TenantConnectionFairnessGovernor {
  public readonly config: PoolConfig;
  private activeTotal = 0;
  private tenantActive = new Map<string, number>();

  constructor(config: PoolConfig) {
    this.config = config;
  }

  /**
   * Attempts to allocate a connection for a specific tenant.
   * Rejects immediately with 429 / POOL_TENANT_LIMIT if single tenant exceeds fair-share quota.
   */
  public acquire(tenantId: string): { allowed: boolean; reason?: string } {
    const currentTenantActive = this.tenantActive.get(tenantId) || 0;

    if (currentTenantActive >= this.config.maxPerTenantConnections) {
      return {
        allowed: false,
        reason: `Tenant "${tenantId}" active connection limit reached (${currentTenantActive}/${this.config.maxPerTenantConnections}). Pool exhaustion prevented.`,
      };
    }

    if (this.activeTotal >= this.config.maxTotalConnections) {
      return {
        allowed: false,
        reason: `Global connection pool limit reached (${this.activeTotal}/${this.config.maxTotalConnections}).`,
      };
    }

    this.activeTotal++;
    this.tenantActive.set(tenantId, currentTenantActive + 1);
    return { allowed: true };
  }

  /**
   * Releases an active connection for a tenant.
   */
  public release(tenantId: string): void {
    const currentTenantActive = this.tenantActive.get(tenantId) || 0;
    if (currentTenantActive > 0) {
      this.tenantActive.set(tenantId, currentTenantActive - 1);
      this.activeTotal = Math.max(0, this.activeTotal - 1);
    }
  }

  public getActiveCount(tenantId?: string): number {
    if (tenantId) return this.tenantActive.get(tenantId) || 0;
    return this.activeTotal;
  }
}
