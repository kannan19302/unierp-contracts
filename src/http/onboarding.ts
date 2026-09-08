import { z } from "zod";

/**
 * REG-001 / Step 1: Enterprise Workspace Registration (Account)
 */
export const WorkspaceRegistrationStep1Schema = z.object({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters").max(100),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Please enter a valid corporate work email"),
  password: z.string()
    .min(14, "Password must be at least 14 characters")
    .regex(/[A-Z]/, "Must include uppercase letter")
    .regex(/[a-z]/, "Must include lowercase letter")
    .regex(/[0-9]/, "Must include a number")
    .regex(/[^A-Za-z0-9]/, "Must include a special symbol"),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Terms of Service and Privacy Policy" }),
  }),
  csrfToken: z.string().min(16),
});
export type WorkspaceRegistrationStep1 = z.infer<typeof WorkspaceRegistrationStep1Schema>;

/**
 * REG-002 / Step 2: Work Email Verification & Security OTP (Security)
 */
export const EmailVerificationOtpStep2Schema = z.object({
  email: z.string().email(),
  otpCode: z.string().length(6, "Verification code must be exactly 6 digits").regex(/^\d+$/, "Only numeric digits allowed"),
  csrfToken: z.string().min(16),
});
export type EmailVerificationOtpStep2 = z.infer<typeof EmailVerificationOtpStep2Schema>;

export const EmailVerificationOtpResendSchema = z.object({
  email: z.string().email(),
  csrfToken: z.string().min(16),
});
export type EmailVerificationOtpResend = z.infer<typeof EmailVerificationOtpResendSchema>;

/**
 * REG-003 / Step 3: Sovereign Cloud Region & Live Provisioning (Launch)
 */
export const SovereignRegionConfigSchema = z.object({
  regionId: z.string(), // e.g. "aws-us-east-1"
  regionName: z.string(), // e.g. "US East (N. Virginia)"
  cloudProvider: z.enum(["AWS", "Azure", "GCP", "AirGapped"]),
  kmsEncryption: z.string(), // e.g. "Dedicated KMS Encryption"
  estimatedLatencyMs: z.number().int(), // e.g. 18
  status: z.enum(["ACTIVE", "PROVISIONING", "PENDING"]),
});
export type SovereignRegionConfig = z.infer<typeof SovereignRegionConfigSchema>;

export const LiveProvisioningStep3Schema = z.object({
  tenantId: z.string().uuid(),
  selectedRegionId: z.string().default("aws-us-east-1"),
  csrfToken: z.string().min(16),
});
export type LiveProvisioningStep3 = z.infer<typeof LiveProvisioningStep3Schema>;

export const LiveProvisioningStatusResponseSchema = z.object({
  tenantId: z.string().uuid(),
  progressPercentage: z.number().min(0).max(100),
  currentPhase: z.string(),
  status: z.enum(["pending", "provisioning", "ready", "failed"]),
  workspaceUrl: z.string().url().optional(),
  region: SovereignRegionConfigSchema,
});
export type LiveProvisioningStatusResponse = z.infer<typeof LiveProvisioningStatusResponseSchema>;

/**
 * REG-004 / Edge Branch: Domain Collision & Workspace Auto-Join Access Router
 */
export const DomainCollisionCheckSchema = z.object({
  email: z.string().email(),
});
export type DomainCollisionCheck = z.infer<typeof DomainCollisionCheckSchema>;

export const DomainCollisionResponseSchema = z.object({
  collisionDetected: z.boolean(),
  organizationName: z.string().optional(),
  ssoConfigured: z.boolean().default(false),
  idpProviderName: z.string().optional(), // e.g. "Okta", "Azure AD"
  ssoLoginUrl: z.string().optional(),
});
export type DomainCollisionResponse = z.infer<typeof DomainCollisionResponseSchema>;

export const DomainCollisionAccessRequestSchema = z.object({
  email: z.string().email(),
  organizationName: z.string(),
  reason: z.string().optional(),
  csrfToken: z.string().min(16),
});
export type DomainCollisionAccessRequest = z.infer<typeof DomainCollisionAccessRequestSchema>;
