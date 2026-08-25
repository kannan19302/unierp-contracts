import {
  CONTROL_CENTER_APPS,
  type ControlCenter,
  type ControlCenterAppId,
  type ControlCenterResourceKind,
} from "./control-centers.js";

export type ControlCenterAppAvailability = "ACTIVE" | "PREVIEW" | "PLANNED" | "RETIRED";
export type ControlCenterPermissionMode = "CANONICAL" | "LEGACY_MIGRATION";
export type ControlCenterClientChannel = "WEB" | "MOBILE" | "DESKTOP";

export interface ControlCenterNavigationNode {
  key: string;
  label: string;
  path: `/${string}`;
  permission?: string;
  resourceKind?: ControlCenterResourceKind;
  description?: string;
  children?: readonly ControlCenterNavigationNode[];
}

export interface ControlCenterLifecycleHooks {
  onInstall?: string;
  onUpgrade?: string;
  onSuspend?: string;
  onRemove?: string;
}

export interface ControlCenterAppManifest {
  appId: ControlCenterAppId;
  center: ControlCenter;
  iconKey: string;
  entryPath: `/${string}`;
  availability: ControlCenterAppAvailability;
  permissionMode: ControlCenterPermissionMode;
  /** Canonical root permission for entering the application. */
  requiredPermission: string;
  /** Mandatory while old permission names are accepted. */
  legacyPermissionMigration?: string;
  navigation: readonly ControlCenterNavigationNode[];
  searchKeywords: readonly string[];
  declaredResourceKinds: readonly ControlCenterResourceKind[];
  lifecycleHooks?: ControlCenterLifecycleHooks;
  entitlement?: string;
  helpTopic: string;
  telemetryNamespace: string;
  channels: readonly ControlCenterClientChannel[];
}

export interface ControlCenterManifestValidationResult {
  valid: boolean;
  errors: string[];
}

function flattenNavigation(nodes: readonly ControlCenterNavigationNode[]): ControlCenterNavigationNode[] {
  return nodes.flatMap((node) => [node, ...flattenNavigation(node.children ?? [])]);
}

function duplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

export function validateControlCenterManifest(
  manifest: ControlCenterAppManifest,
): ControlCenterManifestValidationResult {
  const errors: string[] = [];
  const app = CONTROL_CENTER_APPS.find((candidate) => candidate.id === manifest.appId);
  if (!app) return { valid: false, errors: [`unknown application ${manifest.appId}`] };

  if (manifest.center !== app.center) errors.push(`${manifest.appId} must declare center ${app.center}`);
  if (!manifest.iconKey.trim()) errors.push(`${manifest.appId} iconKey is required`);
  if (!manifest.entryPath.startsWith("/")) errors.push(`${manifest.appId} entryPath must be absolute`);
  if (!manifest.requiredPermission.startsWith(`${app.permissionNamespace}.`)) {
    errors.push(`${manifest.appId} requiredPermission must be inside ${app.permissionNamespace}`);
  }
  if (manifest.permissionMode === "LEGACY_MIGRATION" && !manifest.legacyPermissionMigration?.trim()) {
    errors.push(`${manifest.appId} must name its legacy permission migration`);
  }
  if (manifest.permissionMode === "CANONICAL" && manifest.legacyPermissionMigration) {
    errors.push(`${manifest.appId} cannot retain a legacy permission migration in CANONICAL mode`);
  }
  if (manifest.availability === "ACTIVE" && manifest.navigation.length === 0) {
    errors.push(`${manifest.appId} is ACTIVE but declares no navigation`);
  }
  if (manifest.availability === "RETIRED" && manifest.navigation.length > 0) {
    errors.push(`${manifest.appId} is RETIRED but still declares navigation`);
  }
  if (!manifest.helpTopic.trim()) errors.push(`${manifest.appId} helpTopic is required`);
  if (!manifest.telemetryNamespace.startsWith(`unierp.${app.center.toLowerCase()}.`)) {
    errors.push(`${manifest.appId} telemetryNamespace must start with unierp.${app.center.toLowerCase()}.`);
  }
  if (manifest.channels.length === 0) errors.push(`${manifest.appId} declares no client channels`);
  for (const duplicate of duplicateValues(manifest.channels)) {
    errors.push(`${manifest.appId} declares duplicate channel ${duplicate}`);
  }

  const ownedResourceKinds = new Set<string>(app.resourceKinds);
  for (const resourceKind of manifest.declaredResourceKinds) {
    if (!ownedResourceKinds.has(resourceKind)) {
      errors.push(`${manifest.appId} declares resource kind owned by another app: ${resourceKind}`);
    }
  }
  for (const duplicate of duplicateValues(manifest.declaredResourceKinds)) {
    errors.push(`${manifest.appId} declares duplicate resource kind ${duplicate}`);
  }

  const nodes = flattenNavigation(manifest.navigation);
  for (const duplicate of duplicateValues(nodes.map((node) => node.key))) {
    errors.push(`${manifest.appId} has duplicate navigation key ${duplicate}`);
  }
  for (const duplicate of duplicateValues(nodes.map((node) => node.path))) {
    errors.push(`${manifest.appId} has duplicate navigation path ${duplicate}`);
  }
  for (const node of nodes) {
    if (!node.key.trim()) errors.push(`${manifest.appId} has a navigation node without a key`);
    if (!node.label.trim()) errors.push(`${manifest.appId}:${node.key} has no label`);
    if (!node.path.startsWith("/")) errors.push(`${manifest.appId}:${node.key} path must be absolute`);
    if (node.permission && manifest.permissionMode === "CANONICAL" && !node.permission.startsWith(`${app.permissionNamespace}.`)) {
      errors.push(`${manifest.appId}:${node.key} permission is outside ${app.permissionNamespace}`);
    }
    if (node.resourceKind && !ownedResourceKinds.has(node.resourceKind)) {
      errors.push(`${manifest.appId}:${node.key} uses resource kind owned by another app: ${node.resourceKind}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidControlCenterManifest(manifest: ControlCenterAppManifest): void {
  const result = validateControlCenterManifest(manifest);
  if (!result.valid) throw new Error(`Invalid ${manifest.appId} manifest:\n- ${result.errors.join("\n- ")}`);
}

export function validateControlCenterManifestSet(
  manifests: readonly ControlCenterAppManifest[],
  center: ControlCenter,
): ControlCenterManifestValidationResult {
  const errors: string[] = [];
  const centerApps = CONTROL_CENTER_APPS.filter((app) => app.center === center);
  for (const manifest of manifests) {
    const result = validateControlCenterManifest(manifest);
    errors.push(...result.errors);
    if (manifest.center !== center) errors.push(`${manifest.appId} does not belong in the ${center} manifest set`);
  }
  for (const duplicate of duplicateValues(manifests.map((manifest) => manifest.appId))) {
    errors.push(`duplicate manifest for ${duplicate}`);
  }
  const manifestIds = new Set(manifests.map((manifest) => manifest.appId));
  for (const app of centerApps) {
    if (!manifestIds.has(app.id)) errors.push(`missing ${center} manifest for ${app.id}`);
  }
  if (manifests.length !== centerApps.length) {
    errors.push(`${center} must declare ${centerApps.length} manifests; found ${manifests.length}`);
  }
  return { valid: errors.length === 0, errors };
}

export function assertValidControlCenterManifestSet(
  manifests: readonly ControlCenterAppManifest[],
  center: ControlCenter,
): void {
  const result = validateControlCenterManifestSet(manifests, center);
  if (!result.valid) throw new Error(`Invalid ${center} manifest set:\n- ${result.errors.join("\n- ")}`);
}
