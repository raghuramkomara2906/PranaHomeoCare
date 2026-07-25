import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-sage text-ink-on-dark hover:bg-sage-dark active:bg-sage-dark shadow-soft",
        secondary:
          "bg-teal text-ink-on-dark hover:bg-teal-dark active:bg-teal-dark shadow-soft",
        outline:
          "border border-border-strong bg-transparent text-ink hover:bg-surface-sunken",
        ghost: "bg-transparent text-ink hover:bg-surface-sunken",
        ghostOnDark:
          "bg-transparent text-ink-on-dark hover:bg-ink-on-dark/10",
        cream:
          "bg-surface text-ink hover:bg-canvas shadow-soft",
        link: "bg-transparent text-sage-dark underline-offset-4 hover:underline p-0 h-auto rounded-none",
        destructive:
          "bg-clay text-ink-on-dark hover:bg-clay-dark shadow-soft",
      },
      size: {
        default: "h-11 px-6 py-2 has-[>svg]:px-5",
        sm: "h-9 px-4 text-[0.8125rem] has-[>svg]:px-3.5",
        lg: "h-13 px-8 text-base has-[>svg]:px-7",
        icon: "size-11 shrink-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

/**
 * Small trailing dot accent for pill CTAs (matches the reference: a solid
 * circle set apart from the label). Composed manually inside a button's
 * children — e.g. `<Button asChild><Link>Book<ButtonDot /></Link></Button>`
 * — rather than as a Button prop, since Radix Slot requires exactly one
 * child element when `asChild` is used.
 */
export function ButtonDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("ml-1 inline-block size-1.5 rounded-full bg-current opacity-70", className)}
    />
  );
}
