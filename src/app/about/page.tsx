import type { Metadata } from "next";
import Link from "next/link";
import {
  Camera,
  Clock,
  HeartHandshake,
  Phone,
  RefreshCcw,
  Shield,
  Video,
} from "lucide-react";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section";
import { Button, ButtonDot } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About Dr. Yamini Veduruparthi",
  description:
    "Meet Dr. Yamini Veduruparthi, BHMS — Consulting Homeopathic Physician offering free, unhurried online homeopathic consultations.",
};

const VALUES = [
  {
    icon: HeartHandshake,
    title: "Undivided attention",
    body: "Every consultation gets fresh energy and full focus — no rushing, no cutting conversations short.",
  },
  {
    icon: Clock,
    title: "Unhurried conversations",
    body: "30 minutes of genuine time to listen to your health story, concerns, and goals.",
  },
  {
    icon: RefreshCcw,
    title: "An ongoing relationship",
    body: "Health is not a one-time visit. Every follow-up continues from where the last conversation ended.",
  },
  {
    icon: Shield,
    title: "Privacy first",
    body: "Only your name and mobile number are collected. No medical notes stored. No data shared with third parties.",
  },
];

const CONSULT_MODES = [
  {
    icon: Video,
    title: "Video consultation",
    body: "A private Zoom call at your appointment time. The secure joining link is sent by SMS before your session.",
  },
  {
    icon: Phone,
    title: "Phone consultation",
    body: "A regular call to the clinic number at your appointment time. No video, no app — just a phone call.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-canvas">
      {/* Hero — practitioner intro */}
      <section className="py-16 md:py-24">
        <Container className="max-w-4xl">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center">
            {/* Photo placeholder */}
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm">
              <div className="absolute inset-0 rounded-3xl bg-sage-light/60" />
              <div className="absolute inset-[8%] flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-sage/40 text-center">
                <Camera className="size-8 text-sage-dark" aria-hidden="true" />
                <p className="max-w-[10rem] text-xs font-medium leading-relaxed text-sage-dark">
                  Dr. Yamini Veduruparthi
                </p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <p className="text-eyebrow text-sage-dark">
                About the practitioner
              </p>
              <h1 className="mt-3 font-display text-4xl leading-tight text-ink md:text-5xl">
                Dr. Yamini Veduruparthi
              </h1>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest text-sage-dark">
                BHMS · Consulting Homeopathic Physician
              </p>
              <div className="mt-6 space-y-4 text-ink-soft leading-relaxed">
                <p>
                  My commitment to you is simple — fresh energy, undivided
                  attention, and genuine time to listen to your story. Together,
                  we build a gentle, thoughtful path to your natural well-being.
                </p>
                <p>
                  Every consultation is a space where your health is heard,
                  valued, and understood. Not rushed. Not reduced to a single
                  symptom. Seen as a whole.
                </p>
                <p>
                  You deserve a practitioner who gives you time — time to share
                  what's been bothering you, time to ask questions, and time to
                  feel confident about the path ahead.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/book">
                    Book a free consultation
                    <ButtonDot />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/how-it-works">How it works</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Philosophy */}
      <section className="bg-surface py-14 md:py-20">
        <Container className="max-w-2xl text-center">
          <SectionHeading
            eyebrow="Philosophy"
            title="Whole-person care, not symptom management"
            align="center"
            className="mx-auto"
          />
          <div className="mt-6 space-y-4 text-ink-soft leading-relaxed">
            <p>
              Homeopathy views health as an interconnected system — where
              physical symptoms, emotional stress, lifestyle, and daily energy
              all play a role. During a consultation, we look at how your body
              experiences what is bothering you, not just what is bothering you.
            </p>
            <p>
              By understanding your complete health picture, we can suggest a
              personalized approach intended to gently support your overall sense
              of well-being.
            </p>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="py-14 md:py-20">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="What to expect"
            title="A consultation unlike others"
            align="center"
            className="mx-auto"
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {VALUES.map((v) => (
              <Card key={v.title} className="p-7">
                <span className="flex size-10 items-center justify-center rounded-full bg-sage-light text-sage-dark">
                  <v.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg text-ink">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {v.body}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Consultation modes */}
      <section className="bg-surface py-14">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="Online consultations"
            title="Connect from wherever you are"
            lede="All sessions are conducted online — no travel, no waiting rooms."
            align="center"
            className="mx-auto"
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {CONSULT_MODES.map((m) => (
              <Card key={m.title} className="p-7">
                <span className="flex size-10 items-center justify-center rounded-full bg-sage-light text-sage-dark">
                  <m.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg text-ink">
                  {m.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {m.body}
                </p>
              </Card>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Duration", value: "30 minutes" },
              { label: "Cost", value: "Free" },
              { label: "Hours", value: "6–9 AM · 6–9 PM" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-canvas p-5 text-center"
              >
                <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
                  {item.label}
                </p>
                <p className="mt-1 font-display text-xl text-sage-dark">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-14">
        <Container className="max-w-xl text-center">
          <p className="font-display text-2xl text-ink">
            Ready to start your health journey?
          </p>
          <p className="mt-3 text-ink-soft">
            Book a free 30-minute online consultation today.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/book">
                Book a consultation
                <ButtonDot />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/faq">Read FAQs</Link>
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}