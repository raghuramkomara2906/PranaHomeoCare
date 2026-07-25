import * as React from "react";

import { Container } from "@/components/ui/container";
import { PlaceholderTag } from "@/components/shared/placeholder-tag";
import { Reveal } from "@/components/shared/reveal";

const STATS = [
  { value: "15+", label: "Years of Experience" },
  { value: "5,000+", label: "Happy Patients" },
  { value: "50+", label: "Medical Camps" },
  { value: "10,000+", label: "Online Consultations" },
];

export function StatsBand() {
  return (
    <section className="bg-canvas-muted py-14 md:py-16">
      <Container>
        <ul className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <Reveal
              as="li"
              key={stat.label}
              delay={i * 0.06}
              className="text-center"
            >
              <p className="font-display text-4xl text-ink md:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-ink-soft">{stat.label}</p>
            </Reveal>
          ))}
        </ul>
        <div className="mt-6 flex justify-center">
          <PlaceholderTag label="Figures are placeholders — verify before publishing" />
        </div>
      </Container>
    </section>
  );
}
