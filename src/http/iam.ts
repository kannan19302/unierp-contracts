import { z } from "zod";

/**
 * IAM-001 / Enterprise Hosted Sign-In Schema
 */
export const SignInRequestSchema = z.object({
  email: z.string().email("Please provide a valid work email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional().default(false),
  returnTo: z.string().optional().default("/"),
  csrfToken: z.string().min(16, "Valid CSRF token is required"),
});
export type SignInRequest = z.infer<typeof SignInRequestSchema>;

export const SignInResponseSchema = z.object({
  status: z.enum(["authenticated", "mfa_required", "password_expired", "sso_redirect", "locked"]),
  token: z.string().optional(),
  refreshToken: z.string().optional(),
  challengeToken: z.string().optional(),
  redirectUrl: z.string().optional(),
});
export type SignInResponse = z.infer<typeof SignInResponseSchema>;

/**
 * IAM-002 / Multi-Factor Challenge & FIDO2 Passkey
 */
export const MfaVerifySchema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().length(6, "Verification code must be exactly 6 digits").regex(/^\d+$/, "Code must contain only digits"),
  rememberDevice: z.boolean().optional().default(false),
  csrfToken: z.string().min(16),
});
export type MfaVerifyRequest = z.infer<typeof MfaVerifySchema>;

/**
 * IAM-003 / Enterprise SSO & Domain Discovery Router
 */
export const SsoDiscoveryRequestSchema = z.object({
  email: z.string().email(),
});
export type SsoDiscoveryRequest = z.infer<typeof SsoDiscoveryRequestSchema>;

export const SsoDiscoveryResponseSchema = z.object({
  ssoConfigured: z.boolean(),
  idpProvider: z.string().optional(),
  redirectUrl: z.string().optional(),
  domain: z.string(),
});
export type SsoDiscoveryResponse = z.infer<typeof SsoDiscoveryResponseSchema>;

/**
 * IAM-004 / Password Recovery & Zero-Trust Access Reset
 */
export const PasswordRecoveryRequestSchema = z.object({
  email: z.string().email("Please enter a valid enterprise email"),
  csrfToken: z.string().min(16),
});
export type PasswordRecoveryRequest = z.infer<typeof PasswordRecoveryRequestSchema>;

export const PasswordResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(14, "Password must be at least 14 characters"),
  confirmPassword: z.string().min(14),
  revokeAllSessions: z.boolean().default(true),
  csrfToken: z.string().min(16),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});
export type PasswordResetRequest = z.infer<typeof PasswordResetSchema>;

/**
 * IAM-005 / Multi-Tenant Realm & Workspace Switcher
 */
export const WorkspaceItemSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  cellRegion: z.string(), // e.g. US-East Cell
  roleTitle: z.string(), // e.g. Global Admin
  iconColor: z.string(), // e.g. orange, green, blue
  iconLetter: z.string().length(1),
  isActive: z.boolean().default(false),
});
export type WorkspaceItem = z.infer<typeof WorkspaceItemSchema>;

export const WorkspaceSwitchRequestSchema = z.object({
  targetTenantId: z.string().uuid(),
  csrfToken: z.string().min(16),
});
export type WorkspaceSwitchRequest = z.infer<typeof WorkspaceSwitchRequestSchema>;

/**
 * IAM-006 / Session Inactivity Lockout & Break-Glass Console
 */
export const SessionUnlockSchema = z.object({
  password: z.string().min(1, "Password is required"),
  csrfToken: z.string().min(16),
});
export type SessionUnlockRequest = z.infer<typeof SessionUnlockSchema>;

export const BreakGlassConsoleRequestSchema = z.object({
  emergencyJustification: z.string().min(20, "Detailed incident justification required"),
  incidentTicketId: z.string().min(5),
  csrfToken: z.string().min(16),
});
export type BreakGlassConsoleRequest = z.infer<typeof BreakGlassConsoleRequestSchema>;

/**
 * IAM-007 / MFA Factor Setup & Authenticator Enrollment
 */
