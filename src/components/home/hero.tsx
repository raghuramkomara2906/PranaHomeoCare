import * as React from "react";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button, ButtonDot } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/shared/reveal";
import {
  BotanicalSprig,
  OrganicBlob,
} from "@/components/shared/botanical-motifs";

const FLOATING_STATS = [
  { icon: HeartHandshake, label: "Free consultation" },
  { icon: Clock, label: "45–60 min first visit" },
  { icon: Video, label: "Online — video or phone" },
];

export function Hero() {
  return (
    <Section tone="canvas" spacing="none" className="relative overflow-hidden pb-16 pt-14 md:pb-24 md:pt-20 lg:pb-28">
      <Container>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-10">
          <Reveal>
            <p className="text-eyebrow text-sage-dark">
              BHMS &bull; Consulting Homeopathic Physician
            </p>
            <h1 className="mt-5 max-w-xl font-display text-4xl leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
              Attentive care for your natural{" "}
              <span className="italic text-sage-dark">well-being</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft md:text-lg">
              Fresh energy, undivided attention, and genuine time to listen to
              your story. Together, we&apos;ll build a gentle, thoughtful path to
              your natural well-being.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/book">
                  Book Consultation
                  <ButtonDot />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/how-it-works">Learn More</Link>
              </Button>
            </div>

            <p className="mt-8 max-w-md text-sm leading-relaxed text-ink-soft">
              A space where your health is heard, valued, and understood.
            </p>
          </Reveal>

          <Reveal delay={0.12} className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm">
              <OrganicBlob className="absolute inset-0 h-full w-full text-sage-light" />
              <BotanicalSprig
                className="absolute -right-6 top-[6%] h-[85%] w-auto text-sage/20"
                aria-hidden="true"
              />
              <div className="absolute inset-[12%] overflow-hidden rounded-[36%]">
  <img
    src="/dr-yamini.jpg"
    alt="Dr. Yamini Veduruparthi"
    className="h-full w-full object-cover object-top"
  />
</div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:absolute lg:right-0 lg:top-6 lg:mt-0 lg:max-w-[13rem] lg:flex-col lg:items-end">
              {FLOATING_STATS.map((stat) => (
                <Card
                  key={stat.label}
                  className="flex w-full items-center gap-3 px-4 py-3 shadow-lifted sm:w-auto lg:w-full"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-light text-sage-dark">
                    <stat.icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block text-sm text-ink">{stat.label}</span>
                  </span>
                </Card>
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}