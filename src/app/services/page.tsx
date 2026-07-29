import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Phone, ShieldCheck, Sparkles, Video } from "lucide-react";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section";
import { Button, ButtonDot } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Consultation Services",
  description:
    "A free 30-minute online homeopathic consultation with Dr. Yamini Veduruparthi — by private video call or phone, at a time that fits your day.",
};

const MODES = [
  {
    icon: Video,
    title: "Video Consultation",
    description:
      "A private video call over a secure link. You'll receive the joining details before your appointment.",
  },
  {
    icon: Phone,
    title: "Teleconsultation",
    description:
      "Prefer a phone conversation? Call the clinic at your scheduled time — no video needed.",
  },
];

const INCLUDED = [
  "An unhurried, one-to-one conversation about your health",
  "Time to share your history, patterns, and concerns",
  "A personalized homeopathic approach shaped around you",
  "Clear next steps and follow-up when you need it",
];

export default function ServicesPage() {
  return (
    <div className="bg-canvas">
      {/* Free consultation */}
      <section className="py-16 md:py-24">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="Consultation Services"
            title="A Free Online Consultation"
            lede="Personalized homeopathic care from the comfort of your home. Every session is online, and your first consultation is completely free."
            align="center"
            className="mx-auto"
          />

          <Card className="mt-10 flex flex-col items-center border-sage bg-sage-light/40 p-8 text-center shadow-lifted">
            <span className="flex size-12 items-center justify-center rounded-full bg-sage text-ink-on-dark">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-2xl text-ink">
              Initial Consultation
            </h2>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-sage-dark">
              30 minutes · Online
            </p>
            <p className="mx-auto mt-4 max-w-md text-ink-soft">
              A comprehensive first conversation to understand your health
              concerns and how best to support your well-being.
            </p>
            <p className="mt-6 font-display text-4xl text-sage-dark">FREE</p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/book">
                Book Your Consultation
                <ButtonDot />
              </Link>
            </Button>
          </Card>
        </Container>
      </section>

      {/* Modes */}
      <section className="pb-8">
        <Container className="max-w-3xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {MODES.map((mode) => (
              <Card key={mode.title} className="flex h-full flex-col p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-sage-light text-sage-dark">
                  <mode.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg text-ink">
                  {mode.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {mode.description}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* What's included + hours */}
      <section className="py-12 md:py-16">
        <Container className="max-w-3xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="p-7">
              <span className="flex size-10 items-center justify-center rounded-full bg-sage-light text-sage-dark">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-lg text-ink">
                What&apos;s included
              </h3>
              <ul className="mt-3 space-y-2">
                {INCLUDED.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-sm leading-relaxed text-ink-soft"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-sage"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-7">
              <span className="flex size-10 items-center justify-center rounded-full bg-sage-light text-sage-dark">
                <Clock className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-lg text-ink">
                Consultation hours
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Flexible online slots designed to fit around your daily routine.
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-soft">Morning</dt>
                  <dd className="font-mono text-ink">6:00 – 9:00 AM</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-soft">Evening</dt>
                  <dd className="font-mono text-ink">6:00 – 9:00 PM</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-ink-faint">
                Live availability is shown on the booking page.
              </p>
            </Card>
          </div>
        </Container>
      </section>
    </div>
  );
}