"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  adminLogin,
  adminLogout,
  adminMe,
} from "@/services/admin-auth.service";

/** Resolves the current admin from the session cookie. `retry: false` so an
 * unauthenticated 401 settles immediately instead of retrying. */
export function useAdminMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.me,
    queryFn: adminMe,
    enabled,
    retry: false,
  });
}

export function useAdminLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      adminLogin(vars.email, vars.password),
    onSuccess: (me) => qc.setQueryData(queryKeys.admin.me, me),
  });
}

export function useAdminLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminLogout,
    onSuccess: () => {
      qc.setQueryData(queryKeys.admin.me, null);
      qc.clear();
    },
  });
}