import { apiFetch } from "@/lib/api-client";
import type {
  AdminActionResponse,
  AdminAppointmentDetail,
  AdminAppointmentFilters,
  AdminAppointmentListResponse,
  AdminMeetingResponse,
} from "@/lib/types/api";

export async function listAdminAppointments(
  filters: AdminAppointmentFilters = {}
): Promise<AdminAppointmentListResponse> {
  const q = new URLSearchParams();
  if (filters.fromDate) q.set("fromDate", filters.fromDate);
  if (filters.toDate) q.set("toDate", filters.toDate);
  if (filters.consultationType) q.set("consultationType", filters.consultationType);
  if (filters.status) q.set("status", filters.status);
  if (filters.meetingStatus) q.set("meetingStatus", filters.meetingStatus);
  if (filters.q) q.set("q", filters.q);
  const qs = q.toString();
  return apiFetch<AdminAppointmentListResponse>(
    `/api/v1/admin/appointments${qs ? `?${qs}` : ""}`
  );
}

export async function getAdminAppointment(
  id: string
): Promise<AdminAppointmentDetail> {
  return apiFetch<AdminAppointmentDetail>(`/api/v1/admin/appointments/${id}`);
}

export async function setAppointmentStatus(
  id: string,
  status: string,
  note?: string
): Promise<AdminActionResponse> {
  return apiFetch<AdminActionResponse>(
    `/api/v1/admin/appointments/${id}/status`,
    { method: "PATCH", body: JSON.stringify({ status, note }) }
  );
}

export async function setMeetingLink(
  id: string,
  input: { joinUrl: string; meetingIdentifier?: string; adminNote?: string }
): Promise<AdminMeetingResponse> {
  return apiFetch<AdminMeetingResponse>(
    `/api/v1/admin/appointments/${id}/meeting`,
    { method: "PUT", body: JSON.stringify(input) }
  );
}

export async function cancelAdminAppointment(
  id: string,
  input: { reason?: string; note?: string } = {}
): Promise<AdminActionResponse> {
  return apiFetch<AdminActionResponse>(
    `/api/v1/admin/appointments/${id}/cancel`,
    { method: "POST", body: JSON.stringify(input) }
  );
}