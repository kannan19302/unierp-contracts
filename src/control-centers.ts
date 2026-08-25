/**
 * Canonical PCC/OCC application and ownership catalog.
 *
 * This L0 contract names every administrative application once. Shells,
 * services, route audits, permission registries, event registries, and
 * documentation verifiers consume this catalog instead of maintaining
 * competing lists.
 */

export const CONTROL_CENTERS = ["PCC", "OCC"] as const;
export type ControlCenter = (typeof CONTROL_CENTERS)[number];

export const CONTROL_CENTER_AUTHORITY_PLATFORMS = [
  "PLT-PAO",
  "PLT-TAD",
  "PLT-IAM",
  "PLT-BIZ",
  "PLT-OPS",
  "PLT-DEV",
  "PLT-MKT",
  "PLT-DS",
  "PLT-SITE",
  "PLT-MOB",
  "PLT-DESK",
] as const;

export type ControlCenterAuthorityPlatform =
  (typeof CONTROL_CENTER_AUTHORITY_PLATFORMS)[number];

export interface ControlCenterAppDefinition {
  /** Stable application ID. IDs are never reused. */
  id: `${ControlCenter}-${number}`;
  center: ControlCenter;
  sequence: number;
  name: string;
  /** Stable target route; legacy routes are inventoried by the workspace gate. */
  basePath: `/${string}`;
  /** Root namespace. Concrete permissions append resource.action. */
  permissionNamespace: `${Lowercase<ControlCenter>}.${string}`;
  /** The experience platform accountable for the application. */
  experienceOwner: "PLT-PAO" | "PLT-TAD";
  /** Platforms that own authoritative mechanisms/state consumed by the app. */
  authorityPlatforms: readonly ControlCenterAuthorityPlatform[];
  /** Direct app-to-app dependencies. Shared L0/L1 services are implicit. */
  dependencies: readonly `${ControlCenter}-${number}`[];
  /** Canonical resource-kind names. Each kind has exactly one app owner. */
  resourceKinds: readonly string[];
  /** Event namespace roots emitted by this application's owned services. */
  eventFamilies: readonly string[];
  /** Starting implementation repositories, not an authority grant. */
  primaryRepositories: readonly string[];
  /** True for applications added after the original 17 PCC / 20 OCC scope. */
  addedAfterInitialScope?: true;
}

function defineApp<const T extends ControlCenterAppDefinition>(definition: T): T {
  return definition;
}

