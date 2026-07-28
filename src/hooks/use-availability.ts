"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  getAvailableDates,
  getAvailableSlots,
} from "@/services/availability.service";
import type { ConsultationType } from "@/lib/types/api";

export function useAvailableDates(range?: {
  fromDate?: string;
  toDate?: string;
}) {
  return useQuery({
    queryKey: queryKeys.availability.dates(range),
    queryFn: () => getAvailableDates(range),
  });
}

/** Pass `date = null` to keep the query disabled until a date is chosen. */
export function useAvailableSlots(
  date: string | null,
  consultationType?: ConsultationType
) {
  return useQuery({
    queryKey: queryKeys.availability.slots(date ?? "", consultationType),
    queryFn: () => getAvailableSlots(date as string, consultationType),
    enabled: Boolean(date),
  });
}