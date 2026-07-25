import * as React from "react";

import { cn } from "@/lib/utils";

/** Centered max-width wrapper used by every page section. */
function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="container"
      className={cn("mx-auto w-full max-w-6xl px-6 md:px-10", className)}
      {...props}
    />
  );
}

export { Container };
