import type { Service } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api-client";

/** Service module: consultation service offerings, backed by the FastAPI service. */
export async function getServices(): Promise<Service[]> {
  return apiFetch<Service[]>("/services");
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  try {
    return await apiFetch<Service>(`/services/${slug}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
