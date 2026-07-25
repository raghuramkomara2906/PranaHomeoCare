import type {
  Appointment,
  AppointmentJoinStatus,
  PatientContactDetails,
} from "@/lib/types";
import { apiFetch } from "@/lib/api-client";

export async function createAppointment(params: {
  serviceId: string;
  startTimeUtc: string;
  patient: PatientContactDetails;
}): Promise<Appointment> {
  return apiFetch<Appointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** The logged-in patient's own appointments — matched server-side by email. */
export async function getMyAppointments(): Promise<Appointment[]> {
  return apiFetch<Appointment[]>("/appointments/me");
}

/** Single source of truth for join eligibility — never derived client-side. */
export async function getJoinStatus(
  appointmentId: string
): Promise<AppointmentJoinStatus> {
  return apiFetch<AppointmentJoinStatus>(
    `/appointments/${appointmentId}/join-status`
  );
}

export async function cancelAppointment(
  appointmentId: string
): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${appointmentId}/cancel`, {
    method: "PATCH",
  });
}

export async function rescheduleAppointment(
  appointmentId: string,
  startTimeUtc: string
): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${appointmentId}/reschedule`, {
    method: "PATCH",
    body: JSON.stringify({ startTimeUtc }),
  });
}
