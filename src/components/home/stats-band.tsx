import * as React from "react";

import { Container } from "@/components/ui/container";
import { PlaceholderTag } from "@/components/shared/placeholder-tag";
import { Reveal } from "@/components/shared/reveal";

const STATS = [
  { value: "2+", label: "Years of Experience" },
  { value: "100+", label: "Happy Patients" },
  { value: "30+", label: "Medical Camps" },
  { value: "100+", label: "Online Consultations" },
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
      </Container>
    </section>
  );
}
