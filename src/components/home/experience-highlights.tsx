import * as React from "react";
import {
  Sprout,
  Flower2,
  ShieldCheck,
  MessageCircle,
  Lock,
  CalendarCheck2,
} from "lucide-react";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/shared/reveal";

const HIGHLIGHTS = [
  { icon: Sprout, label: "Individualized Treatment" },
  { icon: Flower2, label: "Holistic Approach" },
  { icon: ShieldCheck, label: "Safe & Gentle Care" },
  { icon: MessageCircle, label: "Lifestyle Guidance" },
  { icon: Lock, label: "Confidential Consultations" },
  { icon: CalendarCheck2, label: "Convenient Appointments" },
];

export function ExperienceHighlights() {
  return (
    <section className="border-y border-border bg-canvas-muted py-8 md:py-10">
      <Container>
        <ul className="grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-4">
          {HIGHLIGHTS.map((item, i) => (
            <Reveal
              as="li"
              key={item.label}
              delay={i * 0.05}
              className="flex flex-col items-center gap-2 text-center"
            >
              <item.icon className="size-6 text-sage-dark" aria-hidden="true" />
              <p className="max-w-[8rem] text-xs font-medium leading-snug text-ink-soft">
                {item.label}
              </p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
