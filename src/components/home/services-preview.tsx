import * as React from "react";
import Link from "next/link";
import { Clock, ShieldCheck, Sparkles } from "lucide-react";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section";
import { Button, ButtonDot } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

export function ServicesPreview() {
  return (
    <section className="bg-canvas py-16 md:py-24 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="Consultation Services"
          title="Begin Your Health Journey"
          lede="Explore personalized homeopathic care from the comfort of your home. All sessions are conducted online."
          align="center"
          className="mx-auto"
        />

        <div className="mt-12 grid grid-cols-1 items-stretch gap-5 md:grid-cols-3">
          {/* Card 1 — Secure Online Sessions */}
          <Reveal className="h-full">
            <Card className="flex h-full flex-col p-7">
              <span className="flex size-11 items-center justify-center rounded-full bg-sage-light text-sage-dark">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-xl text-ink">
                Secure Online Sessions
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                We connect via a private video call or phone audio — whichever
                you prefer.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink">
                Thorough, unhurried consultations that respect your time and
                comfort.
              </p>
            </Card>
          </Reveal>

          {/* Card 2 — Free Consultation (highlighted) */}
          <Reveal delay={0.06} className="h-full">
            <Card
              className={cn(
                "flex h-full flex-col border-sage bg-sage-light/40 p-7 shadow-lifted",
                "md:-translate-y-2"
              )}
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-sage text-ink-on-dark">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div className="mt-5 flex items-baseline justify-between gap-2">
                <h3 className="font-display text-xl text-ink">
                  Free Consultation
                </h3>
                 <span className="font-mono text-xs uppercase tracking-widest text-sage-dark">
                  30 min
               </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
               A comprehensive first conversation to understand your health
              concerns and how best to support your well-being.
              </p>
              <p className="mt-6 font-display text-3xl text-sage-dark">FREE</p>
              <Button asChild className="mt-5 w-full">
                <Link href="/book">
                  Book Now
                  <ButtonDot />
                </Link>
              </Button>
            </Card>
          </Reveal>

          {/* Card 3 — Consultation Hours */}
          <Reveal delay={0.12} className="h-full">
            <Card className="flex h-full flex-col p-7">
              <span className="flex size-11 items-center justify-center rounded-full bg-sage-light text-sage-dark">
                <Clock className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-xl text-ink">
                Consultation Hours
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
            </Card>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}