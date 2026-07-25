import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 leading-none text-ink",
        className
      )}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-sage/40"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 text-sage-dark"
        >
          <path d="M12 20 C12 14 12 9 12 4" />
          <path d="M12 12 C12 8.5 15 7.5 17 6.5 C16.4 9.5 14.5 11 12 12Z" />
          <path d="M12 16 C12 12.8 9.3 12 7.3 11.2 C7.9 14 9.7 15.4 12 16Z" />
        </svg>
      </span>
      <span className="flex flex-col">
        <span className="font-display text-xl leading-tight text-ink">
          {siteConfig.brandPrimary}
        </span>
        <span className="font-display text-sm leading-tight text-ink-soft">
          {siteConfig.brandSecondary}
        </span>
      </span>
    </Link>
  );
}
