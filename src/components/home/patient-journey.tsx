import * as React from "react";
import {
  CalendarCheck2,
  MessagesSquare,
  ClipboardList,
  FileText,
  RefreshCcw,
} from "lucide-react";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/shared/reveal";

const JOURNEY = [
  {
    icon: CalendarCheck2,
    title: "Book Appointment",
    description:
      "Choose a morning or evening online slot that fits your schedule — no waiting rooms.",
  },
  {
    icon: MessagesSquare,
    title: "Consultation",
    description:
      "An unhurried conversation where I take the full time to listen to your health story and goals.",
  },
  {
    icon: ClipboardList,
    title: "Assessment",
    description:
      "Together, we review your overall health picture to understand the root cause of your concerns.",
  },
  {
    icon: FileText,
    title: "Personalized Care",
    description:
      "A homeopathic approach shaped thoughtfully around your individual health picture.",
  },
  {
    icon: RefreshCcw,
    title: "Follow-up",
    description:
      "Ongoing check-ins where I track your progress and keep the conversation going over time.",
  },
];

export function PatientJourney() {
  return (
    <section className="bg-canvas py-16 md:py-24 lg:py-28">
      <Container className="max-w-2xl">
        <SectionHeading
          eyebrow="How It Works"
          title="A Relationship, Not a One-Time Visit"
          align="center"
          className="mx-auto"
        />

        <ol className="relative mt-14 space-y-8">
          <div
            aria-hidden="true"
            className="absolute left-6 top-2 h-[calc(100%-2.5rem)] w-px bg-border-strong"
          />
          {JOURNEY.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 0.07}>
              <div className="relative flex items-start gap-5">
                <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border border-sage/40 bg-surface text-sage-dark shadow-soft">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <div className="pt-2.5">
                  <h3 className="font-display text-lg text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                    {step.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>

        <p className="mt-10 text-center font-display text-lg italic text-sage-dark">
          And when a new concern comes up, our conversation continues.
        </p>
      </Container>
    </section>
  );
}