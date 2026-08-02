/**
 * Thin fetch wrapper for the future FastAPI backend. Every service module
 * in src/services currently returns mock data (see src/data), but is
 * already shaped as an async function — swapping the body for a call
 * through `apiFetch` is the only change needed once the backend exists.
 *
 * Example (future):
 *   export async function getServices() {
 *     return apiFetch<Service[]>("/services");
 *   }
 */

// Unset means no backend configured yet. An empty string is deliberate: it
// means "call this app's own origin" — API_PROXY_TARGET in next.config.ts
// rewrites those requests to the real backend so the session cookie stays
// first-party. See next.config.ts and .env.example.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  if (API_BASE_URL === undefined) {
    throw new ApiError(
      "NEXT_PUBLIC_API_BASE_URL is not set — this call has no backend to reach yet.",
      0
    );
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    // Sends/receives the httpOnly session cookie set by the FastAPI backend.
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let detail: string | undefined;
    try {
      detail = (await response.json())?.detail;
    } catch {
      // response body wasn't JSON — fall back to the generic message below.
    }
    throw new ApiError(
      detail ?? `Request to ${path} failed with status ${response.status}`,
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

/** Simulated network latency so loading states are visible against mock data. */
export function mockDelay(ms: number = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
