import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { FaqItem } from "@/lib/types";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/shared/reveal";

export function FaqPreview({ faqs }: { faqs: FaqItem[] }) {
  return (
    <section className="bg-canvas-muted py-16 md:py-24 lg:py-28">
      <Container className="max-w-3xl">
        <SectionHeading
          eyebrow="Frequently Asked Questions"
          title="Quick Answers Before You Book"
          align="center"
          className="mx-auto"
        />

        <Reveal delay={0.1} className="mt-10">
          <Accordion
            type="single"
            collapsible
            className="rounded-lg border border-border bg-surface px-6 shadow-soft md:px-8"
          >
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>

        <div className="mt-8 text-center">
          <Button asChild variant="link">
            <Link href="/faq">
              See All Frequently Asked Questions
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
