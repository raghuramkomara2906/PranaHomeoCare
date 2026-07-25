import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { BotanicalSprig } from "@/components/shared/botanical-motifs";

export function FinalCta() {
  return (
    <section className="bg-canvas py-16 md:py-24">
      <Container>
        <Reveal className="relative overflow-hidden rounded-xl border border-border bg-sage-light px-6 py-16 text-center shadow-soft md:py-20">
          <BotanicalSprig
            className="pointer-events-none absolute -left-8 bottom-0 hidden h-56 w-auto text-sage/15 md:block"
          />
          <BotanicalSprig
            className="pointer-events-none absolute -right-8 bottom-0 hidden h-56 w-auto rotate-12 text-sage/15 md:block"
          />
          <div className="relative mx-auto flex max-w-xl flex-col items-center">
            <h2 className="font-display text-3xl leading-tight text-ink md:text-4xl">
              Taking the First Step Toward Better Health Begins With a
              Conversation.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink-soft">
              No pressure, no obligation — just a conversation, at a time
              that works for you.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/book">
                Book Your Consultation
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
