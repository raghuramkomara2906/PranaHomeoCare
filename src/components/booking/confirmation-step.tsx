"use client";

import Link from "next/link";

import type { AppointmentConfirmation } from "@/lib/types/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function formatWhen(startAt: string, endAt: string, timeZone: string) {
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  }).format(new Date(startAt));
  const time = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(new Date(iso));
  return `${date}, ${time(startAt)} – ${time(endAt)} IST`;
}

export function ConfirmationStep({
  confirmation,
}: {
  confirmation: AppointmentConfirmation;
}) {
  const isVideo = confirmation.consultationType === "video_consultation";

  return (
    <div className="space-y-6 text-center">
      <div>
        <p className="font-display text-2xl text-ink">Appointment confirmed</p>
        <p className="mt-1 text-ink-soft">
          A confirmation SMS is on its way to {confirmation.maskedMobile}.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6 text-left">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Booking reference</dt>
            <dd className="font-mono text-ink">{confirmation.bookingReference}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Type</dt>
            <dd className="text-ink">
              {isVideo ? "Video consultation" : "Teleconsultation"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">When</dt>
            <dd className="text-right text-ink">
              {formatWhen(
                confirmation.startAt,
                confirmation.endAt,
                confirmation.timezone
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Fee</dt>
            <dd className="text-ink capitalize">{confirmation.fee}</dd>
          </div>
          {confirmation.clinicPhone && (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Clinic number</dt>
              <dd className="font-mono text-ink">{confirmation.clinicPhone}</dd>
            </div>
          )}
        </dl>
        <Separator className="my-4" />
        <p className="text-sm text-ink-soft">{confirmation.instructions}</p>
      </div>

      {confirmation.appointmentPath && (
        <Button asChild className="w-full">
          <Link href={confirmation.appointmentPath}>
            Manage your appointment
          </Link>
        </Button>
      )}
      <p className="text-xs text-ink-faint">
        Keep the link from your SMS to view, reschedule, or cancel this
        appointment — no account needed.
      </p>
    </div>
  );
}