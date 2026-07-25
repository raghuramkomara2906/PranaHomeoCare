import * as React from "react";
import { UserPlus, CalendarSearch, MailCheck, LogIn } from "lucide-react";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/shared/reveal";

const STEPS = [
  {
    icon: UserPlus,
    title: "Create an account",
    description: "Register with your name, email, and a few basic details.",
  },
  {
    icon: CalendarSearch,
    title: "Choose an available time",
    description: "Browse real-time openings and pick a slot that suits you.",
  },
  {
    icon: MailCheck,
    title: "Receive confirmation",
    description: "Get your appointment details and reference number by email.",
  },
  {
    icon: LogIn,
    title: "Log in and join the consultation",
    description: "Sign in when your window opens and join the video call.",
  },
];

export function HowItWorksPreview() {
  return (
    <section className="bg-canvas-muted py-16 md:py-24 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="How It Works"
          title="From Booking to Consultation in Four Steps"
          align="center"
          className="mx-auto"
        />

        <ol className="relative mt-14 grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-6">
          <div
            aria-hidden="true"
            className="absolute left-6 top-0 hidden h-full w-px bg-border-strong md:top-6 md:left-0 md:h-px md:w-full"
          />
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 0.08} className="relative">
              <div className="flex items-start gap-4 md:flex-col md:items-center md:text-center">
                <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border border-sage/40 bg-surface text-sage-dark shadow-soft">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <div className="md:mt-4">
                  <p className="text-eyebrow text-ink-faint">
                    Step {i + 1}
                  </p>
                  <h3 className="mt-1 font-display text-lg text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft md:max-w-[14rem]">
                    {step.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
