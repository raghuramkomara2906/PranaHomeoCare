"use client";

import * as React from "react";

import { ApiError } from "@/lib/api-client";
import { useResendOtp, useVerifyOtp } from "@/hooks/use-booking";
import type { AppointmentConfirmation } from "@/lib/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OtpStep({
  bookingRequestId,
  maskedMobile,
  initialResendSeconds,
  onConfirmed,
}: {
  bookingRequestId: string;
  maskedMobile: string;
  initialResendSeconds: number;
  onConfirmed: (confirmation: AppointmentConfirmation) => void;
}) {
  const [otp, setOtp] = React.useState("");
  const [cooldown, setCooldown] = React.useState(initialResendSeconds);
  const verify = useVerifyOtp();
  const resend = useResendOtp();

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    verify.mutate(
      { bookingRequestId, otp },
      { onSuccess: (confirmation) => onConfirmed(confirmation) }
    );
  }

  function onResend() {
    resend.mutate(bookingRequestId, {
      onSuccess: (r) => {
        setCooldown(r.resendAvailableInSeconds);
        setOtp("");
      },
    });
  }

  const verifyError = verify.isError
    ? verify.error instanceof ApiError
      ? verify.error.message
      : "Verification failed. Please try again."
    : null;
  const resendError =
    resend.isError && resend.error instanceof ApiError
      ? resend.error.message
      : null;

  return (
    <form onSubmit={submit} className="space-y-6">
      <p className="text-ink-soft">
        We sent a 6-digit verification code to{" "}
        <span className="font-mono text-ink">{maskedMobile}</span>. Enter it
        below to confirm your appointment.
      </p>

      <div className="space-y-2">
        <Label htmlFor="otp">Verification code</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="font-mono text-lg tracking-[0.5em]"
          aria-invalid={Boolean(verifyError)}
        />
        {verifyError && <p className="text-sm text-clay-dark">{verifyError}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={verify.isPending || otp.length !== 6}>
        {verify.isPending ? "Verifying…" : "Confirm appointment"}
      </Button>

      <div className="text-center text-sm text-ink-soft">
        {cooldown > 0 ? (
          <span>You can request a new code in {cooldown}s.</span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={resend.isPending}
            className="text-sage-dark underline-offset-4 hover:underline disabled:opacity-50"
          >
            {resend.isPending ? "Sending…" : "Resend code"}
          </button>
        )}
        {resendError && (
          <p className="mt-2 text-clay-dark">{resendError}</p>
        )}
      </div>
    </form>
  );
}