import type { Metadata } from "next";
import Link from "next/link";

import { mockTestimonials } from "@/data/testimonials";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section";
import { Button, ButtonDot } from "@/components/ui/button";
import { TestimonialsColumn } from "@/components/shared/testimonials-column";

export const metadata: Metadata = {
  title: "Patient Stories",
  description:
    "Experiences shared by patients of Dr. Yamini Veduruparthi — Prana Homeo Care.",
};

// Split 6 testimonials into 3 columns of 2
const col1 = mockTestimonials.slice(0, 2);
const col2 = mockTestimonials.slice(2, 4);
const col3 = mockTestimonials.slice(4, 6);

export default function StoriesPage() {
  return (
    <div className="bg-canvas">
      {/* Header */}
      <section className="py-14 md:py-20">
        <Container>
          <SectionHeading
            eyebrow="Patient Stories"
            title="What patients are saying"
            lede="Shared with permission. Every consultation is different — these are a few experiences from people who took the first step."
            align="center"
            className="mx-auto max-w-xl"
          />

          {/* Animated columns */}
          <div
            className="mt-12 flex gap-5 justify-center"
            style={{ height: 480, overflow: "hidden", maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)" }}
          >
            {/* Column 1 — visible on all screens */}
            <TestimonialsColumn
              testimonials={col1}
              duration={14}
            />

            {/* Column 2 — hidden on mobile */}
            <TestimonialsColumn
              testimonials={col2}
              duration={18}
              className="hidden sm:block"
            />

            {/* Column 3 — hidden on tablet and below */}
            <TestimonialsColumn
              testimonials={col3}
              duration={12}
              className="hidden lg:block"
            />
          </div>

          {/* Disclaimer */}
          <div className="mt-10 max-w-2xl mx-auto rounded-xl border border-border bg-surface p-6">
            <p className="text-center text-xs leading-relaxed text-ink-faint">
              Experiences shared above are individual accounts and do not
              represent guaranteed outcomes. Homeopathic consultations support
              overall well-being and are not a substitute for professional
              medical advice, diagnosis, or treatment. Results vary from person
              to person.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-8 max-w-2xl mx-auto rounded-xl border border-sage bg-sage-light/40 p-8 text-center shadow-lifted">
            <p className="font-display text-xl text-ink">
              Ready to share your own journey?
            </p>
            <p className="mt-2 text-ink-soft">
              Start with a free 30-minute online consultation.
            </p>
            <Button asChild className="mt-5">
              <Link href="/book">
                Book a consultation
                <ButtonDot />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}