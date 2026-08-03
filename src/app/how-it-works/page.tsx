import type { Metadata } from "next";
import Link from "next/link";

import { mockFaqs } from "@/data/faqs";
import type { FaqCategory } from "@/lib/types/faq";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section";
import { Button, ButtonDot } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Everything you need to know about booking a free online homeopathic consultation with Dr. Yamini Veduruparthi.",
};

const CATEGORY_ORDER: FaqCategory[] = [
  "Appointments",
  "Online Consultations",
  "Rescheduling and Cancellations",
  "Technical Support",
  "Privacy",
];

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Appointments: "Booking, duration, cost, and what to prepare",
  "Online Consultations": "How sessions work, video vs phone, joining",
  "Rescheduling and Cancellations": "Changing or cancelling your booking",
  "Technical Support": "OTP issues, lost links, troubleshooting",
  Privacy: "Your data, your mobile number, your privacy",
};

export default function FaqPage() {
  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof mockFaqs>>(
    (acc, cat) => {
      const items = mockFaqs.filter((f) => f.category === cat);
      if (items.length) acc[cat] = items;
      return acc;
    },
    {}
  );

  return (
    <div className="bg-canvas">
      <section className="py-14 md:py-20">
        <Container className="max-w-2xl">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions & Answers"
            lede="Everything you need to know before your first consultation."
            align="center"
            className="mx-auto"
          />

          <div className="mt-12 space-y-10">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="mb-3">
                  <p className="font-mono text-xs uppercase tracking-widest text-sage-dark">
                    {category}
                  </p>
                  {CATEGORY_DESCRIPTIONS[category] && (
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {CATEGORY_DESCRIPTIONS[category]}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-border bg-surface px-6">
                  <Accordion type="multiple">
                    {items.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger>{faq.question}</AccordionTrigger>
                        <AccordionContent>{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            ))}
          </div>

          {/* Still have a question */}
          <div className="mt-14 rounded-xl border border-border bg-surface p-8 text-center">
            <p className="font-display text-xl text-ink">
              Still have a question?
            </p>
            <p className="mt-2 text-ink-soft">
              Reach out directly — we&apos;re happy to help before you book.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/book">
                  Book a consultation
                  <ButtonDot />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}