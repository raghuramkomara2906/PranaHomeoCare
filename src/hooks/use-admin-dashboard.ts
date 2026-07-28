"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { getDashboard } from "@/services/admin-dashboard.service";

export function useDashboard(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: getDashboard,
    enabled,
    retry: false,
  });
}