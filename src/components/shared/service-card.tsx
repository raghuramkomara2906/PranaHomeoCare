import * as React from "react";
import Link from "next/link";
import { Clock3 } from "lucide-react";

import type { Service } from "@/lib/types";
import { formatDuration, formatPrice } from "@/lib/format";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlaceholderTag } from "@/components/shared/placeholder-tag";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Card className="flex h-full flex-col transition-shadow duration-300 hover:shadow-lifted">
      <CardHeader>
        <div className="mb-1 flex items-center gap-2 text-eyebrow text-ink-faint">
          <Clock3 className="size-3.5" aria-hidden="true" />
          {formatDuration(service.durationMinutes)}
        </div>
        <CardTitle>{service.name}</CardTitle>
        <CardDescription>{service.shortDescription}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex items-end justify-between gap-3 pt-2">
        <div>
          <p className="font-mono text-2xl text-ink">
            {formatPrice(service.price, service.currency)}
          </p>
          {service.isPriceEstimate ? (
            <PlaceholderTag label="Price placeholder" className="mt-1.5" />
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2 sm:flex-row">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/services/${service.slug}`}>View Details</Link>
        </Button>
        <Button asChild size="sm" className="flex-1">
          <Link href={`/book?service=${service.slug}`}>Book Now</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
