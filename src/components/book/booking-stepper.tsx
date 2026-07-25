"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BookingStepMeta {
  id: string;
  label: string;
}

export function BookingStepper({
  steps,
  currentIndex,
  furthestIndex,
  onStepSelect,
}: {
  steps: BookingStepMeta[];
  currentIndex: number;
  /** Highest step index the patient has already reached — completed steps
   * before this are safe to jump back to. */
  furthestIndex: number;
  onStepSelect: (index: number) => void;
}) {
  return (
    <div>
      <p className="text-eyebrow text-sage-dark md:hidden">
        Step {currentIndex + 1} of {steps.length} — {steps[currentIndex].label}
      </p>
      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken md:hidden"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
      >
        <div
          className="h-full rounded-full bg-sage transition-[width] duration-300"
          style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      <ol className="hidden items-center gap-2 md:flex">
        {steps.map((step, index) => {
          const isCompleted = index < furthestIndex;
          const isCurrent = index === currentIndex;
          const isReachable = index <= furthestIndex;

          return (
            <li key={step.id} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!isReachable}
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => isReachable && onStepSelect(index)}
                className={cn(
                  "flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 text-left text-xs font-medium uppercase tracking-[0.1em] transition-colors",
                  isReachable ? "cursor-pointer" : "cursor-default opacity-50",
                  isCurrent
                    ? "bg-sage-light text-sage-dark"
                    : "text-ink-faint hover:text-ink-soft"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[0.6875rem]",
                    isCompleted
                      ? "bg-sage text-ink-on-dark"
                      : isCurrent
                        ? "border border-sage-dark text-sage-dark"
                        : "border border-border-strong text-ink-faint"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                {step.label}
              </button>
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-px flex-1",
                    isCompleted ? "bg-sage" : "bg-border"
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
