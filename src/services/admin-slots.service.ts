import { apiFetch } from "@/lib/api-client";
import type { AdminSlot, AdminSlotListResponse } from "@/lib/types/api";

export async function listAdminSlots(
  range: { fromDate?: string; toDate?: string } = {}
): Promise<AdminSlotListResponse> {
  const q = new URLSearchParams();
  if (range.fromDate) q.set("fromDate", range.fromDate);
  if (range.toDate) q.set("toDate", range.toDate);
  const qs = q.toString();
  return apiFetch<AdminSlotListResponse>(
    `/api/v1/admin/slots${qs ? `?${qs}` : ""}`
  );
}

/** startAt is an ISO string with the IST offset, e.g. 2026-07-28T10:00:00+05:30.
 * The end (start + 30 min) is computed server-side. */
export async function createAdminSlot(startAt: string): Promise<AdminSlot> {
  return apiFetch<AdminSlot>("/api/v1/admin/slots", {
    method: "POST",
    body: JSON.stringify({ startAt }),
  });
}

export async function patchAdminSlot(
  id: string,
  baseStatus: string,
  blockedReason?: string
): Promise<AdminSlot> {
  return apiFetch<AdminSlot>(`/api/v1/admin/slots/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ baseStatus, blockedReason }),
  });
}

export async function deleteAdminSlot(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/admin/slots/${id}`, { method: "DELETE" });
}