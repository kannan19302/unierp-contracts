#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const {
  assertControlCenterContractCompatibility,
  assertValidControlCenterContractRelease,
  classifyControlCenterContractChanges,
  validateControlCenterContractRelease,
} = require(resolve(scriptDirectory, "../dist/control-center-contract-release.js"));

const release = {
  releaseId: "control-centers-1.0.0",
  version: "1.0.0",
  sourceContractHash: "catalog-fixture-1",
  endpoints: [
    {
      ownerAppId: "PCC-18",
      operationId: "pcc-18.listOrganizations",
      version: 1,
      method: "GET",
      path: "/platform/v1/organizations",
      permission: "pcc.organizations.organization.read",
      scope: "PROVIDER",
      idempotency: "NOT_APPLICABLE",
      parameters: [],
      responses: [{ statusCode: 200, description: "Organizations" }],
    },
    {
      ownerAppId: "PCC-18",
      operationId: "pcc-18.createOrganization",
      version: 1,
      method: "POST",
      path: "/platform/v1/organizations",
      permission: "pcc.organizations.organization.create",
      scope: "PROVIDER",
      idempotency: "REQUIRED",
      auditEventType: "pcc.organizations.organization.create.requested",
      parameters: [{ name: "body", in: "body", required: true }],
      responses: [{ statusCode: 202, description: "Provisioning operation accepted" }],
    },
    {
      ownerAppId: "OCC-01",
      operationId: "occ-01.getOrganizationProfile",
      version: 1,
      method: "GET",
      path: "/api/v1/organization/profile",
      permission: "occ.organization.profile.read",
      scope: "ORGANIZATION",
      idempotency: "NOT_APPLICABLE",
      parameters: [],
      responses: [{ statusCode: 200, description: "Organization profile" }],
    },
  ],
  events: [
    {
      ownerAppId: "PCC-18",
      eventType: "pcc.organizations.organization.provisioned",
      version: 1,
      description: "Organization provisioning completed",
      compatibility: "BACKWARD",
      requiredFields: ["organizationId", "operationId"],
      fieldTypes: { organizationId: "string", operationId: "string" },
    },
  ],
  consumers: [
    {
      consumerId: "provider-admin-os",
      ownerAppIds: ["PCC-18"],
      operationIds: ["pcc-18.listOrganizations", "pcc-18.createOrganization"],
      eventTypes: ["pcc.organizations.organization.provisioned"],
    },
    {
      consumerId: "tenant-admin",
      ownerAppIds: ["OCC-01"],
      operationIds: ["occ-01.getOrganizationProfile"],
      eventTypes: [],
    },
  ],
  generatedClients: [
    {
      consumerId: "provider-admin-os",
      language: "TYPESCRIPT",
      sourceContractHash: "catalog-fixture-1",
      generatedFileHashes: { "provider-admin-os.ts": "abc123" },
    },
    {
      consumerId: "tenant-admin",
      language: "TYPESCRIPT",
      sourceContractHash: "catalog-fixture-1",
      generatedFileHashes: { "tenant-admin.ts": "def456" },
    },
  ],
};

assertValidControlCenterContractRelease(release);

{
  const candidate = structuredClone(release);
  candidate.endpoints.push({
    ...candidate.endpoints[0],
    operationId: "pcc-18.getOrganization",
    path: "/platform/v1/organizations/:organizationId",
  });
  const result = classifyControlCenterContractChanges(release, candidate);
  assert.equal(result.classification, "COMPATIBLE");
  assert(result.compatibleChanges.some((change) => change.includes("pcc-18.getOrganization")));
  assert.doesNotThrow(() => assertControlCenterContractCompatibility(release, candidate));
}

{
  const candidate = structuredClone(release);
  candidate.endpoints = candidate.endpoints.filter((endpoint) => endpoint.operationId !== "pcc-18.listOrganizations");
  candidate.consumers[0].operationIds = candidate.consumers[0].operationIds.filter((id) => id !== "pcc-18.listOrganizations");
  const result = classifyControlCenterContractChanges(release, candidate);
  assert.equal(result.classification, "BREAKING");
  assert(result.breakingChanges.some((change) => change.includes("Endpoint removed")));
  assert.throws(() => assertControlCenterContractCompatibility(release, candidate));
}

{
  const candidate = structuredClone(release);
  candidate.events[0].requiredFields = ["organizationId"];
  delete candidate.events[0].fieldTypes.operationId;
  const result = classifyControlCenterContractChanges(release, candidate);
  assert.equal(result.classification, "BREAKING");
  assert(result.eventBreakingChanges.some((change) => change.includes("mutated")));
}

{
  const candidate = structuredClone(release);
  candidate.generatedClients = candidate.generatedClients.filter((client) => client.consumerId !== "tenant-admin");
  const result = validateControlCenterContractRelease(candidate);
  assert.equal(result.valid, false);
  assert(result.errors.some((error) => error.includes("tenant-admin has expectations but no generated client")));
}

{
  const candidate = structuredClone(release);
  candidate.endpoints[1].scope = "ORGANIZATION";
  candidate.endpoints[1].idempotency = "NOT_APPLICABLE";
  candidate.endpoints[1].auditEventType = undefined;
  const result = validateControlCenterContractRelease(candidate);
  assert.equal(result.valid, false);
  assert(result.errors.some((error) => error.includes("must use PROVIDER scope")));
  assert(result.errors.some((error) => error.includes("must declare idempotency")));
  assert(result.errors.some((error) => error.includes("must declare an audit event")));
}

console.log(
  `Control-center contract release harness verified: ${release.endpoints.length} endpoint fixtures, ` +
  `${release.events.length} event fixture, ${release.consumers.length} consumers, and seeded failure cases.`,
);
