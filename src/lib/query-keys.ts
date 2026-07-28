import type { AdminAppointmentFilters } from "@/lib/types/api";

/**
 * Central query-key factory so hooks and cache invalidation stay in sync.
 * Keys are readonly tuples — pass them to useQuery / invalidateQueries.
 */
export const queryKeys = {
  availability: {
    dates: (range?: { fromDate?: string; toDate?: string }) =>
      ["availability", "dates", range ?? {}] as const,
    slots: (date: string, consultationType?: string) =>
      ["availability", "slots", date, consultationType ?? null] as const,
  },
  appointment: {
    detail: (token: string) => ["appointment", token] as const,
    rescheduleOptions: (
      token: string,
      range?: { fromDate?: string; toDate?: string }
    ) => ["appointment", token, "reschedule-options", range ?? {}] as const,
    joinStatus: (token: string) =>
      ["appointment", token, "join-status"] as const,
  },
  admin: {
    me: ["admin", "me"] as const,
    dashboard: ["admin", "dashboard"] as const,
    appointments: (filters?: AdminAppointmentFilters) =>
      ["admin", "appointments", filters ?? {}] as const,
    appointment: (id: string) => ["admin", "appointment", id] as const,
      slots: (range?: { fromDate?: string; toDate?: string }) =>
      ["admin", "slots", range ?? {}] as const,
  },
  chatbot: {
    intro: ["chatbot", "intro"] as const,
  },
} as const;