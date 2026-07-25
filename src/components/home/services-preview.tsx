import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { Service } from "@/lib/types";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/shared/service-card";
import { Reveal } from "@/components/shared/reveal";

export function ServicesPreview({ services }: { services: Service[] }) {
  return (
    <section className="bg-canvas py-16 md:py-24 lg:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Consultation Services"
            title="Choose the Consultation That Fits"
            lede="Every appointment takes place online, at a time that works for you."
          />
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/services">
              View All Services
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => (
            <Reveal as="li" key={service.id} delay={i * 0.06} className="h-full">
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
