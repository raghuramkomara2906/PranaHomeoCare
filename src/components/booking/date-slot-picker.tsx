"use client";

import * as React from "react";

import { useAvailableDates, useAvailableSlots } from "@/hooks/use-availability";
import type { ConsultationType, PublicSlot } from "@/lib/types/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface SlotSelection {
  date: string;
  slotId: string;
  startAt: string;
  endAt: string;
  timezone: string;
}

function formatDateLabel(date: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(new Date(`${date}T12:00:00+05:30`));
}

function formatSlotTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export function DateSlotPicker({
  consultationType,
  onSelect,
}: {
  consultationType: ConsultationType;
  onSelect: (selection: SlotSelection) => void;
}) {
  const dates = useAvailableDates();
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const slots = useAvailableSlots(selectedDate, consultationType);

  const timezone = dates.data?.timezone ?? "Asia/Kolkata";
  const availableDates = dates.data?.dates ?? [];

  // Auto-select the first available date once loaded.
  React.useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[0].date);
    }
  }, [selectedDate, availableDates]);

  if (dates.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (dates.isError) {
    return (
      <p role="alert" className="text-clay-dark">
        We couldn&apos;t load available dates. Please refresh and try again.
      </p>
    );
  }

  if (availableDates.length === 0) {
    return (
      <p className="text-ink-soft">
        There are no available appointment times right now. Please check back
        soon.
      </p>
    );
  }

  const slotList: PublicSlot[] = slots.data?.slots ?? [];
  const slotTimezone = slots.data?.timezone ?? timezone;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 font-display text-lg text-ink">Choose a date</h3>
        <div className="flex flex-wrap gap-2">
          {availableDates.map((d) => (
            <button
              key={d.date}
              type="button"
              onClick={() => setSelectedDate(d.date)}
              aria-pressed={selectedDate === d.date}
              className={cn(
                "flex min-w-20 flex-col items-center rounded-lg border px-4 py-3 text-sm transition-colors",
                selectedDate === d.date
                  ? "border-sage bg-sage text-ink-on-dark"
                  : "border-border-strong bg-surface text-ink hover:border-ink-faint"
              )}
            >
              <span className="font-medium">
                {formatDateLabel(d.date, timezone)}
              </span>
              <span
                className={cn(
                  "mt-0.5 text-xs",
                  selectedDate === d.date ? "text-ink-on-dark-soft" : "text-ink-faint"
                )}
              >
                {d.availableCount} open
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-display text-lg text-ink">Choose a time</h3>
        <p className="mb-3 text-xs text-ink-faint">
          All times shown in India Standard Time (IST).
        </p>
        {slots.isLoading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-full" />
            ))}
          </div>
        ) : slots.isError ? (
          <p role="alert" className="text-clay-dark">
            We couldn&apos;t load times for this date.
          </p>
        ) : slotList.length === 0 ? (
          <p className="text-ink-soft">No open times on this date.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slotList.map((slot) => (
              <Button
                key={slot.id}
                type="button"
                variant="outline"
                onClick={() =>
                  onSelect({
                    date: selectedDate as string,
                    slotId: slot.id,
                    startAt: slot.startAt,
                    endAt: slot.endAt,
                    timezone: slotTimezone,
                  })
                }
              >
                {formatSlotTime(slot.startAt, slotTimezone)}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}