"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  useRegisterWithMobile,
  useRegisterWithEmail,
} from "@/hooks/use-account";
import { ApiError } from "@/lib/api-client";
import { Container } from "@/components/ui/container";
import { Button, ButtonDot } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Method = "mobile" | "email";

export default function RegisterPage() {
  const router = useRouter();
  const [method, setMethod] = React.useState<Method>("mobile");

  const regMobile = useRegisterWithMobile();
  const regEmail = useRegisterWithEmail();

  const [name, setName] = React.useState("");
  const [mobile, setMobile] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const isPending = regMobile.isPending || regEmail.isPending;

  const error =
    regMobile.error instanceof ApiError
      ? regMobile.error.message
      : regMobile.isError
        ? "Something went wrong. Please try again."
        : regEmail.error instanceof ApiError
          ? regEmail.error.message
          : regEmail.isError
            ? "Something went wrong. Please try again."
            : null;

  function submitMobile(e: React.FormEvent) {
    e.preventDefault();
    regMobile.mutate(
      {
        mobileNumber: mobile.trim(),
        password,
        fullName: name.trim() || undefined,
      },
      { onSuccess: () => router.replace("/account") },
    );
  }

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    regEmail.mutate(
      {
        email: email.trim(),
        password,
        fullName: name.trim() || undefined,
      },
      { onSuccess: () => router.replace("/account") },
    );
  }

  return (
    <div className="bg-canvas min-h-screen py-16">
      <Container className="max-w-sm">
        <h1 className="font-display text-3xl text-ink">Create account</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Save your appointments and manage bookings in one place.
        </p>

        {/* Method toggle */}
        <div className="mt-8 flex rounded-xl border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setMethod("mobile")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              method === "mobile"
                ? "bg-sage text-ink-on-dark shadow-soft"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            Mobile Number
          </button>
          <button
            type="button"
            onClick={() => setMethod("email")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              method === "email"
                ? "bg-sage text-ink-on-dark shadow-soft"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            Email Address
          </button>
        </div>

        {/* Mobile registration */}
        {method === "mobile" && (
          <form onSubmit={submitMobile} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name-m">Full name (optional)</Label>
              <Input
                id="name-m"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <Label htmlFor="mobile">Mobile number</Label>
              <Input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile number"
                required
              />
              <p className="mt-1 text-xs text-ink-faint">
                Used for appointment reminders when SMS is available.
              </p>
            </div>
            <div>
              <Label htmlFor="pass-m">Password</Label>
              <Input
                id="pass-m"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating account..." : "Create account"}
              {!isPending && <ButtonDot />}
            </Button>
          </form>
        )}

        {/* Email registration */}
        {method === "email" && (
          <form onSubmit={submitEmail} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name-e">Full name (optional)</Label>
              <Input
                id="name-e"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="pass-e">Password</Label>
              <Input
                id="pass-e"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating account..." : "Create account"}
              {!isPending && <ButtonDot />}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink-faint">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-sage-dark underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Container>
    </div>
  );
}