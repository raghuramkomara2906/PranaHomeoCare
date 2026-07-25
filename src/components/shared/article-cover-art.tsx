import * as React from "react";

import { cn } from "@/lib/utils";
import { BotanicalSprigMini } from "@/components/shared/botanical-motifs";

const VARIANTS = [
  { bg: "bg-sage-light", art: "text-sage" },
  { bg: "bg-teal-light", art: "text-teal" },
  { bg: "bg-sand-light", art: "text-sand-dark" },
  { bg: "bg-sky-light", art: "text-sky-dark" },
];

/**
 * Stands in for real article photography, which isn't available yet.
 * Deterministic per `seed` so the same article always renders the same
 * cover. Replace with real images before launch.
 */
export function ArticleCoverArt({
  seed,
  className,
}: {
  seed: number;
  className?: string;
}) {
  const variant = VARIANTS[seed % VARIANTS.length];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        variant.bg,
        className
      )}
      role="img"
      aria-label="Article cover illustration"
    >
      <BotanicalSprigMini
        className={cn("size-16 rotate-[8deg] opacity-70", variant.art)}
      />
      <BotanicalSprigMini
        className={cn(
          "absolute -bottom-4 -right-4 size-20 rotate-[-14deg] opacity-40",
          variant.art
        )}
      />
    </div>
  );
}
