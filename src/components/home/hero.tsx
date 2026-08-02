import * as React from "react";
import Link from "next/link";
import { Camera, Clock, HeartHandshake, Video } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button, ButtonDot } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/shared/reveal";
import {
  BotanicalSprig,
  OrganicBlob,
} from "@/components/shared/botanical-motifs";


export function Hero() {
  return (
    <Section tone="canvas" spacing="none" className="relative overflow-hidden pb-16 pt-14 md:pb-24 md:pt-20 lg:pb-28">
      <Container>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-10">
          <Reveal>
            <h1 className="mt-5 max-w-xl font-display text-4xl leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
              Attentive care for your natural{" "}
              <span className="italic text-sage-dark">well-being</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft md:text-lg">
              Fresh energy, undivided attention, and genuine time to listen to
              your story. Together, we&apos;ll build a gentle, thoughtful path to
              your natural well-being.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/book">
                  Book Consultation
                  <ButtonDot />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/how-it-works">Learn More</Link>
              </Button>
            </div>

            <p className="mt-8 max-w-md text-sm leading-relaxed text-ink-soft">
              A space where your health is heard, valued, and understood.
            </p>
          </Reveal>

          <Reveal delay={0.12} className="relative mx-auto w-full max-w-xl lg:-ml-6 lg:max-w-none">
            <div className="relative mx-auto aspect-[8/10] w-full max-w-lg lg:max-w-2xl">
              <OrganicBlob className="absolute inset-0 h-full w-full text-sage-light" />
              <BotanicalSprig
                className="absolute -right-6 top-[6%] h-[85%] w-auto text-sage/20"
                aria-hidden="true"
              />
              <img
                src="/images/home.jpg"
                alt="Dr. Yamini Veduruparthi"
                className="absolute inset-[2%] h-[96%] w-[96%] object-cover object-top"
                style={{
                  maskImage:
                    "radial-gradient(ellipse 78% 100% at 68% 50%, black 38%, transparent 90%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 78% 100% at 68% 50%, black 38%, transparent 90%)",
                }}
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}