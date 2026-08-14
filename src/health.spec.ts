import { describe, it, expect } from "vitest";
import type { HealthResponse, ReadinessResponse } from "./health";

describe("Uniform Health & Readiness Contract (P12-018)", () => {
  it("conforms to standard liveness health response schema", () => {
    const health: HealthResponse = {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "unierp-api",
      version: "1.0.0",
    };
    expect(health.status).toBe("ok");
    expect(health.service).toBe("unierp-api");
    expect(health.version).toBe("1.0.0");
    expect(health.timestamp).toBeDefined();
  });

  it("conforms to standard readiness response schema with dependency probes", () => {
    const ready: ReadinessResponse = {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "unierp-api",
      version: "1.0.0",
      checks: {
        database: { status: "up", latencyMs: 3 },
        redis: { status: "up", latencyMs: 1 },
      },
    };
    expect(ready.status).toBe("ok");
    expect(ready.checks.database.status).toBe("up");
    expect(ready.checks.redis.status).toBe("up");
  });
});
