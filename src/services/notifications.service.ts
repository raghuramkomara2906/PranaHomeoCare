import type { AppNotification } from "@/lib/types";
import { apiFetch } from "@/lib/api-client";

export async function getMyNotifications(): Promise<AppNotification[]> {
  return apiFetch<AppNotification[]>("/notifications/me");
}

export async function markNotificationRead(
  id: string
): Promise<AppNotification> {
  return apiFetch<AppNotification>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch<{ ok: boolean }>("/notifications/read-all", {
    method: "POST",
  });
}
