import { DomainEvent } from "./index.js";

export type OnboardingStepName =
  | "ORGANIZATION_PROFILE"
  | "INDUSTRY_BLUEPRINT"
  | "LOCALIZATION_FINANCE"
  | "TEAM_INVITATION"
  | "DATA_INGESTION"
  | "CUSTOM_DOMAIN"
  | "PAYMENT_SETUP"
  | "SSO_SETUP"
  | "DASHBOARD";

export interface TenantOnboardingStartedEvent
  extends DomainEvent<{
    tenantId: string;
    organizationName: string;
    industry?: string;
    initiatedBy: string;
  }> {
  eventType: "platform.tenant.onboarding_started";
}

export interface TenantOnboardingStepCompletedEvent
  extends DomainEvent<{
    tenantId: string;
    step: OnboardingStepName;
    completedBy: string;
    progressPercentage: number;
    metadata?: Record<string, unknown>;
  }> {
  eventType: "platform.tenant.onboarding_step_completed";
}

export interface TenantOnboardingCompletedEvent
  extends DomainEvent<{
    tenantId: string;
    organizationName: string;
    completedAt: string;
    totalSteps: number;
  }> {
  eventType: "platform.tenant.onboarding_completed";
}

export type MasterDataEntityType =
  | "CUSTOMER"
  | "VENDOR"
  | "ITEM"
  | "GL_ACCOUNT"
  | "OPENING_BALANCE"
  | "EMPLOYEE";

export interface MasterDataImportStartedEvent
  extends DomainEvent<{
    tenantId: string;
    jobId: string;
    entityType: MasterDataEntityType;
    fileName: string;
    totalRows: number;
    importedBy: string;
  }> {
  eventType: "data.master_data.import_started";
}

export interface MasterDataImportCompletedEvent
  extends DomainEvent<{
    tenantId: string;
    jobId: string;
    entityType: MasterDataEntityType;
    successRows: number;
    errorRows: number;
    durationMs: number;
  }> {
  eventType: "data.master_data.import_completed";
}
