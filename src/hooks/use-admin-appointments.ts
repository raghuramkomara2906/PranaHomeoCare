"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  cancelAdminAppointment,
  getAdminAppointment,
  listAdminAppointments,
  setAppointmentStatus,
  setMeetingLink,
} from "@/services/admin-appointments.service";
import type { AdminAppointmentFilters } from "@/lib/types/api";

export function useAdminAppointments(filters: AdminAppointmentFilters) {
  return useQuery({
    queryKey: queryKeys.admin.appointments(filters),
    queryFn: () => listAdminAppointments(filters),
  });
}

export function useAdminAppointment(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.appointment(id),
    queryFn: () => getAdminAppointment(id),
    enabled: Boolean(id),
  });
}

function useInvalidateAppointment(id: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin", "appointments"] });
    qc.invalidateQueries({ queryKey: queryKeys.admin.appointment(id) });
    qc.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
  };
}

export function useSetMeetingLink(id: string) {
  const invalidate = useInvalidateAppointment(id);
  return useMutation({
    mutationFn: (input: {
      joinUrl: string;
      meetingIdentifier?: string;
      adminNote?: string;
    }) => setMeetingLink(id, input),
    onSuccess: invalidate,
  });
}

export function useSetAppointmentStatus(id: string) {
  const invalidate = useInvalidateAppointment(id);
  return useMutation({
    mutationFn: (vars: { status: string; note?: string }) =>
      setAppointmentStatus(id, vars.status, vars.note),
    onSuccess: invalidate,
  });
}

export function useAdminCancelAppointment(id: string) {
  const invalidate = useInvalidateAppointment(id);
  return useMutation({
    mutationFn: (input: { reason?: string; note?: string }) =>
      cancelAdminAppointment(id, input),
    onSuccess: invalidate,
  });
}