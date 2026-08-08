/**
 * L0 Notification HTTP contracts — request/response shapes for the
 * preferences and delivery-status endpoints.
 */

import type {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationPreferenceEntity,
  NotificationDeliveryLogEntity,
} from "../entities/index.js";

export interface NotificationPreferenceDto {
  channelName: NotificationChannel;
  eventType: string;
  isEnabled: boolean;
}

export interface NotificationPreferenceUpdateRequest {
  preferences: NotificationPreferenceDto[];
}

export interface NotificationPreferenceResponse {
  preferences: NotificationPreferenceEntity[];
}

export interface DeliveryLogQuery {
  userId?: string;
  status?: NotificationDeliveryStatus;
  limit?: number;
}

export interface DeliveryLogResponse {
  logs: NotificationDeliveryLogEntity[];
}
