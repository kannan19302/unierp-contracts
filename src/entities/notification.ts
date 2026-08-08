/**
 * L0 Notification domain entities.
 * The storage shapes the notification engine reads and writes
 * (`Notification`, `NotificationPreference`, `NotificationDeliveryLog`,
 * `NotificationTemplate`, `NotificationDigest`, `NotificationChannel` in
 * `@kannan19302/database`). All IDs are strings; dates are `Date` to match the
 * Prisma-generated client.
 */

export type NotificationChannel =
  | "IN_APP"
  | "EMAIL"
  | "SMS"
  | "PUSH"
  | "WEBHOOK"
  | "ALL";

export type NotificationDeliveryStatus =
  | "QUEUED"
  | "SENT"
  | "DELIVERED"
  | "SUPPRESSED"
  | "BOUNCED"
  | "FAILED"
  | "OPENED"
  | "CLICKED";

export interface NotificationEntity {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  link?: string | null;
  status: "UNREAD" | "READ" | "ARCHIVED";
  createdAt: Date;
}

export interface NotificationPreferenceEntity {
  id: string;
  tenantId: string;
  userId: string;
  channelName: string;
  eventType: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDeliveryLogEntity {
  id: string;
  tenantId: string;
  userId: string;
  notificationId?: string | null;
  templateId?: string | null;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  errorMsg?: string | null;
  metadata: Record<string, unknown>;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  openedAt?: Date | null;
  createdAt: Date;
}

export interface NotificationTemplateEntity {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  subject: string;
  body: string;
  channel: string;
  variables: unknown;
  eventType?: string | null;
  isActive: boolean;
  category?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDigestEntity {
  id: string;
  tenantId: string;
  userId: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "INSTANT";
  channel: string;
  lastSentAt?: Date | null;
  nextScheduledAt?: Date | null;
  isEnabled: boolean;
  preferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
