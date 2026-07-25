import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { BotanicalSprig } from "@/components/shared/botanical-motifs";

export function ComingSoon({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Section spacing="default" className="min-h-[70vh]">
      <Container className="flex flex-col items-center py-10 text-center">
        <BotanicalSprig className="mb-6 h-28 w-auto text-sage/50" />
        <p className="text-eyebrow text-sage-dark">{eyebrow}</p>
        <h1 className="mt-4 max-w-xl font-display text-3xl leading-tight text-ink md:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">
          {description}
        </p>
        <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-faint">
          This page is being built in an upcoming phase of the project.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Home
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
