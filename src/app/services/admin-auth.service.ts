import { apiFetch } from "@/lib/api-client";
import type { AdminMe } from "@/lib/types/api";

/**
 * Doctor/admin authentication. The session is an httpOnly cookie set by the
 * backend; apiFetch already sends credentials, so there's no token to handle
 * in the client.
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<AdminMe> {
  return apiFetch<AdminMe>("/api/v1/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function adminLogout(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/api/v1/admin/auth/logout", {
    method: "POST",
  });
}

export async function adminMe(): Promise<AdminMe> {
  return apiFetch<AdminMe>("/api/v1/admin/auth/me");
}