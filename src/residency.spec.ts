import { describe, it, expect } from 'vitest';
import { assertTenantResidency, ResidencyViolationError } from './residency.js';

describe('A26 Data Residency Enforcement', () => {
  it('allows writes when target region matches tenant pinned residency region', () => {
    expect(() => assertTenantResidency('tenant-us', 'us-east-1', 'us-east-1')).not.toThrow();
  });

  it('throws ResidencyViolationError when writing outside pinned tenant region', () => {
    expect(() => assertTenantResidency('tenant-eu', 'eu-west-1', 'us-east-1')).toThrow(
      ResidencyViolationError,
    );
  });
});
