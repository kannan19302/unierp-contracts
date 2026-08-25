import {
  classifyContractChanges,
  type CanonicalEndpointContract,
  type ChangeClassificationResult,
} from "./contract-compatibility.js";
import type { EventSchemaDefinition } from "./events/schema-registry.js";
import {
  CONTROL_CENTER_APPS,
  type ControlCenterAppId,
} from "./control-centers.js";

export type ControlCenterContractScope = "PROVIDER" | "ORGANIZATION";

export interface ControlCenterEndpointContract extends CanonicalEndpointContract {
  ownerAppId: ControlCenterAppId;
  version: number;
  permission: string;
  scope: ControlCenterContractScope;
  /** Required for retry-safe state changes; GET/HEAD use NOT_APPLICABLE. */
  idempotency: "REQUIRED" | "SUPPORTED" | "NOT_APPLICABLE";
  /** Required for state changes and privileged reads. */
  auditEventType?: string;
}

export interface ControlCenterEventContract extends EventSchemaDefinition {
  ownerAppId: ControlCenterAppId;
}

export interface ControlCenterConsumerExpectation {
  consumerId: string;
  ownerAppIds: readonly ControlCenterAppId[];
  operationIds: readonly string[];
  eventTypes: readonly string[];
}

export type GeneratedClientLanguage = "TYPESCRIPT" | "DART" | "JAVA" | "PYTHON" | "GO";

export interface ControlCenterGeneratedClient {
  consumerId: string;
  language: GeneratedClientLanguage;
  /** Hash of the canonical release input used by the generator. */
  sourceContractHash: string;
  generatedFileHashes: Readonly<Record<string, string>>;
}

export interface ControlCenterContractRelease {
  releaseId: string;
  version: string;
  sourceContractHash: string;
  endpoints: readonly ControlCenterEndpointContract[];
  events: readonly ControlCenterEventContract[];
  consumers: readonly ControlCenterConsumerExpectation[];
  generatedClients: readonly ControlCenterGeneratedClient[];
}

export interface ControlCenterContractReleaseValidation {
  valid: boolean;
  errors: string[];
}

export interface ControlCenterContractChangeClassification extends ChangeClassificationResult {
  eventBreakingChanges: string[];
  eventCompatibleChanges: string[];
  controlPlaneBreakingChanges: string[];
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const found = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) found.add(value);
    seen.add(value);
  }
  return [...found].sort();
}

function stableEventShape(event: ControlCenterEventContract): string {
  return JSON.stringify({
    compatibility: event.compatibility,
    requiredFields: [...event.requiredFields].sort(),
    fieldTypes: Object.fromEntries(Object.entries(event.fieldTypes).sort(([left], [right]) => left.localeCompare(right))),
  });
}

