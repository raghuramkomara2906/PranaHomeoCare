import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const sectionVariants = cva("relative", {
  variants: {
    tone: {
      canvas: "bg-canvas",
      muted: "bg-canvas-muted",
      surface: "bg-surface",
      deep: "bg-teal-dark text-ink-on-dark",
    },
    spacing: {
      default: "py-16 md:py-24 lg:py-28",
      tight: "py-10 md:py-14",
      none: "",
    },
  },
  defaultVariants: {
    tone: "canvas",
    spacing: "default",
  },
});

export interface SectionProps
  extends React.ComponentProps<"section">,
    VariantProps<typeof sectionVariants> {}

function Section({ className, tone, spacing, ...props }: SectionProps) {
  return (
    <section
      data-slot="section"
      className={cn(sectionVariants({ tone, spacing, className }))}
      {...props}
    />
  );
}

/** Shared heading block: eyebrow label + display heading + optional lede, left- or center-aligned. */
function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  tone = "light",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-eyebrow mb-4",
            tone === "dark" ? "text-sky" : "text-sage-dark"
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "font-display text-3xl leading-tight md:text-4xl lg:text-[2.75rem]",
          tone === "dark" ? "text-ink-on-dark" : "text-ink"
        )}
      >
        {title}
      </h2>
      {lede ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed md:text-lg",
            tone === "dark" ? "text-ink-on-dark-soft" : "text-ink-soft"
          )}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}

export { Section, SectionHeading, sectionVariants };
