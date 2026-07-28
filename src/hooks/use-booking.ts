"use client";

import { useMutation } from "@tanstack/react-query";

import {
  createBookingRequest,
  resendOtp,
  verifyOtp,
} from "@/services/booking.service";
import type { BookingRequestInput } from "@/lib/types/api";

export function useCreateBookingRequest() {
  return useMutation({
    mutationFn: (input: BookingRequestInput) => createBookingRequest(input),
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (bookingRequestId: string) => resendOtp(bookingRequestId),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (vars: { bookingRequestId: string; otp: string }) =>
      verifyOtp(vars.bookingRequestId, vars.otp),
  });
}