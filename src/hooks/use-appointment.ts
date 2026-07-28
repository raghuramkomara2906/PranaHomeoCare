"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  cancelAppointment,
  getAppointment,
  getJoinStatus,
  getRescheduleOptions,
  joinConsultation,
  rescheduleAppointment,
} from "@/services/appointment-access.service";

export function useAppointment(token: string) {
  return useQuery({
    queryKey: queryKeys.appointment.detail(token),
    queryFn: () => getAppointment(token),
    enabled: Boolean(token),
  });
}

export function useRescheduleOptions(
  token: string,
  range?: { fromDate?: string; toDate?: string },
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.appointment.rescheduleOptions(token, range),
    queryFn: () => getRescheduleOptions(token, range),
    enabled: Boolean(token) && enabled,
  });
}

/** Poll while the patient waits on the join window (pass a refetchInterval). */
export function useJoinStatus(
  token: string,
  options?: { refetchInterval?: number | false }
) {
  return useQuery({
    queryKey: queryKeys.appointment.joinStatus(token),
    queryFn: () => getJoinStatus(token),
    enabled: Boolean(token),
    refetchInterval: options?.refetchInterval ?? false,
  });
}

export function useCancelAppointment(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cancelAppointment(token),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.appointment.detail(token) }),
  });
}

export function useRescheduleAppointment(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (newSlotId: string) => rescheduleAppointment(token, newSlotId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.appointment.detail(token) }),
  });
}

export function useJoinConsultation(token: string) {
  return useMutation({ mutationFn: () => joinConsultation(token) });
}