"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, isSunday, startOfToday } from "date-fns";
import { CalendarX2 } from "lucide-react";

import type { Service, TimeSlot } from "@/lib/types";
import { formatTimeInZone, getLocalTimeZone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getAvailableSlots } from "@/services/availability.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS_AHEAD = 30;

function dateToIso(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function DateTimeStep({
  service,
  selectedDateIso,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
  onBack,
  onNext,
}: {
  service: Service;
  selectedDateIso: string | null;
  selectedSlot: TimeSlot | null;
  onSelectDate: (dateIso: string) => void;
  onSelectSlot: (slot: TimeSlot) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const today = React.useMemo(() => startOfToday(), []);
  const candidateDays = React.useMemo(
    () => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i)),
    [today]
  );
  const viewerTimeZone = React.useMemo(() => getLocalTimeZone(), []);

  const { data: slots, isLoading } = useQuery({
    queryKey: ["availability", service.id, selectedDateIso],
    queryFn: () => getAvailableSlots(service.id, selectedDateIso!),
    enabled: Boolean(selectedDateIso),
  });

  return (
    <div>
      <h2 className="font-display text-2xl text-ink md:text-3xl">
        Pick a date &amp; time
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
        Choose whatever works for your schedule — you can change this later
        if something comes up.
      </p>

      <fieldset className="mt-8">
        <legend className="text-eyebrow text-sage-dark">Date</legend>
        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-2"
          role="radiogroup"
          aria-label="Select a date"
        >
          {candidateDays.map((day) => {
            const iso = dateToIso(day);
            const disabled = isSunday(day);
            const isSelected = selectedDateIso === iso;
            return (
              <label
                key={iso}
                className={cn(
                  "flex shrink-0 cursor-pointer flex-col items-center rounded-lg border px-3.5 py-2.5 text-center transition-colors",
                  disabled && "cursor-not-allowed opacity-40",
                  isSelected
                    ? "border-sage bg-sage-light"
                    : "border-border bg-surface hover:border-border-strong"
                )}
              >
                <input
                  type="radio"
                  name="date"
                  className="sr-only"
                  value={iso}
                  disabled={disabled}
                  checked={isSelected}
                  onChange={() => onSelectDate(iso)}
                />
                <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-faint">
                  {format(day, "EEE")}
                </span>
                <span
                  className={cn(
                    "mt-0.5 font-mono text-base",
                    isSelected ? "text-sage-dark" : "text-ink"
                  )}
                >
                  {format(day, "d")}
                </span>
                <span className="text-[0.625rem] text-ink-faint">
                  {format(day, "MMM")}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {selectedDateIso ? (
        <fieldset className="mt-8">
          <legend className="text-eyebrow text-sage-dark">
            Available times
          </legend>
          <p className="mt-1 text-xs text-ink-faint">
            Shown in your local time zone ({viewerTimeZone}).
          </p>

          {isLoading ? (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-11" />
              ))}
            </div>
          ) : slots && slots.length > 0 ? (
            <div
              className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4"
              role="radiogroup"
              aria-label="Select a time"
            >
              {slots.map((slot) => {
                const isSelected =
                  selectedSlot?.startTimeUtc === slot.startTimeUtc;
                return (
                  <label
                    key={slot.startTimeUtc}
                    className={cn(
                      "flex h-11 cursor-pointer items-center justify-center rounded-md border px-2 font-mono text-sm transition-colors",
                      isSelected
                        ? "border-sage bg-sage text-ink-on-dark"
                        : "border-border bg-surface text-ink hover:border-border-strong"
                    )}
                  >
                    <input
                      type="radio"
                      name="time"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => onSelectSlot(slot)}
                    />
                    {formatTimeInZone(slot.startTimeUtc, viewerTimeZone)}
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong py-10 text-center">
              <CalendarX2
                className="size-6 text-ink-faint"
                aria-hidden="true"
              />
              <p className="text-sm text-ink-soft">
                No times left on this day — try another date.
              </p>
            </div>
          )}
        </fieldset>
      ) : null}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!selectedDateIso || !selectedSlot}>
          Continue
        </Button>
      </div>
    </div>
  );
}
