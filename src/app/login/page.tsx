"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api-client";
import { useAccountLogin, useAccountMe } from "@/hooks/use-account";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const me = useAccountMe();
  const login = useAccountLogin();
  const [mobile, setMobile] = React.useState("");
  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    if (me.data) router.replace("/account");
  }, [me.data, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate(
      { mobileNumber: mobile.trim(), password },
      { onSuccess: () => router.replace("/account") }
    );
  }

  const error =
    login.error instanceof ApiError
      ? login.error.message
      : login.isError
        ? "Something went wrong. Please try again."
        : null;

  return (
    <Container className="flex min-h-[70vh] max-w-md flex-col justify-center py-16">
      <h1 className="font-display text-3xl text-ink">Sign in</h1>
      <p className="mt-2 text-ink-soft">
        View and manage your appointments.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
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
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-clay-dark">{error}</p>}
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 flex justify-between text-sm text-ink-soft">
        <Link href="/register" className="text-sage-dark hover:underline">
          Create an account
        </Link>
        <Link href="/forgot-password" className="hover:underline">
          Forgot password?
        </Link>
      </div>
    </Container>
  );
}