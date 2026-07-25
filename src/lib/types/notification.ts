export type NotificationType =
  | "APPOINTMENT_CONFIRMED"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_RESCHEDULED";

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  appointmentId?: string | null;
  isRead: boolean;
  createdAt: string;
}
