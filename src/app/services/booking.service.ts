import { apiFetch } from "@/lib/api-client";
import type {
  AppointmentConfirmation,
  BookingRequestInput,
  BookingRequestResponse,
  OtpResendResponse,
} from "@/lib/types/api";

/**
 * Booking flow: create a hold + receive an OTP, resend it (under cooldown),
 * then verify to atomically confirm the appointment.
 */
export async function createBookingRequest(
  input: BookingRequestInput
): Promise<BookingRequestResponse> {
  return apiFetch<BookingRequestResponse>("/api/v1/booking-requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function resendOtp(
  bookingRequestId: string
): Promise<OtpResendResponse> {
  return apiFetch<OtpResendResponse>(
    `/api/v1/booking-requests/${encodeURIComponent(bookingRequestId)}/otp/resend`,
    { method: "POST" }
  );
}

export async function verifyOtp(
  bookingRequestId: string,
  otp: string
): Promise<AppointmentConfirmation> {
  return apiFetch<AppointmentConfirmation>(
    `/api/v1/booking-requests/${encodeURIComponent(bookingRequestId)}/verify`,
    { method: "POST", body: JSON.stringify({ otp }) }
  );
}

/** Generate the idempotency key to send with a booking request. Keep it stable
 * across retries of the same submission (double-clicks, OTP-send failures). */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}