import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { BotanicalSprig } from "@/components/shared/botanical-motifs";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <Section spacing="default" className="min-h-[70vh]">
      <Container className="flex flex-col items-center">
        <BotanicalSprig className="mb-6 h-20 w-auto text-sage/50" />
        <div className="w-full max-w-sm">
          <p className="text-eyebrow text-center text-sage-dark">Login</p>
          <h1 className="mt-3 text-center font-display text-3xl leading-tight text-ink">
            Welcome back
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-ink-soft">
            Log in to manage your appointments, or your consultations and
            availability if you&apos;re the practitioner.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-sage-dark underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </Container>
    </Section>
  );
}
