"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import * as svc from "@/services/account.service";

// ---------------------------------------------------------------------------
// Session / profile
// ---------------------------------------------------------------------------

export function useAccountMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.account.me,
    queryFn: svc.getAccountMe,
    enabled,
    retry: false,
    staleTime: 60_000,
  });
}

export function useAccountLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.accountLogout,
    onSuccess: () => qc.removeQueries({ queryKey: ["account"] }),
  });
}

// ---------------------------------------------------------------------------
// OTP-based registration (existing — re-enabled when DLT SMS is ready)
// ---------------------------------------------------------------------------

export function useRegisterRequestOtp() {
  return useMutation({ mutationFn: svc.registerRequestOtp });
}

export function useRegisterConfirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.registerConfirm,
    onSuccess: (me) => qc.setQueryData(queryKeys.account.me, me),
  });
}

// ---------------------------------------------------------------------------
// Password-only registration (new — no OTP required)
// ---------------------------------------------------------------------------

export function useRegisterWithMobile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.registerWithMobile,
    onSuccess: (me) => qc.setQueryData(queryKeys.account.me, me),
  });
}

export function useRegisterWithEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.registerWithEmail,
    onSuccess: (me) => qc.setQueryData(queryKeys.account.me, me),
  });
}

// ---------------------------------------------------------------------------
// Login — OTP-verified mobile (existing)
// ---------------------------------------------------------------------------

export function useAccountLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.accountLogin,
    onSuccess: (me) => qc.setQueryData(queryKeys.account.me, me),
  });
}

// ---------------------------------------------------------------------------
// Login — password-only (new)
// ---------------------------------------------------------------------------

export function useLoginWithMobile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.loginWithMobile,
    onSuccess: (me) => qc.setQueryData(queryKeys.account.me, me),
  });
}

export function useLoginWithEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.loginWithEmail,
    onSuccess: (me) => qc.setQueryData(queryKeys.account.me, me),
  });
}

// ---------------------------------------------------------------------------
// Password reset (existing — re-enabled when DLT SMS is ready)
// ---------------------------------------------------------------------------

export function usePasswordResetRequestOtp() {
  return useMutation({ mutationFn: svc.passwordResetRequestOtp });
}

export function usePasswordResetConfirm() {
  return useMutation({ mutationFn: svc.passwordResetConfirm });
}

// ---------------------------------------------------------------------------
// Appointments list
// ---------------------------------------------------------------------------

export function useAccountAppointments(enabled = true) {
  return useQuery({
    queryKey: queryKeys.account.appointments,
    queryFn: svc.getAccountAppointments,
    enabled,
  });
}

// ---------------------------------------------------------------------------
// Per-appointment actions (by id)
// ---------------------------------------------------------------------------

function useInvalidateAppointments() {
  const qc = useQueryClient();
  return () =>
    qc.invalidateQueries({ queryKey: queryKeys.account.appointments });
}

export function useAccountJoinStatus(
  id: string,
  options?: { refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: [...queryKeys.account.appointments, id, "join-status"],
    queryFn: () => svc.accountJoinStatus(id),
    refetchInterval: options?.refetchInterval ?? false,
  });
}

export function useAccountJoin(id: string) {
  return useMutation({ mutationFn: () => svc.accountJoin(id) });
}

export function useAccountRescheduleOptions(id: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.account.appointments, id, "reschedule-options"],
    queryFn: () => svc.accountRescheduleOptions(id),
    enabled,
  });
}

export function useAccountReschedule(id: string) {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: (newSlotId: string) => svc.accountReschedule(id, newSlotId),
    onSuccess: invalidate,
  });
}

export function useAccountCancel(id: string) {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: () => svc.accountCancel(id),
    onSuccess: invalidate,
  });
}