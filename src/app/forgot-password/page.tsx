"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api-client";
import {
  usePasswordResetConfirm,
  usePasswordResetRequestOtp,
} from "@/hooks/use-account";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const requestOtp = usePasswordResetRequestOtp();
  const confirm = usePasswordResetConfirm();
  const [step, setStep] = React.useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [done, setDone] = React.useState(false);

  function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    requestOtp.mutate(mobile.trim(), { onSuccess: () => setStep("otp") });
  }

  function finish(e: React.FormEvent) {
    e.preventDefault();
    confirm.mutate(
      { mobileNumber: mobile.trim(), otp: otp.trim(), password },
      {
        onSuccess: () => {
          setDone(true);
          setTimeout(() => router.replace("/login"), 1200);
        },
      }
    );
  }

  const err = (m: { error: unknown; isError: boolean }, fallback: string) =>
    m.error instanceof ApiError ? m.error.message : m.isError ? fallback : null;

  return (
    <Container className="flex min-h-[70vh] max-w-md flex-col justify-center py-16">
      <h1 className="font-display text-3xl text-ink">Reset your password</h1>

      {done ? (
        <p className="mt-4 text-sage-dark">
          Password updated. Redirecting you to sign in…
        </p>
      ) : step === "mobile" ? (
        <form onSubmit={sendOtp} className="mt-8 space-y-4">
          <p className="text-ink-soft">
            Enter your mobile number and we&apos;ll send a verification code.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="mobile">Mobile number</Label>
            <Input
              id="mobile"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="10-digit mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>
          {err(requestOtp, "We couldn't send a code. Please try again.") && (
            <p className="text-sm text-clay-dark">
              {err(requestOtp, "We couldn't send a code. Please try again.")}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={requestOtp.isPending}>
            {requestOtp.isPending ? "Sending code…" : "Send verification code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={finish} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="otp">Verification code</Label>
            <Input
              id="otp"
              inputMode="numeric"
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">New password (min 8 characters)</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {err(confirm, "We couldn't reset your password. Please try again.") && (
            <p className="text-sm text-clay-dark">
              {err(confirm, "We couldn't reset your password. Please try again.")}
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={confirm.isPending || password.length < 8}
          >
            {confirm.isPending ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-ink-soft">
        <Link href="/login" className="text-sage-dark hover:underline">
          Back to sign in
        </Link>
      </p>
    </Container>
  );
}