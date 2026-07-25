import * as React from "react";
import { Venus, Wind, Brain, Baby, HeartPulse, Sparkles } from "lucide-react";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/shared/reveal";

const AREAS = [
  {
    icon: Venus,
    title: "Women's Health",
    description: "PCOS, hormonal balance, menstrual concerns & more",
  },
  {
    icon: Wind,
    title: "Respiratory Care",
    description: "Asthma, allergies, cough, sinusitis & more",
  },
  {
    icon: Brain,
    title: "Mental Wellness",
    description: "Stress, anxiety, sleep disorders & more",
  },
  {
    icon: Baby,
    title: "Child Health",
    description: "Growth, immunity, school health & more",
  },
  {
    icon: HeartPulse,
    title: "Lifestyle Disorders",
    description: "Thyroid, diabetes, BP, weight management & more",
  },
  {
    icon: Sparkles,
    title: "Skin & Hair",
    description: "Acne, eczema, psoriasis, hair fall & more",
  },
];

export function ConditionsConsulted() {
  return (
    <section className="bg-canvas py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Areas We Specialize In"
          title="Every Consultation Is Personal"
          align="center"
          className="mx-auto"
        />

        <ul className="mx-auto mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS.map((area, i) => (
            <Reveal as="li" key={area.title} delay={i * 0.06} className="h-full">
              <Card className="flex h-full flex-col items-center p-6 text-center shadow-soft">
                <span className="flex size-12 items-center justify-center rounded-full border border-sage/30 text-sage-dark">
                  <area.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg text-ink">
                  {area.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {area.description}
                </p>
              </Card>
            </Reveal>
          ))}
        </ul>

        <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-ink-faint">
          This is a general list of consultation topics — not a diagnosis
          and not a guarantee of outcome. Every consultation is
          personalized; book an appointment to talk through your specific
          situation with the practitioner.
        </p>
      </Container>
    </section>
  );
}
