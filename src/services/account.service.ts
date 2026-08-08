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

// ---------------------------------------------------------------------------
// OTP-based registration (existing — re-enabled when DLT SMS is ready)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Password-only registration (new — no OTP required)
// ---------------------------------------------------------------------------

export function registerWithMobile(input: {
  mobileNumber: string;
  password: string;
  fullName?: string;
}): Promise<AccountMe> {
  return apiFetch("/api/v1/account/register/mobile", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function registerWithEmail(input: {
  email: string;
  password: string;
  fullName?: string;
}): Promise<AccountMe> {
  return apiFetch("/api/v1/account/register/email", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// Login (existing OTP-verified + new password-only)
// ---------------------------------------------------------------------------

export function accountLogin(input: {
  mobileNumber: string;
  password: string;
}): Promise<AccountMe> {
  return apiFetch("/api/v1/account/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginWithMobile(input: {
  mobileNumber: string;
  password: string;
}): Promise<AccountMe> {
  return apiFetch("/api/v1/account/login/mobile", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginWithEmail(input: {
  email: string;
  password: string;
}): Promise<AccountMe> {
  return apiFetch("/api/v1/account/login/email", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export function accountLogout(): Promise<void> {
  return apiFetch("/api/v1/account/logout", { method: "POST" });
}

export function getAccountMe(): Promise<AccountMe> {
  return apiFetch("/api/v1/account/me");
}

// ---------------------------------------------------------------------------
// Password reset (existing — re-enabled when DLT SMS is ready)
// ---------------------------------------------------------------------------

export function passwordResetRequestOtp(
  mobileNumber: string,
): Promise<AccountOtpChallenge> {
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

// ---------------------------------------------------------------------------
// Appointments (unchanged)
// ---------------------------------------------------------------------------

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

export function accountReschedule(
  id: string,
  newSlotId: string,
): Promise<RescheduleResponse> {
  return apiFetch(`${base(id)}/reschedule`, {
    method: "POST",
    body: JSON.stringify({ newSlotId }),
  });
}

export function accountCancel(id: string): Promise<CancelResponse> {
  return apiFetch(`${base(id)}/cancel`, { method: "POST" });
}