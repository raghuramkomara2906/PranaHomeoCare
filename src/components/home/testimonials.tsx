"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";

import type { Testimonial } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/shared/reveal";

export function Testimonials({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    // Embla determines the true initial slide internally; syncing local
    // state to it here (rather than assuming index 0) is synchronizing
    // with an external system's imperative API, a sanctioned effect
    // use-case. Future changes arrive via the event subscriptions below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="bg-canvas-muted py-16 md:py-24 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="Patient Experiences"
          title="What Patients Say"
          align="center"
          className="mx-auto"
        />

        <Reveal delay={0.1} className="mt-10">
          <div className="relative mx-auto max-w-2xl">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {testimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="min-w-0 shrink-0 grow-0 basis-full px-2"
                  >
                    <Card className="flex flex-col items-center p-8 text-center shadow-lifted">
                      <span className="flex size-12 items-center justify-center rounded-full bg-sage-light text-sm font-medium text-sage-dark">
                        {testimonial.attribution.slice(0, 1)}
                      </span>
                      <div className="mt-4 flex items-center gap-1 text-sand-dark" aria-hidden="true">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-current" />
                        ))}
                      </div>
                      <p className="mt-4 font-display text-xl leading-relaxed text-ink">
                        &ldquo;{testimonial.quote}&rdquo;
                      </p>
                      <p className="mt-5 text-sm text-ink-soft">
                        {testimonial.attribution}
                      </p>
                      <Badge variant="sage" className="mt-3">
                        {testimonial.serviceName}
                      </Badge>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                className="flex size-9 items-center justify-center rounded-full border border-border-strong text-ink-soft transition-colors hover:border-sage hover:text-sage-dark"
                aria-label="Previous testimonial"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>

              <div className="flex items-center gap-2">
                {testimonials.map((testimonial, i) => (
                  <button
                    key={testimonial.id}
                    type="button"
                    onClick={() => emblaApi?.scrollTo(i)}
                    aria-label={`Go to testimonial ${i + 1}`}
                    aria-current={selectedIndex === i}
                    className={cn(
                      "size-2 rounded-full transition-colors",
                      selectedIndex === i ? "bg-sage-dark" : "bg-border-strong"
                    )}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                className="flex size-9 items-center justify-center rounded-full border border-border-strong text-ink-soft transition-colors hover:border-sage hover:text-sage-dark"
                aria-label="Next testimonial"
              >
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </Reveal>

        <p className="mx-auto mt-10 max-w-lg text-center text-xs leading-relaxed text-ink-faint">
          Testimonials shown are placeholders. Real testimonials are only
          published with the patient&apos;s explicit permission.
        </p>
      </Container>
    </section>
  );
}
