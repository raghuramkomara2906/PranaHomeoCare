import { apiFetch } from "@/lib/api-client";
import type {
  AvailableDatesResponse,
  ConsultationType,
  PublicSlotsResponse,
} from "@/lib/types/api";

/**
 * Public availability. Dates power the booking date-picker; slots are the
 * bookable 30-minute times for one IST date. Availability is advisory — the
 * slot is re-validated at OTP verification.
 */
export async function getAvailableDates(params?: {
  fromDate?: string;
  toDate?: string;
}): Promise<AvailableDatesResponse> {
  const q = new URLSearchParams();
  if (params?.fromDate) q.set("fromDate", params.fromDate);
  if (params?.toDate) q.set("toDate", params.toDate);
  const qs = q.toString();
  return apiFetch<AvailableDatesResponse>(
    `/api/v1/availability/dates${qs ? `?${qs}` : ""}`
  );
}

export async function getAvailableSlots(
  date: string,
  consultationType?: ConsultationType
): Promise<PublicSlotsResponse> {
  const q = new URLSearchParams({ date });
  if (consultationType) q.set("consultationType", consultationType);
  return apiFetch<PublicSlotsResponse>(
    `/api/v1/availability/slots?${q.toString()}`
  );
}