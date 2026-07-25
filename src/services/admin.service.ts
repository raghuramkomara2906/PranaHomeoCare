import type {
  AdminAppointment,
  AnalyticsSummary,
  AppointmentStatus,
  AvailabilityExceptionInput,
  AvailabilityExceptionRecord,
  ContactMessage,
  PatientSummary,
  WeeklyRule,
  WeeklyRuleInput,
} from "@/lib/types";
import { apiFetch } from "@/lib/api-client";

/** Admin module: practitioner-only endpoints for managing consultations and
 * meeting-time availability. Every call relies on the session cookie —
 * the backend rejects anything from a non-practitioner with a 401/403. */
export async function getAdminAppointments(
  startIso: string,
  endIso: string
): Promise<AdminAppointment[]> {
  return apiFetch<AdminAppointment[]>(
    `/admin/appointments?start=${startIso}&end=${endIso}`
  );
}

export async function updateAppointment(
  id: string,
  patch: { status?: AppointmentStatus; startTimeUtc?: string }
): Promise<AdminAppointment> {
  return apiFetch<AdminAppointment>(`/admin/appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function getWeeklyRules(): Promise<WeeklyRule[]> {
  return apiFetch<WeeklyRule[]>("/admin/availability/rules");
}

export async function replaceWeeklyRules(
  rules: WeeklyRuleInput[]
): Promise<WeeklyRule[]> {
  return apiFetch<WeeklyRule[]>("/admin/availability/rules", {
    method: "PUT",
    body: JSON.stringify(rules),
  });
}

export async function getExceptions(
  startIso: string,
  endIso: string
): Promise<AvailabilityExceptionRecord[]> {
  return apiFetch<AvailabilityExceptionRecord[]>(
    `/admin/availability/exceptions?start=${startIso}&end=${endIso}`
  );
}

export async function createException(
  input: AvailabilityExceptionInput
): Promise<AvailabilityExceptionRecord> {
  return apiFetch<AvailabilityExceptionRecord>("/admin/availability/exceptions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteException(id: string): Promise<void> {
  await apiFetch<void>(`/admin/availability/exceptions/${id}`, {
    method: "DELETE",
  });
}

/** Distinct patients aggregated from appointments — the Doctor "patient
 * details" view and the Admin "user management" view are the same panel. */
export async function getPatients(): Promise<PatientSummary[]> {
  return apiFetch<PatientSummary[]>("/admin/patients");
}

export async function getPatientAppointments(
  email: string
): Promise<AdminAppointment[]> {
  return apiFetch<AdminAppointment[]>(
    `/admin/patients/appointments?email=${encodeURIComponent(email)}`
  );
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  return apiFetch<AnalyticsSummary>("/admin/analytics/summary");
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  return apiFetch<ContactMessage[]>("/admin/contact-messages");
}

export async function markContactMessageRead(
  id: string
): Promise<ContactMessage> {
  return apiFetch<ContactMessage>(`/admin/contact-messages/${id}/read`, {
    method: "PATCH",
  });
}
