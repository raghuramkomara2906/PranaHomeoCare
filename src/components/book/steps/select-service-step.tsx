"use client";

import * as React from "react";
import { Clock3 } from "lucide-react";

import type { Service } from "@/lib/types";
import { formatDuration, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlaceholderTag } from "@/components/shared/placeholder-tag";

export function SelectServiceStep({
  services,
  selectedServiceId,
  onSelect,
  onNext,
}: {
  services: Service[];
  selectedServiceId: string | null;
  onSelect: (service: Service) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <fieldset>
        <legend className="font-display text-2xl text-ink md:text-3xl">
          Choose a consultation
        </legend>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
          Every option below is a live video consultation. Pick the one that
          fits where you are right now.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {services.map((service) => {
            const isSelected = service.id === selectedServiceId;
            return (
              <label
                key={service.id}
                className={cn(
                  "group relative flex cursor-pointer flex-col rounded-lg border bg-surface p-5 shadow-soft transition-colors",
                  isSelected
                    ? "border-sage ring-1 ring-sage"
                    : "border-border hover:border-border-strong"
                )}
              >
                <input
                  type="radio"
                  name="service"
                  value={service.id}
                  checked={isSelected}
                  onChange={() => onSelect(service)}
                  className="absolute right-5 top-5 size-4 accent-sage"
                />
                <div className="flex items-center gap-2 text-eyebrow text-ink-faint">
                  <Clock3 className="size-3.5" aria-hidden="true" />
                  {formatDuration(service.durationMinutes)}
                </div>
                <p className="mt-2 pr-8 font-display text-lg leading-snug text-ink">
                  {service.name}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {service.shortDescription}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="font-mono text-lg text-ink">
                    {formatPrice(service.price, service.currency)}
                  </span>
                  {service.isPriceEstimate ? (
                    <PlaceholderTag label="Price placeholder" />
                  ) : null}
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 flex justify-end">
        <Button onClick={onNext} disabled={!selectedServiceId}>
          Continue
        </Button>
      </div>
    </div>
  );
}
