import * as React from "react";
import Link from "next/link";
import { Camera, Compass, Leaf, Star, Users } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button, ButtonDot } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlaceholderTag } from "@/components/shared/placeholder-tag";
import { Reveal } from "@/components/shared/reveal";
import {
  BotanicalSprig,
  OrganicBlob,
} from "@/components/shared/botanical-motifs";

const FLOATING_STATS = [
  { icon: Users, label: "Consultations", value: "5,000+", isPlaceholder: true },
  { icon: Leaf, label: "Evidence-informed Care", isPlaceholder: false },
  { icon: Compass, label: "Online & In-person", isPlaceholder: false },
];

export function Hero() {
  return (
    <Section tone="canvas" spacing="none" className="relative overflow-hidden pb-16 pt-14 md:pb-24 md:pt-20 lg:pb-28">
      <Container>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-10">
          <Reveal>
            <p className="text-eyebrow text-sage-dark">
              Holistic &bull; Personalized &bull; Compassionate Care
            </p>
            <h1 className="mt-5 max-w-xl font-display text-4xl leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
              Personalized Homeopathic Care for Lifelong{" "}
              <span className="italic text-sage-dark">Wellness</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft md:text-lg">
              Individualized consultations with a patient-centered approach,
              combining compassionate care with holistic healthcare
              principles.
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

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-2.5" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="flex size-9 items-center justify-center rounded-full border-2 border-canvas bg-sage-light text-xs font-medium text-sage-dark"
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-sand-dark" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-1 flex items-center gap-2 text-sm text-ink-soft">
                  5,000+ Happy Patients
                  <PlaceholderTag label="Count placeholder" />
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12} className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm">
              <OrganicBlob className="absolute inset-0 h-full w-full text-sage-light" />
              <BotanicalSprig
                className="absolute -right-6 top-[6%] h-[85%] w-auto text-sage/20"
                aria-hidden="true"
              />
              <div className="absolute inset-[12%] flex flex-col items-center justify-center gap-2 rounded-[36%] border border-dashed border-sage/40 text-center">
                <Camera className="size-7 text-sage-dark" aria-hidden="true" />
                <p className="max-w-[9rem] text-xs font-medium leading-relaxed text-sage-dark">
                  Practitioner photograph — placeholder
                </p>
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
                    {stat.value ? (
                      <span className="font-display text-lg text-ink">
                        {stat.value}
                      </span>
                    ) : null}
                    <span className="block text-xs text-ink-soft">
                      {stat.label}
                    </span>
                    {stat.isPlaceholder ? (
                      <PlaceholderTag label="Count placeholder" className="mt-1" />
                    ) : null}
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