export function validateControlCenterContractRelease(
  release: ControlCenterContractRelease,
): ControlCenterContractReleaseValidation {
  const errors: string[] = [];
  const appById = new Map(CONTROL_CENTER_APPS.map((app) => [app.id, app]));
  const endpointsById = new Map(release.endpoints.map((endpoint) => [endpoint.operationId, endpoint]));
  const eventsByType = new Map<string, ControlCenterEventContract[]>();
  const consumersById = new Map(release.consumers.map((consumer) => [consumer.consumerId, consumer]));

  if (!release.releaseId.trim()) errors.push("releaseId is required");
  if (!/^\d+\.\d+\.\d+$/.test(release.version)) errors.push(`release version must be semver: ${release.version}`);
  if (!release.sourceContractHash.trim()) errors.push("sourceContractHash is required");

  for (const duplicate of duplicates(release.endpoints.map((endpoint) => endpoint.operationId))) {
    errors.push(`duplicate endpoint operationId: ${duplicate}`);
  }
  for (const duplicate of duplicates(release.consumers.map((consumer) => consumer.consumerId))) {
    errors.push(`duplicate consumerId: ${duplicate}`);
  }
  for (const duplicate of duplicates(release.generatedClients.map((client) => `${client.consumerId}:${client.language}`))) {
    errors.push(`duplicate generated client target: ${duplicate}`);
  }
  for (const duplicate of duplicates(release.events.map((event) => `${event.eventType}@v${event.version}`))) {
    errors.push(`duplicate event schema version: ${duplicate}`);
  }

  for (const endpoint of release.endpoints) {
    const app = appById.get(endpoint.ownerAppId);
    if (!app) {
      errors.push(`${endpoint.operationId} has unknown owner ${endpoint.ownerAppId}`);
      continue;
    }
    const method = endpoint.method.toUpperCase();
    if (!endpoint.operationId.startsWith(`${endpoint.ownerAppId.toLowerCase()}.`)) {
      errors.push(`${endpoint.operationId} must start with ${endpoint.ownerAppId.toLowerCase()}.`);
    }
    if (!endpoint.permission.startsWith(`${app.permissionNamespace}.`)) {
      errors.push(`${endpoint.operationId} permission must be inside ${app.permissionNamespace}`);
    }
    const expectedScope: ControlCenterContractScope = app.center === "PCC" ? "PROVIDER" : "ORGANIZATION";
    if (endpoint.scope !== expectedScope) {
      errors.push(`${endpoint.operationId} must use ${expectedScope} scope`);
    }
    const expectedPathPrefix = app.center === "PCC" ? "/platform/v1/" : "/api/v1/";
    if (!endpoint.path.startsWith(expectedPathPrefix)) {
      errors.push(`${endpoint.operationId} path must start with ${expectedPathPrefix}`);
    }
    if (MUTATING_METHODS.has(method)) {
      if (endpoint.idempotency === "NOT_APPLICABLE") {
        errors.push(`${endpoint.operationId} is mutating and must declare idempotency`);
      }
      if (!endpoint.auditEventType) {
        errors.push(`${endpoint.operationId} is mutating and must declare an audit event`);
      }
    } else if (endpoint.idempotency !== "NOT_APPLICABLE") {
      errors.push(`${endpoint.operationId} is read-only and must use NOT_APPLICABLE idempotency`);
    }
    if (endpoint.version < 1 || !Number.isInteger(endpoint.version)) {
      errors.push(`${endpoint.operationId} version must be a positive integer`);
    }
    if (endpoint.responses.length === 0) errors.push(`${endpoint.operationId} declares no responses`);
  }

  for (const event of release.events) {
    const app = appById.get(event.ownerAppId);
    if (!app) {
      errors.push(`${event.eventType} has unknown owner ${event.ownerAppId}`);
      continue;
    }
    const ownsFamily = app.eventFamilies.some(
      (family) => event.eventType === family || event.eventType.startsWith(`${family}.`),
    );
    if (!ownsFamily) errors.push(`${event.eventType} is outside ${event.ownerAppId}'s event families`);
    if (event.version < 1 || !Number.isInteger(event.version)) {
      errors.push(`${event.eventType} version must be a positive integer`);
    }
    if (event.requiredFields.length === 0) errors.push(`${event.eventType} declares no required fields`);
    for (const field of event.requiredFields) {
      if (!event.fieldTypes[field]) errors.push(`${event.eventType} required field ${field} has no declared type`);
    }
    const versions = eventsByType.get(event.eventType) ?? [];
    versions.push(event);
    eventsByType.set(event.eventType, versions);
  }

  for (const [eventType, versions] of eventsByType) {
    const actual = versions.map((event) => event.version).sort((left, right) => left - right);
    const expected = Array.from({ length: actual[actual.length - 1] ?? 0 }, (_, index) => index + 1);
    if (actual.join(",") !== expected.join(",")) {
      errors.push(`${eventType} versions must be contiguous from 1; found ${actual.join(",")}`);
    }
  }

  for (const consumer of release.consumers) {
    if (!consumer.consumerId.trim()) errors.push("consumerId is required");
    if (consumer.ownerAppIds.length === 0) errors.push(`${consumer.consumerId} declares no consuming apps`);
    for (const appId of consumer.ownerAppIds) {
      if (!appById.has(appId)) errors.push(`${consumer.consumerId} references unknown app ${appId}`);
    }
    for (const operationId of consumer.operationIds) {
      if (!endpointsById.has(operationId)) errors.push(`${consumer.consumerId} expects missing operation ${operationId}`);
    }
    for (const eventType of consumer.eventTypes) {
      if (!eventsByType.has(eventType)) errors.push(`${consumer.consumerId} expects missing event ${eventType}`);
    }
    if (consumer.operationIds.length === 0 && consumer.eventTypes.length === 0) {
      errors.push(`${consumer.consumerId} has no contract expectations`);
    }
  }

  for (const client of release.generatedClients) {
    if (!consumersById.has(client.consumerId)) errors.push(`generated client has unknown consumer ${client.consumerId}`);
    if (client.sourceContractHash !== release.sourceContractHash) {
      errors.push(`${client.consumerId}:${client.language} was generated from a different contract hash`);
    }
    if (Object.keys(client.generatedFileHashes).length === 0) {
      errors.push(`${client.consumerId}:${client.language} has no generated files`);
    }
  }

  for (const consumer of release.consumers) {
    if (!release.generatedClients.some((client) => client.consumerId === consumer.consumerId)) {
      errors.push(`${consumer.consumerId} has expectations but no generated client`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidControlCenterContractRelease(release: ControlCenterContractRelease): void {
  const validation = validateControlCenterContractRelease(release);
  if (!validation.valid) {
    throw new Error(`Invalid control-center contract release:\n- ${validation.errors.join("\n- ")}`);
  }
}

export function classifyControlCenterContractChanges(
  baseline: ControlCenterContractRelease,
  candidate: ControlCenterContractRelease,
): ControlCenterContractChangeClassification {
  const endpointResult = classifyContractChanges([...baseline.endpoints], [...candidate.endpoints]);
  const eventBreakingChanges: string[] = [];
  const eventCompatibleChanges: string[] = [];
  const controlPlaneBreakingChanges: string[] = [];
  const candidateEvents = new Map(candidate.events.map((event) => [`${event.eventType}@v${event.version}`, event]));
  const baselineEvents = new Map(baseline.events.map((event) => [`${event.eventType}@v${event.version}`, event]));
  const candidateEndpoints = new Map(candidate.endpoints.map((endpoint) => [endpoint.operationId, endpoint]));

  for (const [key, event] of baselineEvents) {
    const proposed = candidateEvents.get(key);
    if (!proposed) eventBreakingChanges.push(`Event schema removed: ${key}`);
    else if (stableEventShape(event) !== stableEventShape(proposed)) {
      eventBreakingChanges.push(`Event schema version mutated: ${key}`);
    }
  }
  for (const key of candidateEvents.keys()) {
    if (!baselineEvents.has(key)) eventCompatibleChanges.push(`Event schema added: ${key}`);
  }

  for (const endpoint of baseline.endpoints) {
    const proposed = candidateEndpoints.get(endpoint.operationId);
    if (!proposed) continue;
    if (endpoint.ownerAppId !== proposed.ownerAppId) {
      controlPlaneBreakingChanges.push(`${endpoint.operationId} owner changed from ${endpoint.ownerAppId} to ${proposed.ownerAppId}`);
    }
    if (endpoint.permission !== proposed.permission) {
      controlPlaneBreakingChanges.push(`${endpoint.operationId} permission changed`);
    }
    if (endpoint.scope !== proposed.scope) {
      controlPlaneBreakingChanges.push(`${endpoint.operationId} scope changed`);
    }
    if (endpoint.idempotency !== proposed.idempotency) {
      controlPlaneBreakingChanges.push(`${endpoint.operationId} idempotency contract changed`);
    }
  }

  const breakingChanges = [
    ...endpointResult.breakingChanges,
    ...eventBreakingChanges,
    ...controlPlaneBreakingChanges,
  ];
  return {
    classification: breakingChanges.length > 0 ? "BREAKING" : "COMPATIBLE",
    breakingChanges,
    compatibleChanges: [...endpointResult.compatibleChanges, ...eventCompatibleChanges],
    eventBreakingChanges,
    eventCompatibleChanges,
    controlPlaneBreakingChanges,
  };
}

export function assertControlCenterContractCompatibility(
  baseline: ControlCenterContractRelease,
  candidate: ControlCenterContractRelease,
): void {
  assertValidControlCenterContractRelease(candidate);
  const result = classifyControlCenterContractChanges(baseline, candidate);
  if (result.classification === "BREAKING") {
    throw new Error(`Breaking control-center contract changes:\n- ${result.breakingChanges.join("\n- ")}`);
  }
}
