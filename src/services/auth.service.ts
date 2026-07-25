import type { AuthUser } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api-client";

/** Auth module: the practitioner login. Session is an httpOnly cookie the
 * backend sets on /auth/login — nothing to store on the frontend. */
export async function login(email: string, password: string): Promise<AuthUser> {
  const { user } = await apiFetch<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return user;
}

export async function register(
  fullName: string,
  email: string,
  password: string
): Promise<AuthUser> {
  const { user } = await apiFetch<{ user: AuthUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ fullName, email, password }),
  });
  return user;
}

export async function updateProfile(patch: {
  fullName?: string;
  phone?: string;
}): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function logout(): Promise<void> {
  await apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

/** Returns null (rather than throwing) when there's no active session. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return await apiFetch<AuthUser>("/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