export const MfaSetupConfirmSchema = z.object({
  secretKey: z.string().min(16),
  verificationCode: z.string().length(6).regex(/^\d+$/),
  csrfToken: z.string().min(16),
});
export type MfaSetupConfirmRequest = z.infer<typeof MfaSetupConfirmSchema>;

/**
 * IAM-008 / FIDO2 Passkey & Biometric Hardware Enrollment
 */
export const PasskeyEnrollRequestSchema = z.object({
  deviceNickname: z.string().min(2).max(100),
  attestationResponse: z.unknown(),
  csrfToken: z.string().min(16),
});
export type PasskeyEnrollRequest = z.infer<typeof PasskeyEnrollRequestSchema>;

/**
 * IAM-009 / Emergency Backup Recovery Codes Generation & Storage
 */
export const BackupCodesAcknowledgeSchema = z.object({
  acknowledgedSecureStorage: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you have saved your recovery codes safely" }),
  }),
  csrfToken: z.string().min(16),
});
export type BackupCodesAcknowledgeRequest = z.infer<typeof BackupCodesAcknowledgeSchema>;

/**
 * IAM-010 / Forced Password Change on First Login / Policy Expiry
 */
export const ForcedPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(14, "Password must be at least 14 characters")
    .regex(/[A-Z]/, "Must include uppercase letter")
    .regex(/[a-z]/, "Must include lowercase letter")
    .regex(/[0-9]/, "Must include a number")
    .regex(/[^A-Za-z0-9]/, "Must include a special symbol"),
  confirmPassword: z.string().min(14),
  csrfToken: z.string().min(16),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});
export type ForcedPasswordChangeRequest = z.infer<typeof ForcedPasswordChangeSchema>;

/**
 * IAM-011 / Magic Link Dispatched & Email Authorization Notice
 */
export const MagicLinkDispatchSchema = z.object({
  email: z.string().email(),
  returnTo: z.string().optional().default("/"),
  csrfToken: z.string().min(16),
});
export type MagicLinkDispatchRequest = z.infer<typeof MagicLinkDispatchSchema>;

/**
 * IAM-012 / Suspicious Login Challenge & New Device Verification
 */
export const SuspiciousChallengeVerifySchema = z.object({
  challengeToken: z.string().min(1),
  matchedNumber: z.number().int().min(10).max(99),
  csrfToken: z.string().min(16),
});
export type SuspiciousChallengeVerifyRequest = z.infer<typeof SuspiciousChallengeVerifySchema>;

/**
 * IAM-013 / Enterprise Team Member Invitation Acceptance
 */
export const InvitationAcceptSchema = z.object({
  invitationToken: z.string().min(1),
  fullName: z.string().min(2),
  password: z.string().min(14),
  termsAccepted: z.literal(true),
  csrfToken: z.string().min(16),
});
export type InvitationAcceptRequest = z.infer<typeof InvitationAcceptSchema>;

/**
 * IAM-014 / OAuth 2.0 Consent & Third-Party Permissions Grant
 */
export const OAuthConsentDecisionSchema = z.object({
  clientId: z.string().min(1),
  approved: z.boolean(),
  grantedScopes: z.array(z.string()),
  csrfToken: z.string().min(16),
});
export type OAuthConsentDecisionRequest = z.infer<typeof OAuthConsentDecisionSchema>;

/**
 * IAM-015 / Device Code Authorization Flow (CLI & Headless Login)
 */
export const DeviceCodeVerifySchema = z.object({
  userCode: z.string()
    .length(9, "Code must be formatted as XXXX-XXXX")
    .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Invalid format. Expected format: WBX9-4K72"),
  csrfToken: z.string().min(16),
});
export type DeviceCodeVerifyRequest = z.infer<typeof DeviceCodeVerifySchema>;

/**
 * IAM-016 / Account Suspended & Security Policy Lockout Resolution
 */
export const AccountSuspendedResolutionSchema = z.object({
  incidentTicket: z.string(),
  hardwareTokenResponse: z.unknown().optional(),
  supportRequestNote: z.string().optional(),
  csrfToken: z.string().min(16),
});
export type AccountSuspendedResolutionRequest = z.infer<typeof AccountSuspendedResolutionSchema>;
