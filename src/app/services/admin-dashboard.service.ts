import { apiFetch } from "@/lib/api-client";
import type { DashboardSummary } from "@/lib/types/api";

/** Doctor dashboard summary counts (A-002). */
export async function getDashboard(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/api/v1/admin/dashboard");
}