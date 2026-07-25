import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { BotanicalSprig } from "@/components/shared/botanical-motifs";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <Section spacing="default" className="min-h-[70vh]">
      <Container className="flex flex-col items-center">
        <BotanicalSprig className="mb-6 h-20 w-auto text-sage/50" />
        <div className="w-full max-w-sm">
          <p className="text-eyebrow text-center text-sage-dark">Register</p>
          <h1 className="mt-3 text-center font-display text-3xl leading-tight text-ink">
            Create your account
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-ink-soft">
            Set up an account to manage your appointments in one place.
            Booking a consultation itself never requires an account.
          </p>

          <div className="mt-8">
            <RegisterForm />
          </div>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-sage-dark underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </Container>
    </Section>
  );
}
