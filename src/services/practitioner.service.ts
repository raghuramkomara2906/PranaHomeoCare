import type { Practitioner } from "@/lib/types";
import { mockDelay } from "@/lib/api-client";
import { mockPractitioner } from "@/data/practitioner";

/**
 * Service module: practitioner profile.
 * Swap the body of `getPractitioner` for `apiFetch<Practitioner>("/practitioner")`
 * once GET /api/v1/practitioner exists on the backend.
 */
export async function getPractitioner(): Promise<Practitioner> {
  await mockDelay();
  return mockPractitioner;
}
