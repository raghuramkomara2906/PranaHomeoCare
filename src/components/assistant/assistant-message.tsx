import * as React from "react";
import Link from "next/link";
import { Mail, Phone, ArrowRight } from "lucide-react";

import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";
import { mockServices } from "@/data/services";
import type { AssistantTurn } from "@/lib/assistant/types";
import { Button } from "@/components/ui/button";

export function AssistantMessage({ turn }: { turn: AssistantTurn }) {
  if (turn.from === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-teal px-4 py-2.5 text-sm text-ink-on-dark">
          {turn.text}
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-3">
        <div className="rounded-2xl rounded-bl-sm bg-sage-light px-4 py-2.5 text-sm leading-relaxed text-ink">
          {turn.text}
        </div>

        {turn.kind === "pricing" ? (
          <ul className="space-y-2 rounded-xl border border-border bg-surface p-3">
            {mockServices.map((service) => (
              <li
                key={service.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-ink-soft">{service.name}</span>
                <span className="font-mono text-ink">
                  {formatPrice(service.price, service.currency)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {turn.kind === "contact" ? (
          <ul className="space-y-2 rounded-xl border border-border bg-surface p-3 text-sm">
            <li className="flex items-center gap-2 text-ink-soft">
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              {siteConfig.contactEmail}
            </li>
            <li className="flex items-center gap-2 text-ink-soft">
              <Phone className="size-4 shrink-0" aria-hidden="true" />
              {siteConfig.contactPhone}
            </li>
          </ul>
        ) : null}

        {turn.kind === "faq-results" ? (
          <ul className="space-y-2">
            {turn.results.map((faq) => (
              <li
                key={faq.id}
                className="rounded-xl border border-border bg-surface p-3"
              >
                <p className="text-sm font-medium text-ink">{faq.question}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {faq.answer}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        {turn.kind === "cta" ? (
          <Button asChild size="sm">
            <Link href={turn.href}>
              {turn.ctaLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
