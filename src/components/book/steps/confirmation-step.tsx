"use client";

import * as React from "react";
import Link from "next/link";

import type { Appointment } from "@/lib/types";
import { formatDateInZone, formatTimeInZone, getLocalTimeZone } from "@/lib/format";
import { BotanicalSprig } from "@/components/shared/botanical-motifs";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonDot } from "@/components/ui/button";

export function ConfirmationStep({
  appointment,
  onBookAnother,
}: {
  appointment: Appointment;
  onBookAnother: () => void;
}) {
  const viewerTimeZone = React.useMemo(() => getLocalTimeZone(), []);

  return (
    <div className="flex flex-col items-center py-4 text-center">
      <BotanicalSprig className="mb-6 h-24 w-auto text-sage/60" />
      <Badge variant="sage" className="mb-4">
        Confirmed
      </Badge>
      <h2 className="font-display text-2xl text-ink md:text-3xl">
        You&apos;re booked
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        A confirmation for your {appointment.serviceName.toLowerCase()} has
        been sent to your email. We look forward to speaking with you.
      </p>

      <div className="mt-8 w-full max-w-sm rounded-lg border border-border bg-surface p-6 text-left shadow-soft">
        <p className="text-eyebrow text-sage-dark">Booking reference</p>
        <p className="mt-1 font-mono text-lg text-ink">
          {appointment.publicReference}
        </p>
        <div className="mt-4 border-t border-border pt-4">
          <p className="font-display text-lg text-ink">
            {appointment.serviceName}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {formatDateInZone(appointment.startTimeUtc, viewerTimeZone)}
          </p>
          <p className="font-mono text-sm text-ink-soft">
            {formatTimeInZone(appointment.startTimeUtc, viewerTimeZone)}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" onClick={onBookAnother}>
          Book another consultation
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            Go to your dashboard
            <ButtonDot />
          </Link>
        </Button>
      </div>
    </div>
  );
}
