/**
 * @kannan19302/contracts — Uniform Health & Readiness Contract
 *
 * P12-018: A uniform health and readiness interface across every service.
 * Standardizes /health (liveness) and /ready (readiness with dependency probes).
 */

export type HealthStatus = "ok" | "degraded" | "down";

export type ProbeStatus = "up" | "down";

export interface DependencyProbe {
  status: ProbeStatus;
  latencyMs?: number;
  error?: string;
  critical?: boolean;
}

export interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  service: string;
  version: string;
}

export interface ReadinessResponse {
  status: HealthStatus;
  timestamp: string;
  service: string;
  version: string;
  checks: Record<string, DependencyProbe>;
}
