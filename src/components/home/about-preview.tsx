import * as React from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, CalendarRange, Camera, CheckCircle2 } from "lucide-react";

import type { Practitioner } from "@/lib/types";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { PlaceholderTag } from "@/components/shared/placeholder-tag";
import { OrganicBlob } from "@/components/shared/botanical-motifs";

export function AboutPreview({
  practitioner,
}: {
  practitioner: Practitioner;
}) {
  return (
    <section className="bg-canvas-muted py-16 md:py-24 lg:py-28">
      <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.8fr_1fr] lg:gap-16">
        <Reveal className="relative mx-auto aspect-[4/5] w-full max-w-sm">
          <OrganicBlob className="absolute inset-0 h-full w-full text-sage-light" />
          <div className="absolute inset-[12%] flex flex-col items-center justify-center gap-2 rounded-[36%] border border-dashed border-sage/40 text-center">
            <Camera className="size-7 text-sage-dark" aria-hidden="true" />
            <p className="max-w-[9rem] text-xs font-medium leading-relaxed text-sage-dark">
              Practitioner photograph — placeholder
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="text-eyebrow text-sage-dark">Why Choose Homeopathy?</p>
          <h2 className="mt-4 font-display text-3xl leading-tight text-ink md:text-4xl">
            {practitioner.name}
          </h2>
          <p className="mt-1 text-base italic text-sage-dark">
            Listening comes before planning.
          </p>

          <div className="mt-5 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <GraduationCap className="size-4 text-sage" aria-hidden="true" />
              {practitioner.qualifications[0]}
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <CalendarRange className="size-4 text-sage" aria-hidden="true" />
              {practitioner.yearsExperiencePlaceholder}
            </div>
          </div>
          <PlaceholderTag className="mt-3" />

          <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-soft">
            {practitioner.philosophy}
          </p>

          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {practitioner.values.map((value) => (
              <li key={value} className="flex items-start gap-2 text-sm text-ink-soft">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage-dark" aria-hidden="true" />
                {value}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-8 border-t border-border pt-6">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-3xl text-ink">15+</p>
                <PlaceholderTag label="Placeholder" />
              </div>
              <p className="mt-1 text-sm text-ink-soft">Years of Experience</p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-3xl text-ink">5,000+</p>
                <PlaceholderTag label="Placeholder" />
              </div>
              <p className="mt-1 text-sm text-ink-soft">Happy Patients</p>
            </div>
          </div>

          <Button asChild variant="link" className="mt-6">
            <Link href="/about">
              Learn more about {practitioner.name}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
