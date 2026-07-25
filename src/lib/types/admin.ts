import type { Appointment } from "./appointment";

/** Appointment shape returned only to the practitioner — adds the guest
 * contact details that patients submit at booking time. */
export interface AdminAppointment extends Appointment {
  patientFullName: string;
  patientEmail: string;
  patientPhone: string;
  patientNotes?: string | null;
}

/** One weekday's recurring practice hours — "Meeting Timings". */
export interface WeeklyRule {
  id: string;
  weekday: number; // 0 = Sunday .. 6 = Saturday
  startMinute: number;
  endMinute: number;
  isActive: boolean;
}

export type WeeklyRuleInput = Omit<WeeklyRule, "id">;

/** A one-off override for a specific date — closed, or different hours. */
export interface AvailabilityExceptionRecord {
  id: string;
  date: string; // "YYYY-MM-DD"
  isClosed: boolean;
  startMinute?: number | null;
  endMinute?: number | null;
  note?: string | null;
}

export type AvailabilityExceptionInput = Omit<AvailabilityExceptionRecord, "id">;
