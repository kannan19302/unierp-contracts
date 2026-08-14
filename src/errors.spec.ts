import { describe, it, expect } from "vitest";
import { PlatformError, EntityNotFoundError, PermissionDeniedError, ValidationDomainError } from "./errors";

describe("Platform Error Taxonomy (P12-015)", () => {
  it("carries registered error codes and transforms into RFC 7807 problem details", () => {
    const error = new PlatformError({
      code: "LEDGER_UNBALANCED_TRANSACTION",
      message: "Total debits must equal total credits in ledger entry",
      statusCode: 422,
      tenantId: "tenant-acme",
      correlationId: "corr-xyz",
      details: { debits: 100, credits: 90 },
      retryable: false,
    });

    expect(error.code).toBe("LEDGER_UNBALANCED_TRANSACTION");
    expect(error.statusCode).toBe(422);
    expect(error.tenantId).toBe("tenant-acme");

    const problemDetails = error.toProblemDetails();
    expect(problemDetails.status).toBe(422);
    expect(problemDetails.code).toBe("LEDGER_UNBALANCED_TRANSACTION");
    expect(problemDetails.tenantId).toBe("tenant-acme");
    expect(problemDetails.correlationId).toBe("corr-xyz");
    expect(problemDetails.invalidParams).toEqual({ debits: 100, credits: 90 });
  });

  it("EntityNotFoundError provides typed 404 with ENTITY_NOT_FOUND code", () => {
    const err = new EntityNotFoundError("Invoice", "inv-12345", "tenant-1");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("ENTITY_NOT_FOUND");
    expect(err.message).toContain("Invoice with id 'inv-12345' was not found");
  });

  it("PermissionDeniedError provides typed 403 with AUTH_FORBIDDEN code", () => {
    const err = new PermissionDeniedError("ledger.write", "tenant-1");
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("AUTH_FORBIDDEN");
    expect(err.message).toContain("ledger.write");
  });
});
