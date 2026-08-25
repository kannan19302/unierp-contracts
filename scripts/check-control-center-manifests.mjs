#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { CONTROL_CENTER_APPS } = require(resolve(scriptDirectory, "../dist/control-centers.js"));
const {
  assertValidControlCenterManifestSet,
  validateControlCenterManifest,
  validateControlCenterManifestSet,
} = require(resolve(scriptDirectory, "../dist/control-center-manifest.js"));

function plannedManifest(app) {
  return {
    appId: app.id,
    center: app.center,
    iconKey: app.id.toLowerCase(),
    entryPath: app.basePath,
    availability: "PLANNED",
    permissionMode: "CANONICAL",
    requiredPermission: `${app.permissionNamespace}.access`,
    navigation: [],
    searchKeywords: [app.name],
    declaredResourceKinds: [...app.resourceKinds],
    helpTopic: `control-centers/${app.id.toLowerCase()}`,
    telemetryNamespace: `unierp.${app.center.toLowerCase()}.${app.id.slice(4)}`,
    channels: ["WEB"],
  };
}

const pcc = CONTROL_CENTER_APPS.filter((app) => app.center === "PCC").map(plannedManifest);
const occ = CONTROL_CENTER_APPS.filter((app) => app.center === "OCC").map(plannedManifest);
assertValidControlCenterManifestSet(pcc, "PCC");
assertValidControlCenterManifestSet(occ, "OCC");

{
  const candidate = structuredClone(pcc);
  candidate[1].declaredResourceKinds = [candidate[0].declaredResourceKinds[0]];
  const result = validateControlCenterManifest(candidate[1]);
  assert.equal(result.valid, false);
  assert(result.errors.some((error) => error.includes("resource kind owned by another app")));
}

{
  const candidate = structuredClone(occ).slice(0, -1);
  const result = validateControlCenterManifestSet(candidate, "OCC");
  assert.equal(result.valid, false);
  assert(result.errors.some((error) => error.includes("missing OCC manifest for OCC-22")));
}

{
  const candidate = structuredClone(pcc[0]);
  candidate.permissionMode = "LEGACY_MIGRATION";
  const result = validateControlCenterManifest(candidate);
  assert.equal(result.valid, false);
  assert(result.errors.some((error) => error.includes("must name its legacy permission migration")));
}

console.log("Control-center manifest contract verified: complete 22-app PCC and OCC sets plus seeded ownership failures.");
