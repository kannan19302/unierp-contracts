#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const contracts = require(resolve(scriptDirectory, "../dist/control-centers.js"));

const {
  CONTROL_CENTER_APPS,
  assertValidControlCenterCatalog,
  getControlCenterApp,
  getResourceKindOwner,
  validateControlCenterCatalog,
} = contracts;

function mutableCatalog() {
  return CONTROL_CENTER_APPS.map((app) => ({
    ...app,
    authorityPlatforms: [...app.authorityPlatforms],
    dependencies: [...app.dependencies],
    resourceKinds: [...app.resourceKinds],
    eventFamilies: [...app.eventFamilies],
    primaryRepositories: [...app.primaryRepositories],
  }));
}

assertValidControlCenterCatalog();
assert.equal(CONTROL_CENTER_APPS.filter((app) => app.center === "PCC").length, 22);
assert.equal(CONTROL_CENTER_APPS.filter((app) => app.center === "OCC").length, 22);
assert.equal(new Set(CONTROL_CENTER_APPS.flatMap((app) => app.resourceKinds)).size,
  CONTROL_CENTER_APPS.flatMap((app) => app.resourceKinds).length);
assert.equal(getControlCenterApp("PCC-18").name, "Tenant & Customer Lifecycle");
assert.equal(getResourceKindOwner("organization-account")?.id, "PCC-18");
assert.equal(getResourceKindOwner("organization-ai-agent")?.id, "OCC-21");
assert.equal(getResourceKindOwner("not-a-resource"), undefined);

{
  const candidate = mutableCatalog().slice(0, -1);
  const result = validateControlCenterCatalog(candidate);
  assert.equal(result.valid, false, "a missing application must fail validation");
  assert(result.errors.some((error) => error.includes("OCC must declare exactly 22")));
}

{
  const candidate = mutableCatalog();
  candidate[1].resourceKinds.push(candidate[0].resourceKinds[0]);
  const result = validateControlCenterCatalog(candidate);
  assert.equal(result.valid, false, "duplicate resource ownership must fail validation");
  assert(result.errors.some((error) => error.includes("resource kind has more than one owning application")));
}

{
  const candidate = mutableCatalog();
  candidate[0].dependencies.push("PCC-99");
  const result = validateControlCenterCatalog(candidate);
  assert.equal(result.valid, false, "an unknown dependency must fail validation");
  assert(result.errors.some((error) => error.includes("depends on unknown app PCC-99")));
}

{
  const candidate = mutableCatalog();
  candidate[0].experienceOwner = "PLT-TAD";
  const result = validateControlCenterCatalog(candidate);
  assert.equal(result.valid, false, "a trust-boundary owner mismatch must fail validation");
  assert(result.errors.some((error) => error.includes("must be experience-owned by PLT-PAO")));
}

console.log(
  `PCC/OCC catalog verified: ${CONTROL_CENTER_APPS.length} applications, ` +
  `${CONTROL_CENTER_APPS.flatMap((app) => app.resourceKinds).length} uniquely owned resource kinds, ` +
  `${CONTROL_CENTER_APPS.flatMap((app) => app.eventFamilies).length} uniquely owned event families.`,
);
