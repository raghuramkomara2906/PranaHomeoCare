export type AppointmentStatus =
  | "SLOT_HELD"
  | "PENDING"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "CANCELLED_BY_PATIENT"
  | "CANCELLED_BY_PRACTITIONER"
  | "COMPLETED"
  | "NO_SHOW"
  | "EXPIRED";

export interface Appointment {
  id: string;
  publicReference: string;
  patientUserId: string;
  practitionerId: string;
  serviceId: string;
  serviceName: string;
  practitionerName: string;
  startTimeUtc: string;
  endTimeUtc: string;
  displayTimezone: string;
  status: AppointmentStatus;
  canJoin?: boolean;
  joinAvailableAt?: string;
}

/**
 * Response shape for GET /api/v1/appointments/{appointmentId}/join-status.
 * The frontend never derives join eligibility on its own — it always
 * reflects whatever the backend last reported here.
 */
export interface AppointmentJoinStatus {
  appointmentId: string;
  status: AppointmentStatus;
  canJoin: boolean;
  joinAvailableAt: string;
  joinClosesAt: string;
  serverTimeUtc: string;
}
