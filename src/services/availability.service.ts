import type { TimeSlot } from "@/lib/types";
import { apiFetch } from "@/lib/api-client";

/** Availability module: consultation time slots for a given service + date. */
export async function getAvailableSlots(
  serviceId: string,
  dateIso: string
): Promise<TimeSlot[]> {
  return apiFetch<TimeSlot[]>(
    `/availability?service_id=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(dateIso)}`
  );
}
