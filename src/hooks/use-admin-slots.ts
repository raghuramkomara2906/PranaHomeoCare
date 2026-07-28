"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  createAdminSlot,
  deleteAdminSlot,
  listAdminSlots,
  patchAdminSlot,
} from "@/services/admin-slots.service";

function useInvalidateSlots() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin", "slots"] });
    qc.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
  };
}

export function useAdminSlots(range: { fromDate?: string; toDate?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.slots(range),
    queryFn: () => listAdminSlots(range),
  });
}

export function useCreateSlot() {
  const invalidate = useInvalidateSlots();
  return useMutation({
    mutationFn: (startAt: string) => createAdminSlot(startAt),
    onSuccess: invalidate,
  });
}

export function usePatchSlot(id: string) {
  const invalidate = useInvalidateSlots();
  return useMutation({
    mutationFn: (vars: { baseStatus: string; blockedReason?: string }) =>
      patchAdminSlot(id, vars.baseStatus, vars.blockedReason),
    onSuccess: invalidate,
  });
}

export function useDeleteSlot(id: string) {
  const invalidate = useInvalidateSlots();
  return useMutation({
    mutationFn: () => deleteAdminSlot(id),
    onSuccess: invalidate,
  });
}