"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api-client";
import { useAdminLogin } from "@/hooks/use-admin-auth";
import { Container } from "@/components/ui/container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAdminLogin();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    login.mutate(
      { email, password },
      { onSuccess: () => router.replace("/admin") }
    );
  }

  const errorMessage = login.isError
    ? login.error instanceof ApiError
      ? login.error.message
      : "Something went wrong. Please try again."
    : null;

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Practitioner sign in</CardTitle>
          <CardDescription>Access the appointment dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {errorMessage && (
              <p role="alert" className="text-sm text-clay-dark">
                {errorMessage}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}