export const CONTROL_CENTER_APPS = [
  defineApp({
    id: "PCC-01", center: "PCC", sequence: 1, name: "Platform Operations Center",
    basePath: "/operations", permissionNamespace: "pcc.operations", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-OPS"], dependencies: [],
    resourceKinds: ["platform-service", "provider-incident", "platform-change", "platform-release", "maintenance-window", "runbook-execution", "platform-job", "platform-queue"],
    eventFamilies: ["pcc.operations"], primaryRepositories: ["provider-admin-os", "api", "data", "infra", "kernel"],
  }),
  defineApp({
    id: "PCC-02", center: "PCC", sequence: 2, name: "Platform Security Center",
    basePath: "/security-center", permissionNamespace: "pcc.security", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-IAM", "PLT-OPS"], dependencies: ["PCC-01", "PCC-07", "PCC-09", "PCC-10"],
    resourceKinds: ["provider-security-policy", "platform-vulnerability", "security-exception", "privileged-access-review", "break-glass-activation", "encryption-posture"],
    eventFamilies: ["pcc.security"], primaryRepositories: ["provider-admin-os", "api", "idp", "data"],
  }),
  defineApp({
    id: "PCC-03", center: "PCC", sequence: 3, name: "Organization Identity Governance",
    basePath: "/identity-governance", permissionNamespace: "pcc.identity-governance", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-IAM"], dependencies: ["PCC-18"],
    resourceKinds: ["provider-workforce-member", "provider-role", "provider-access-package", "provider-access-review", "provider-service-principal", "support-access-delegation"],
    eventFamilies: ["pcc.identity-governance"], primaryRepositories: ["provider-admin-os", "idp", "auth", "api", "data"],
  }),
  defineApp({
    id: "PCC-04", center: "PCC", sequence: 4, name: "Subscription Operations",
    basePath: "/subscription-operations", permissionNamespace: "pcc.subscriptions", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-BIZ"], dependencies: ["PCC-18"],
    resourceKinds: ["commercial-plan", "commercial-offer", "customer-subscription", "subscription-amendment", "subscription-renewal", "subscription-migration", "commercial-contract"],
    eventFamilies: ["pcc.subscriptions"], primaryRepositories: ["provider-admin-os", "api", "data", "unierp-contracts"],
  }),
  defineApp({
    id: "PCC-05", center: "PCC", sequence: 5, name: "Entitlement & License Authority",
    basePath: "/entitlement-authority", permissionNamespace: "pcc.entitlements", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-BIZ"], dependencies: ["PCC-04"],
    resourceKinds: ["entitlement-definition", "organization-entitlement-grant", "license-pool", "license-policy", "offline-license", "entitlement-reconciliation"],
    eventFamilies: ["pcc.entitlements"], primaryRepositories: ["provider-admin-os", "api", "data", "kernel"],
  }),
  defineApp({
    id: "PCC-06", center: "PCC", sequence: 6, name: "Revenue & Billing Operations",
    basePath: "/revenue-billing", permissionNamespace: "pcc.billing", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-BIZ"], dependencies: ["PCC-04", "PCC-05"],
    resourceKinds: ["provider-billing-account", "price-book", "rated-charge", "provider-invoice", "provider-payment", "credit-note", "revenue-schedule", "marketplace-payout", "financial-reconciliation"],
    eventFamilies: ["pcc.billing"], primaryRepositories: ["provider-admin-os", "api", "data"],
  }),
  defineApp({
    id: "PCC-07", center: "PCC", sequence: 7, name: "Key & Secrets Authority",
    basePath: "/keys-secrets", permissionNamespace: "pcc.secrets", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-IAM", "PLT-OPS"], dependencies: ["PCC-01"],
    resourceKinds: ["provider-secret-reference", "cryptographic-key", "signing-key", "platform-certificate", "secret-lease", "key-ceremony"],
    eventFamilies: ["pcc.secrets"], primaryRepositories: ["provider-admin-os", "api", "idp", "infra", "data"],
  }),
  defineApp({
    id: "PCC-08", center: "PCC", sequence: 8, name: "API Traffic Control",
    basePath: "/api-traffic", permissionNamespace: "pcc.api-traffic", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-BIZ", "PLT-OPS"], dependencies: ["PCC-05", "PCC-07"],
    resourceKinds: ["api-product", "gateway-route", "gateway-policy", "traffic-rule", "meter-definition", "abuse-case", "api-deprecation"],
    eventFamilies: ["pcc.api-traffic"], primaryRepositories: ["provider-admin-os", "api", "unierp-contracts", "sdk", "data"],
  }),
  defineApp({
    id: "PCC-09", center: "PCC", sequence: 9, name: "Governance & Compliance Center",
    basePath: "/governance-compliance", permissionNamespace: "pcc.compliance", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-BIZ", "PLT-OPS"], dependencies: ["PCC-02", "PCC-07"],
    resourceKinds: ["regulatory-framework", "provider-control", "provider-evidence", "provider-audit-engagement", "provider-risk", "provider-attestation", "privacy-impact-assessment"],
    eventFamilies: ["pcc.compliance"], primaryRepositories: ["provider-admin-os", "api", "data", "kernel", "blockchain"],
  }),
  defineApp({
    id: "PCC-10", center: "PCC", sequence: 10, name: "Security Intelligence",
    basePath: "/security-intelligence", permissionNamespace: "pcc.security-intelligence", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-OPS"], dependencies: ["PCC-01", "PCC-02", "PCC-09"],
    resourceKinds: ["security-telemetry-source", "detection-rule", "security-alert", "soc-case", "threat-indicator", "threat-hunt", "containment-action"],
    eventFamilies: ["pcc.security-intelligence"], primaryRepositories: ["provider-admin-os", "api", "data", "infra"],
  }),
  defineApp({
    id: "PCC-11", center: "PCC", sequence: 11, name: "Mobile Platform Operations",
    basePath: "/mobile-operations", permissionNamespace: "pcc.mobile", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-MOB", "PLT-OPS"], dependencies: ["PCC-01", "PCC-07", "PCC-08", "PCC-13"],
    resourceKinds: ["mobile-build", "mobile-release-channel", "mobile-version-policy", "mobile-signing-profile", "mobile-store-release", "push-provider-binding"],
    eventFamilies: ["pcc.mobile"], primaryRepositories: ["provider-admin-os", "unierp-mobile", "api", "infra"],
  }),
  defineApp({
    id: "PCC-12", center: "PCC", sequence: 12, name: "Desktop Platform Operations",
    basePath: "/desktop-operations", permissionNamespace: "pcc.desktop", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-DESK", "PLT-OPS"], dependencies: ["PCC-01", "PCC-07", "PCC-08", "PCC-13"],
    resourceKinds: ["desktop-build", "desktop-release-channel", "desktop-version-policy", "desktop-signing-profile", "desktop-installer", "desktop-update-policy"],
    eventFamilies: ["pcc.desktop"], primaryRepositories: ["provider-admin-os", "desktop-app", "api", "infra"],
  }),
  defineApp({
    id: "PCC-13", center: "PCC", sequence: 13, name: "Global Platform Configuration",
    basePath: "/platform-configuration", permissionNamespace: "pcc.configuration", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-OPS"], dependencies: ["PCC-01", "PCC-07"],
    resourceKinds: ["configuration-schema", "platform-configuration-value", "configuration-template", "feature-rollout", "configuration-promotion", "configuration-drift"],
    eventFamilies: ["pcc.configuration"], primaryRepositories: ["provider-admin-os", "config", "api", "data", "infra", "unierp-contracts"],
  }),
  defineApp({
    id: "PCC-14", center: "PCC", sequence: 14, name: "Developer Ecosystem Operations",
    basePath: "/developer-ecosystem", permissionNamespace: "pcc.developer-ecosystem", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-DEV"], dependencies: ["PCC-03", "PCC-07", "PCC-08", "PCC-13"],
    resourceKinds: ["publisher-organization", "developer-program", "sdk-release", "developer-app-registration", "sandbox-allocation", "certification-run"],
    eventFamilies: ["pcc.developer-ecosystem"], primaryRepositories: ["provider-admin-os", "developer-platform", "sdk", "extension-api", "sandbox", "api"],
  }),
  defineApp({
    id: "PCC-15", center: "PCC", sequence: 15, name: "Knowledge & Adoption Operations",
    basePath: "/knowledge-adoption", permissionNamespace: "pcc.knowledge-adoption", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-BIZ", "PLT-DS"], dependencies: ["PCC-13", "PCC-14", "PCC-22"],
    resourceKinds: ["provider-knowledge-article", "learning-path", "product-certification", "onboarding-program", "adoption-campaign", "product-feedback"],
    eventFamilies: ["pcc.knowledge-adoption"], primaryRepositories: ["provider-admin-os", "api", "data", "design-system"],
  }),
  defineApp({
    id: "PCC-16", center: "PCC", sequence: 16, name: "Platform Intelligence",
    basePath: "/platform-intelligence", permissionNamespace: "pcc.intelligence", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-BIZ", "PLT-OPS"], dependencies: ["PCC-01"],
    resourceKinds: ["provider-semantic-metric", "provider-dataset", "provider-dashboard", "provider-report", "provider-forecast", "provider-anomaly"],
    eventFamilies: ["pcc.intelligence"], primaryRepositories: ["provider-admin-os", "api", "data"],
  }),
  defineApp({
    id: "PCC-17", center: "PCC", sequence: 17, name: "Marketplace Operations",
    basePath: "/marketplace-operations", permissionNamespace: "pcc.marketplace", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-MKT", "PLT-DEV"], dependencies: ["PCC-05", "PCC-06", "PCC-07", "PCC-14"],
    resourceKinds: ["marketplace-listing", "marketplace-submission", "marketplace-certification", "marketplace-version", "marketplace-review", "marketplace-recall"],
    eventFamilies: ["pcc.marketplace"], primaryRepositories: ["provider-admin-os", "marketplace", "extensions", "api", "data"],
  }),
  defineApp({
    id: "PCC-18", center: "PCC", sequence: 18, name: "Tenant & Customer Lifecycle",
    basePath: "/organizations", permissionNamespace: "pcc.organizations", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-BIZ", "PLT-OPS", "PLT-IAM"], dependencies: ["PCC-01", "PCC-19"],
    resourceKinds: ["organization-account", "customer-account", "organization-provisioning-operation", "organization-placement", "organization-migration", "organization-offboarding"],
    eventFamilies: ["pcc.organizations"], primaryRepositories: ["provider-admin-os", "api", "data", "idp", "infra"], addedAfterInitialScope: true,
  }),
  defineApp({
    id: "PCC-19", center: "PCC", sequence: 19, name: "Cloud Infrastructure & Reliability",
    basePath: "/cloud-infrastructure", permissionNamespace: "pcc.infrastructure", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-OPS"], dependencies: ["PCC-01", "PCC-07", "PCC-13"],
    resourceKinds: ["cloud-account", "platform-region", "platform-cell", "compute-resource", "network-resource", "storage-resource", "database-resource", "backup-set", "recovery-plan"],
    eventFamilies: ["pcc.infrastructure"], primaryRepositories: ["provider-admin-os", "infra", "api", "data", "config"], addedAfterInitialScope: true,
  }),
  defineApp({
    id: "PCC-20", center: "PCC", sequence: 20, name: "Integration & Connector Operations",
    basePath: "/connector-operations", permissionNamespace: "pcc.connectors", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-BIZ", "PLT-OPS"], dependencies: ["PCC-07", "PCC-08", "PCC-13"],
    resourceKinds: ["connector-definition", "connector-adapter-version", "provider-connection-account", "connector-certification", "connector-health-policy", "connector-deprecation"],
    eventFamilies: ["pcc.connectors"], primaryRepositories: ["provider-admin-os", "api", "data", "infra"], addedAfterInitialScope: true,
  }),
  defineApp({
    id: "PCC-21", center: "PCC", sequence: 21, name: "AI Platform & Model Governance",
    basePath: "/ai-platform", permissionNamespace: "pcc.ai-platform", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-BIZ", "PLT-OPS"], dependencies: ["PCC-02", "PCC-07", "PCC-08", "PCC-13"],
    resourceKinds: ["ai-provider", "ai-model", "ai-model-version", "platform-ai-policy", "ai-evaluation-standard", "ai-routing-policy", "platform-ai-incident"],
    eventFamilies: ["pcc.ai-platform"], primaryRepositories: ["provider-admin-os", "api", "data", "infra"], addedAfterInitialScope: true,
  }),
  defineApp({
    id: "PCC-22", center: "PCC", sequence: 22, name: "Support & Service Operations",
    basePath: "/service-operations", permissionNamespace: "pcc.support", experienceOwner: "PLT-PAO",
    authorityPlatforms: ["PLT-BIZ", "PLT-IAM"], dependencies: ["PCC-01", "PCC-03", "PCC-15", "PCC-18"],
    resourceKinds: ["provider-support-case", "service-request-definition", "support-sla", "support-queue", "support-diagnostic-consent", "support-quality-review"],
    eventFamilies: ["pcc.support"], primaryRepositories: ["provider-admin-os", "api", "data"], addedAfterInitialScope: true,
  }),

  defineApp({
    id: "OCC-01", center: "OCC", sequence: 1, name: "Organization Profile & Structure",
    basePath: "/organization", permissionNamespace: "occ.organization", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-BIZ"], dependencies: ["PCC-18"],
    resourceKinds: ["organization-profile", "legal-entity", "business-unit", "organization-location", "organization-position", "organization-hierarchy-version"],
    eventFamilies: ["occ.organization"], primaryRepositories: ["tenant-admin", "api", "data"],
  }),
  defineApp({
    id: "OCC-02", center: "OCC", sequence: 2, name: "Workforce Directory",
    basePath: "/workforce", permissionNamespace: "occ.workforce", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-IAM", "PLT-BIZ"], dependencies: ["OCC-01", "OCC-09"],
    resourceKinds: ["organization-workforce-member", "organization-group", "organization-team", "guest-membership", "workforce-source-binding", "workforce-import"],
    eventFamilies: ["occ.workforce"], primaryRepositories: ["tenant-admin", "api", "idp", "data"],
  }),
  defineApp({
    id: "OCC-03", center: "OCC", sequence: 3, name: "Access Governance",
    basePath: "/access-governance", permissionNamespace: "occ.access-governance", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-IAM", "PLT-BIZ"], dependencies: ["OCC-01", "OCC-02"],
    resourceKinds: ["organization-role", "permission-bundle", "access-assignment", "access-request", "organization-access-review", "separation-of-duty-rule", "jit-access-grant"],
    eventFamilies: ["occ.access-governance"], primaryRepositories: ["tenant-admin", "api", "idp", "data", "kernel"],
  }),
  defineApp({
    id: "OCC-04", center: "OCC", sequence: 4, name: "Identity & Authentication",
    basePath: "/identity-authentication", permissionNamespace: "occ.identity", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-IAM"], dependencies: ["PCC-02", "OCC-03"],
    resourceKinds: ["organization-domain-verification", "federation-configuration", "organization-mfa-policy", "organization-session-policy", "authentication-routing-rule", "trusted-device-policy"],
    eventFamilies: ["occ.identity"], primaryRepositories: ["tenant-admin", "idp", "auth", "api", "data"],
  }),
  defineApp({
    id: "OCC-05", center: "OCC", sequence: 5, name: "Business Application Control",
    basePath: "/applications", permissionNamespace: "occ.applications", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-BIZ"], dependencies: ["PCC-05", "OCC-03", "OCC-09"],
    resourceKinds: ["organization-application", "application-activation", "application-readiness", "application-role-mapping", "application-rollout"],
    eventFamilies: ["occ.applications"], primaryRepositories: ["tenant-admin", "tenant-apps", "api", "data", "framework"],
  }),
  defineApp({
    id: "OCC-06", center: "OCC", sequence: 6, name: "Plan & Subscription Management",
    basePath: "/plans-subscriptions", permissionNamespace: "occ.subscriptions", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-BIZ"], dependencies: ["PCC-04", "OCC-03"],
    resourceKinds: ["organization-subscription-view", "subscription-change-request", "subscription-quote", "renewal-decision", "subscription-contact"],
    eventFamilies: ["occ.subscriptions"], primaryRepositories: ["tenant-admin", "api", "data"],
  }),
  defineApp({
    id: "OCC-07", center: "OCC", sequence: 7, name: "Billing & Payments",
    basePath: "/billing-payments", permissionNamespace: "occ.billing", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-BIZ"], dependencies: ["PCC-06", "OCC-03"],
    resourceKinds: ["organization-billing-profile", "payment-method-token", "organization-invoice-view", "billing-dispute", "purchase-order-reference", "billing-cost-allocation"],
    eventFamilies: ["occ.billing"], primaryRepositories: ["tenant-admin", "api", "data"],
  }),
  defineApp({
    id: "OCC-08", center: "OCC", sequence: 8, name: "Consumption & Quotas",
    basePath: "/consumption-quotas", permissionNamespace: "occ.consumption", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-BIZ"], dependencies: ["PCC-05", "PCC-08", "OCC-03"],
    resourceKinds: ["organization-usage-view", "subquota-allocation", "consumption-budget", "usage-threshold", "quota-increase-request", "usage-export"],
    eventFamilies: ["occ.consumption"], primaryRepositories: ["tenant-admin", "api", "data"],
  }),
  defineApp({
    id: "OCC-09", center: "OCC", sequence: 9, name: "Organization Entitlements",
    basePath: "/organization-entitlements", permissionNamespace: "occ.entitlements", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-BIZ"], dependencies: ["PCC-05", "OCC-03"],
    resourceKinds: ["organization-entitlement-view", "license-allocation", "license-reservation", "entitlement-assignment-rule", "license-reclaim-operation"],
    eventFamilies: ["occ.entitlements"], primaryRepositories: ["tenant-admin", "api", "data"],
  }),
  defineApp({
    id: "OCC-10", center: "OCC", sequence: 10, name: "App & Extension Management",
    basePath: "/apps-extensions", permissionNamespace: "occ.extensions", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-MKT", "PLT-DEV", "PLT-BIZ"], dependencies: ["PCC-05", "PCC-17", "OCC-03", "OCC-05"],
    resourceKinds: ["organization-app-allowlist", "extension-installation", "extension-consent", "extension-upgrade-ring", "extension-configuration", "extension-uninstall-operation"],
    eventFamilies: ["occ.extensions"], primaryRepositories: ["tenant-admin", "marketplace", "api", "data", "extensions"],
  }),
  defineApp({
    id: "OCC-11", center: "OCC", sequence: 11, name: "Integration Hub",
    basePath: "/integration-hub", permissionNamespace: "occ.integrations", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-BIZ", "PLT-OPS"], dependencies: ["PCC-07", "PCC-20", "OCC-03", "OCC-15"],
    resourceKinds: ["organization-connection", "integration-mapping", "synchronization-schedule", "integration-run", "integration-dead-letter", "integration-conflict"],
    eventFamilies: ["occ.integrations"], primaryRepositories: ["tenant-admin", "api", "data", "infra"],
  }),
  defineApp({
    id: "OCC-12", center: "OCC", sequence: 12, name: "Developer & API Access",
    basePath: "/developer-api-access", permissionNamespace: "occ.developer-access", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-DEV", "PLT-IAM", "PLT-BIZ"], dependencies: ["PCC-08", "PCC-14", "OCC-03"],
    resourceKinds: ["organization-oauth-client", "organization-api-key", "organization-service-principal", "webhook-subscription", "organization-api-budget", "organization-sandbox-access"],
    eventFamilies: ["occ.developer-access"], primaryRepositories: ["tenant-admin", "developer-platform", "api", "idp", "sdk"],
  }),
  defineApp({
    id: "OCC-13", center: "OCC", sequence: 13, name: "Organization Security",
    basePath: "/organization-security", permissionNamespace: "occ.security", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-IAM", "PLT-BIZ"], dependencies: ["PCC-10", "OCC-03", "OCC-04"],
    resourceKinds: ["organization-security-posture", "organization-security-finding", "organization-security-incident", "organization-dlp-policy", "organization-security-exception", "device-risk-record"],
    eventFamilies: ["occ.security"], primaryRepositories: ["tenant-admin", "api", "idp", "data"],
  }),
  defineApp({
    id: "OCC-14", center: "OCC", sequence: 14, name: "Audit & Regulatory Controls",
    basePath: "/audit-regulatory", permissionNamespace: "occ.audit-compliance", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-BIZ"], dependencies: ["PCC-09", "OCC-03"],
    resourceKinds: ["organization-control-implementation", "organization-evidence", "organization-audit-engagement", "organization-risk", "organization-attestation", "organization-legal-hold"],
    eventFamilies: ["occ.audit-compliance"], primaryRepositories: ["tenant-admin", "api", "data", "kernel"],
  }),
  defineApp({
    id: "OCC-15", center: "OCC", sequence: 15, name: "Data Lifecycle Management",
    basePath: "/data-lifecycle", permissionNamespace: "occ.data-lifecycle", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-BIZ", "PLT-OPS"], dependencies: ["PCC-19", "OCC-03", "OCC-14"],
    resourceKinds: ["organization-data-classification", "retention-schedule", "data-export-request", "data-erasure-request", "restore-request", "recycle-record", "data-quality-issue"],
    eventFamilies: ["occ.data-lifecycle"], primaryRepositories: ["tenant-admin", "api", "data", "infra"],
  }),
  defineApp({
    id: "OCC-16", center: "OCC", sequence: 16, name: "Domain & Communication Services",
    basePath: "/domains-communications", permissionNamespace: "occ.communications", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-BIZ", "PLT-OPS"], dependencies: ["PCC-07", "PCC-20", "OCC-03"],
    resourceKinds: ["organization-domain", "sender-identity", "communication-provider-binding", "shared-communication-template", "communication-consent", "communication-suppression"],
    eventFamilies: ["occ.communications"], primaryRepositories: ["tenant-admin", "api", "data", "infra"],
  }),
  defineApp({
    id: "OCC-17", center: "OCC", sequence: 17, name: "Automation Operations",
    basePath: "/automation-operations", permissionNamespace: "occ.automations", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-BIZ"], dependencies: ["OCC-03", "OCC-11"],
    resourceKinds: ["automation-definition", "automation-version", "automation-run", "human-task", "automation-schedule", "automation-dead-letter", "automation-template"],
    eventFamilies: ["occ.automations"], primaryRepositories: ["tenant-admin", "api", "data", "kernel"],
  }),
  defineApp({
    id: "OCC-18", center: "OCC", sequence: 18, name: "Digital Experience Management",
    basePath: "/digital-experience", permissionNamespace: "occ.experience", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-DS", "PLT-SITE", "PLT-MOB", "PLT-DESK"], dependencies: ["PCC-11", "PCC-12", "OCC-03"],
    resourceKinds: ["organization-brand", "organization-theme", "experience-navigation", "channel-configuration", "experience-content-slot", "experience-rollout"],
    eventFamilies: ["occ.experience"], primaryRepositories: ["tenant-admin", "design-system", "tenant-sites", "tenant-site-template", "unierp-mobile", "desktop-app"],
  }),
  defineApp({
    id: "OCC-19", center: "OCC", sequence: 19, name: "Notification Center",
    basePath: "/notification-center", permissionNamespace: "occ.notifications", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-BIZ"], dependencies: ["OCC-03", "OCC-16"],
    resourceKinds: ["notification-subscription", "notification-preference", "notification-routing-rule", "organization-notification-template", "in-app-notification", "notification-delivery-attempt"],
    eventFamilies: ["occ.notifications"], primaryRepositories: ["tenant-admin", "api", "data"],
  }),
  defineApp({
    id: "OCC-20", center: "OCC", sequence: 20, name: "Support & Service Center",
    basePath: "/support-center", permissionNamespace: "occ.support", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-BIZ"], dependencies: ["PCC-01", "PCC-15", "PCC-22", "OCC-03"],
    resourceKinds: ["organization-support-case-view", "organization-service-request", "organization-diagnostic-consent", "service-status-subscription", "support-feedback", "customer-satisfaction-response"],
    eventFamilies: ["occ.support"], primaryRepositories: ["tenant-admin", "api", "data"],
  }),
  defineApp({
    id: "OCC-21", center: "OCC", sequence: 21, name: "AI Governance & Agent Operations",
    basePath: "/ai-governance", permissionNamespace: "occ.ai-governance", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-BIZ", "PLT-IAM"], dependencies: ["PCC-21", "OCC-03", "OCC-08", "OCC-15"],
    resourceKinds: ["organization-ai-use-case", "organization-ai-agent", "agent-tool-binding", "agent-knowledge-source", "organization-ai-policy", "organization-ai-evaluation", "organization-ai-incident"],
    eventFamilies: ["occ.ai-governance"], primaryRepositories: ["tenant-admin", "api", "data", "idp"], addedAfterInitialScope: true,
  }),
  defineApp({
    id: "OCC-22", center: "OCC", sequence: 22, name: "Organization Intelligence & Insights",
    basePath: "/organization-insights", permissionNamespace: "occ.intelligence", experienceOwner: "PLT-TAD",
    authorityPlatforms: ["PLT-BIZ"], dependencies: ["OCC-03"],
    resourceKinds: ["organization-semantic-metric", "organization-dataset", "organization-dashboard", "organization-report", "organization-forecast", "organization-anomaly"],
    eventFamilies: ["occ.intelligence"], primaryRepositories: ["tenant-admin", "api", "data"], addedAfterInitialScope: true,
  }),
] as const satisfies readonly ControlCenterAppDefinition[];

