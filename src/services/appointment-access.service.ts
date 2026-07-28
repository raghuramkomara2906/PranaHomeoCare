import { apiFetch } from "@/lib/api-client";
import type {
  AppointmentAccess,
  CancelResponse,
  JoinResponse,
  JoinStatus,
  RescheduleOptions,
  RescheduleResponse,
} from "@/lib/types/api";

/** Account-free management of one appointment via its secure token. */
const base = (token: string) =>
  `/api/v1/appointments/access/${encodeURIComponent(token)}`;

export async function getAppointment(token: string): Promise<AppointmentAccess> {
  return apiFetch<AppointmentAccess>(base(token));
}

export async function cancelAppointment(token: string): Promise<CancelResponse> {
  return apiFetch<CancelResponse>(`${base(token)}/cancel`, { method: "POST" });
}

export async function getRescheduleOptions(
  token: string,
  params?: { fromDate?: string; toDate?: string }
): Promise<RescheduleOptions> {
  const q = new URLSearchParams();
  if (params?.fromDate) q.set("fromDate", params.fromDate);
  if (params?.toDate) q.set("toDate", params.toDate);
  const qs = q.toString();
  return apiFetch<RescheduleOptions>(
    `${base(token)}/reschedule-options${qs ? `?${qs}` : ""}`
  );
}

export async function rescheduleAppointment(
  token: string,
  newSlotId: string
): Promise<RescheduleResponse> {
  return apiFetch<RescheduleResponse>(`${base(token)}/reschedule`, {
    method: "POST",
    body: JSON.stringify({ newSlotId }),
  });
}

export async function getJoinStatus(token: string): Promise<JoinStatus> {
  return apiFetch<JoinStatus>(`${base(token)}/join-status`);
}

/** Only call on an explicit Join click — this is the sole endpoint that
 * returns the raw Zoom URL, after the backend re-validates the window. */
export async function joinConsultation(token: string): Promise<JoinResponse> {
  return apiFetch<JoinResponse>(`${base(token)}/join`, { method: "POST" });
}