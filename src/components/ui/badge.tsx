import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-eyebrow whitespace-nowrap",
  {
    variants: {
      variant: {
        sage: "bg-sage-light text-sage-dark",
        teal: "bg-teal-light text-teal-dark",
        sand: "bg-sand-light text-ink-soft",
        sky: "bg-sky-light text-teal-dark",
        clay: "bg-clay-light text-clay-dark",
        gold: "bg-gold-light text-gold",
        outline: "border border-border-strong text-ink-soft",
        dark: "bg-teal-dark text-ink-on-dark",
      },
    },
    defaultVariants: {
      variant: "sage",
    },
  }
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
