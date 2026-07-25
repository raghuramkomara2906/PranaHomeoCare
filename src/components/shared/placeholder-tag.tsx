import * as React from "react";
import { PenLine } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Flags copy that stands in for real practitioner-specific facts (name,
 * qualifications, license number, years of experience, pricing, contact
 * details, testimonials). Nothing wearing this tag should be mistaken for
 * verified content — it exists so a reviewer can find and replace every
 * instance before launch.
 */
export function PlaceholderTag({
  className,
  label = "Placeholder — verify before publishing",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-clay/50 bg-clay-light px-2.5 py-0.5 text-[0.6875rem] font-medium tracking-wide text-clay-dark",
        className
      )}
    >
      <PenLine className="size-3" aria-hidden="true" />
      {label}
    </span>
  );
}
