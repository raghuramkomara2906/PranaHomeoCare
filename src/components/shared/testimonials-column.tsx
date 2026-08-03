"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export interface TestimonialItem {
  quote: string;
  attribution: string;
  serviceName: string;
}

function getInitials(name: string): string {
  return name
    .split(/[\s,\.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function TestimonialCard({ item }: { item: TestimonialItem }) {
  const initials = getInitials(item.attribution);
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-soft max-w-xs w-full">
      <Quote className="size-6 text-sage/40" aria-hidden="true" />
      <p className="mt-3 font-display text-base leading-relaxed text-ink">
        &ldquo;{item.quote}&rdquo;
      </p>
      <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-semibold text-ink-on-dark">
          {initials}
        </span>
        <div>
          <p className="text-sm font-medium leading-tight text-ink">
            {item.attribution}
          </p>
          <p className="mt-0.5 font-mono text-xs uppercase tracking-wider text-ink-faint">
            {item.serviceName}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsColumn({
  testimonials,
  duration = 15,
  className,
}: {
  testimonials: TestimonialItem[];
  duration?: number;
  className?: string;
}) {
  return (
    <div className={className} style={{ overflow: "hidden" }}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-5 pb-5"
      >
        {[...Array(2)].map((_, i) => (
          <React.Fragment key={i}>
            {testimonials.map((t, j) => (
              <TestimonialCard key={`${i}-${j}`} item={t} />
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}