export type ControlCenterAppDefinitionRecord = (typeof CONTROL_CENTER_APPS)[number];
export type ControlCenterAppId = ControlCenterAppDefinitionRecord["id"];
export type ControlCenterResourceKind = ControlCenterAppDefinitionRecord["resourceKinds"][number];

export interface ControlCenterCatalogValidationResult {
  valid: boolean;
  errors: string[];
}

function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

/** Validate an arbitrary catalog so architecture gates can prove failure cases. */
export function validateControlCenterCatalog(
  apps: readonly ControlCenterAppDefinition[],
): ControlCenterCatalogValidationResult {
  const errors: string[] = [];
  const knownIds = new Set(apps.map((app) => app.id));

  for (const center of CONTROL_CENTERS) {
    const centerApps = apps.filter((app) => app.center === center);
    if (centerApps.length !== 22) {
      errors.push(`${center} must declare exactly 22 applications; found ${centerApps.length}`);
    }
    const expectedSequences = Array.from({ length: 22 }, (_, index) => index + 1);
    const actualSequences = centerApps.map((app) => app.sequence).sort((a, b) => a - b);
    if (actualSequences.join(",") !== expectedSequences.join(",")) {
      errors.push(`${center} sequences must be contiguous 1..22; found ${actualSequences.join(",")}`);
    }
  }

  for (const duplicate of findDuplicates(apps.map((app) => app.id))) {
    errors.push(`duplicate application id: ${duplicate}`);
  }
  for (const duplicate of findDuplicates(apps.map((app) => `${app.center}:${app.name.toLowerCase()}`))) {
    errors.push(`duplicate application name: ${duplicate}`);
  }
  for (const duplicate of findDuplicates(apps.map((app) => `${app.center}:${app.basePath}`))) {
    errors.push(`duplicate application base path: ${duplicate}`);
  }
  for (const duplicate of findDuplicates(apps.map((app) => app.permissionNamespace))) {
    errors.push(`duplicate permission namespace: ${duplicate}`);
  }
  for (const duplicate of findDuplicates(apps.flatMap((app) => [...app.resourceKinds]))) {
    errors.push(`resource kind has more than one owning application: ${duplicate}`);
  }
  for (const duplicate of findDuplicates(apps.flatMap((app) => [...app.eventFamilies]))) {
    errors.push(`event family has more than one owning application: ${duplicate}`);
  }

  for (const app of apps) {
    const expectedId = `${app.center}-${String(app.sequence).padStart(2, "0")}`;
    if (app.id !== expectedId) {
      errors.push(`${app.id} does not match center/sequence ${expectedId}`);
    }
    const expectedOwner = app.center === "PCC" ? "PLT-PAO" : "PLT-TAD";
    if (app.experienceOwner !== expectedOwner) {
      errors.push(`${app.id} must be experience-owned by ${expectedOwner}`);
    }
    if (app.resourceKinds.length === 0) errors.push(`${app.id} declares no resource kinds`);
    if (app.eventFamilies.length === 0) errors.push(`${app.id} declares no event families`);
    if (app.primaryRepositories.length === 0) errors.push(`${app.id} declares no implementation repository`);
    for (const dependency of app.dependencies) {
      if (dependency === app.id) errors.push(`${app.id} depends on itself`);
      if (!knownIds.has(dependency)) errors.push(`${app.id} depends on unknown app ${dependency}`);
    }
  }

  const expectedAddedIds = new Set([
    "PCC-18", "PCC-19", "PCC-20", "PCC-21", "PCC-22", "OCC-21", "OCC-22",
  ]);
  for (const app of apps) {
    if (Boolean(app.addedAfterInitialScope) !== expectedAddedIds.has(app.id)) {
      errors.push(`${app.id} has incorrect addedAfterInitialScope marker`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidControlCenterCatalog(
  apps: readonly ControlCenterAppDefinition[] = CONTROL_CENTER_APPS,
): void {
  const result = validateControlCenterCatalog(apps);
  if (!result.valid) {
    throw new Error(`Invalid PCC/OCC catalog:\n- ${result.errors.join("\n- ")}`);
  }
}

export function getControlCenterApp(id: ControlCenterAppId): ControlCenterAppDefinitionRecord {
  const app = CONTROL_CENTER_APPS.find((candidate) => candidate.id === id);
  if (!app) throw new Error(`Unknown control-center application: ${id}`);
  return app;
}

export function getResourceKindOwner(resourceKind: string): ControlCenterAppDefinitionRecord | undefined {
  return CONTROL_CENTER_APPS.find((app) =>
    (app.resourceKinds as readonly string[]).includes(resourceKind),
  );
}
