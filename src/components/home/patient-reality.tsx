import * as React from "react";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/shared/reveal";
import { BotanicalDivider } from "@/components/shared/botanical-motifs";

export function PatientReality() {
  return (
    <section className="bg-canvas py-16 md:py-24">
      <Container className="max-w-2xl text-center">
        <Reveal>
          <p className="font-display text-2xl leading-relaxed text-ink md:text-3xl">
            Living with health concerns can feel overwhelming — especially when
            consultations feel rushed or leave you with more questions than
            answers.
          </p>
          <p className="mt-6 font-display text-2xl italic leading-relaxed text-sage-dark md:text-3xl">
            You deserve a space where your health is heard, valued, and
            understood.
          </p>
          <BotanicalDivider className="mx-auto mt-8 h-6 w-auto" />
        </Reveal>
      </Container>
    </section>
  );
}