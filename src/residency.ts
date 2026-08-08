/**
 * Data residency enforcement contracts — Phase A26 (G-3).
 * Enforces tenant data residency constraints at the data layer boundary.
 */

export class ResidencyViolationError extends Error {
  constructor(tenantId: string, tenantRegion: string, targetRegion: string) {
    super(
      `Data residency violation: Tenant "${tenantId}" is pinned to region "${tenantRegion}", ` +
        `cannot write data to target region "${targetRegion}". (G-3 / Phase A26)`,
    );
    this.name = "ResidencyViolationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function assertTenantResidency(
  tenantId: string,
  tenantRegion: string,
  targetRegion: string,
): void {
  if (!tenantRegion || !targetRegion) return;
  if (tenantRegion.toLowerCase() !== targetRegion.toLowerCase()) {
    throw new ResidencyViolationError(tenantId, tenantRegion, targetRegion);
  }
}
