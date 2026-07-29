import { apiFetch } from "@/lib/api-client";
import type {
  AccountAppointmentsOut,
  AccountMe,
  AccountOtpChallenge,
  CancelResponse,
  JoinResponse,
  JoinStatus,
  RescheduleOptions,
  RescheduleResponse,
} from "@/lib/types/api";

// --- auth / registration ---------------------------------------------------
export function registerRequestOtp(mobileNumber: string): Promise<AccountOtpChallenge> {
  return apiFetch("/api/v1/account/register/request-otp", {
    method: "POST",
    body: JSON.stringify({ mobileNumber }),
  });
}

export function registerConfirm(input: {
  mobileNumber: string;
  otp: string;
  password: string;
}): Promise<AccountMe> {
  return apiFetch("/api/v1/account/register/confirm", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function accountLogin(input: {
  mobileNumber: string;
  password: string;
}): Promise<AccountMe> {
  return apiFetch("/api/v1/account/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function accountLogout(): Promise<void> {
  return apiFetch("/api/v1/account/logout", { method: "POST" });
}

export function getAccountMe(): Promise<AccountMe> {
  return apiFetch("/api/v1/account/me");
}

export function passwordResetRequestOtp(mobileNumber: string): Promise<AccountOtpChallenge> {
  return apiFetch("/api/v1/account/password-reset/request-otp", {
    method: "POST",
    body: JSON.stringify({ mobileNumber }),
  });
}

export function passwordResetConfirm(input: {
  mobileNumber: string;
  otp: string;
  password: string;
}): Promise<void> {
  return apiFetch("/api/v1/account/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// --- appointments (by id, session-scoped) ----------------------------------
export function getAccountAppointments(): Promise<AccountAppointmentsOut> {
  return apiFetch("/api/v1/account/appointments");
}

const base = (id: string) => `/api/v1/account/appointments/${id}`;

export function accountJoinStatus(id: string): Promise<JoinStatus> {
  return apiFetch(`${base(id)}/join-status`);
}

export function accountJoin(id: string): Promise<JoinResponse> {
  return apiFetch(`${base(id)}/join`, { method: "POST" });
}

export function accountRescheduleOptions(id: string): Promise<RescheduleOptions> {
  return apiFetch(`${base(id)}/reschedule-options`);
}

export function accountReschedule(id: string, newSlotId: string): Promise<RescheduleResponse> {
  return apiFetch(`${base(id)}/reschedule`, {
    method: "POST",
    body: JSON.stringify({ newSlotId }),
  });
}

export function accountCancel(id: string): Promise<CancelResponse> {
  return apiFetch(`${base(id)}/cancel`, { method: "POST" });
}