/**
 * L0 Notification domain events.
 * `NotificationSendEvent` is the in-process event every module emits through
 * the event bus (`notification.send`); `NotificationCreatedEvent` carries the
 * created in-app row back to the emitting controller (`notification.create`).
 */

import type { DomainEvent } from "./index.js";
import type { NotificationEntity, NotificationChannel } from "../entities/index.js";

export interface NotificationSendPayload {
  tenantId: string;
  /** Platform user the notification targets. Required for per-user preferences. */
  userId?: string;
  /** Direct recipient for transactional mail (invites, automation) — skips per-user preferences. */
  to?: string;
  /** Event type — the preference key, e.g. "CHAT", "INVOICE_OVERDUE", "AUTOMATION_RULE". */
  type: string;
  title: string;
  body?: string;
  channel?: NotificationChannel;
  /** Render subject/body from a NotificationTemplate instead of title/body. */
  templateId?: string;
  variables?: Record<string, string>;
  locale?: string;
  /** Bypasses quiet hours. */
  urgent?: boolean;
  /** Webhook channel payload body. */
  data?: Record<string, unknown>;
  /** In-app deep link. */
  link?: string;
}

export interface NotificationSendEvent extends DomainEvent<NotificationSendPayload> {
  eventType: "notification.send";
}

export interface NotificationCreatePayload extends NotificationSendPayload {}

export interface NotificationCreatedEvent
  extends DomainEvent<NotificationEntity | null> {
  eventType: "notification.create";
}
