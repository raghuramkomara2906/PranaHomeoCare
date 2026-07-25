import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-md border border-border-strong bg-surface px-4 text-sm text-ink shadow-none transition-colors placeholder:text-ink-faint hover:border-ink-faint focus-visible:border-teal disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-clay",
        className
      )}
      {...props}
    />
  );
}

export { Input };
