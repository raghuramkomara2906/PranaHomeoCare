"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  useLoginWithMobile,
  useLoginWithEmail,
  useAccountMe,
} from "@/hooks/use-account";
import { ApiError } from "@/lib/api-client";
import { Container } from "@/components/ui/container";
import { Button, ButtonDot } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Method = "mobile" | "email";

export default function LoginPage() {
  const router = useRouter();
  const me = useAccountMe(true);

  // Redirect if already logged in
  React.useEffect(() => {
    if (me.data) router.replace("/account");
  }, [me.data, router]);

  const [method, setMethod] = React.useState<Method>("mobile");

  const loginMobile = useLoginWithMobile();
  const loginEmail = useLoginWithEmail();

  const [mobile, setMobile] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const isPending = loginMobile.isPending || loginEmail.isPending;

  const error =
    loginMobile.error instanceof ApiError
      ? loginMobile.error.message
      : loginMobile.isError
        ? "Incorrect mobile number or password."
        : loginEmail.error instanceof ApiError
          ? loginEmail.error.message
          : loginEmail.isError
            ? "Incorrect email or password."
            : null;

  function submitMobile(e: React.FormEvent) {
    e.preventDefault();
    loginMobile.mutate(
      { mobileNumber: mobile.trim(), password },
      { onSuccess: () => router.replace("/account") },
    );
  }

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    loginEmail.mutate(
      { email: email.trim(), password },
      { onSuccess: () => router.replace("/account") },
    );
  }

  return (
    <div className="bg-canvas min-h-screen py-16">
      <Container className="max-w-sm">
        <h1 className="font-display text-3xl text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Access your appointments and account details.
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

        {/* Mobile login */}
        {method === "mobile" && (
          <form onSubmit={submitMobile} className="mt-6 space-y-4">
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
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pass-m">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-sage-dark underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="pass-m"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Signing in..." : "Sign in"}
              {!isPending && <ButtonDot />}
            </Button>
          </form>
        )}

        {/* Email login */}
        {method === "email" && (
          <form onSubmit={submitEmail} className="mt-6 space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="pass-e">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-sage-dark underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="pass-e"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Signing in..." : "Sign in"}
              {!isPending && <ButtonDot />}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink-faint">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-sage-dark underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </Container>
    </div>
  );
}