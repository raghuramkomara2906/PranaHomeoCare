"use client";

import * as React from "react";

import { ApiError } from "@/lib/api-client";
import { useAppointment, useCancelAppointment } from "@/hooks/use-appointment";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ReschedulePanel } from "@/components/appointment/reschedule-panel";
import { VideoJoinPanel } from "@/components/appointment/video-join-panel";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
  confirmed: "bg-sage-light text-sage-dark",
  cancelled: "bg-clay-light text-clay-dark",
  completed: "bg-teal-light text-teal-dark",
  no_show: "bg-clay-light text-clay-dark",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No show",
};

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

function formatDeadline(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export function AppointmentManager({ token }: { token: string }) {
  const appt = useAppointment(token);
  const cancel = useCancelAppointment(token);
  const [mode, setMode] = React.useState<"view" | "reschedule">("view");
  const [confirmingCancel, setConfirmingCancel] = React.useState(false);

  if (appt.isLoading) {
    return (
      <Container className="max-w-2xl py-12">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </Container>
    );
  }

  if (appt.isError) {
    return (
      <Container className="max-w-2xl py-16 text-center">
        <h1 className="font-display text-2xl text-ink">
          This appointment link is invalid
        </h1>
        <p className="mt-2 text-ink-soft">
          The link may have expired or the appointment is no longer available.
        </p>
      </Container>
    );
  }

  const data = appt.data;
  if (!data) return null;

  const isTele = data.consultationType === "teleconsultation";
  const isVideo = data.consultationType === "video_consultation";
  const isActive = data.status === "confirmed";

  if (mode === "reschedule") {
    return (
      <Container className="max-w-2xl py-12">
        <ReschedulePanel
          token={token}
          consultationType={data.consultationType}
          onBack={() => setMode("view")}
          onDone={() => setMode("view")}
        />
      </Container>
    );
  }

  const cancelError =
    cancel.isError && cancel.error instanceof ApiError
      ? cancel.error.message
      : cancel.isError
        ? "We couldn't cancel. Please try again or contact the clinic."
        : null;

  return (
    <Container className="max-w-2xl py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
            {data.bookingReference}
          </p>
          <h1 className="mt-1 font-display text-3xl text-ink">
            {isVideo ? "Video consultation" : "Teleconsultation"}
          </h1>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            STATUS_BADGE[data.status] ?? "bg-surface-sunken text-ink-soft"
          )}
        >
          {STATUS_LABEL[data.status] ?? data.status}
        </span>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <p className="text-ink">
          {formatWhen(data.startAt, data.endAt, data.timezone)}
        </p>
        <Separator className="my-4" />
        <p className="text-sm text-ink-soft">{data.instructions}</p>

        {isTele && data.clinicPhone && (
          <div className="mt-4">
            <Button asChild variant="secondary">
              <a href={`tel:${data.clinicPhone}`}>Call clinic ({data.clinicPhone})</a>
            </Button>
          </div>
        )}
      </div>

      {isVideo && isActive && (
        <div className="mt-4">
          <VideoJoinPanel token={token} />
        </div>
      )}

      {data.status === "cancelled" && (
        <p className="mt-6 text-ink-soft">This appointment has been cancelled.</p>
      )}
      {data.status === "completed" && (
        <p className="mt-6 text-ink-soft">This consultation has been completed.</p>
      )}

      {isActive && (data.canCancel || data.canReschedule) && (
        <>
          <p className="mt-6 text-xs text-ink-faint">
            You can change or cancel this appointment until{" "}
            {formatDeadline(data.cancellationDeadline, data.timezone)} IST.
          </p>

          {confirmingCancel ? (
            <div className="mt-4 rounded-lg border border-clay/40 bg-clay-light/30 p-5">
              <p className="text-ink">Cancel this appointment?</p>
              <p className="mt-1 text-sm text-ink-soft">
                {formatWhen(data.startAt, data.endAt, data.timezone)} ·{" "}
                {data.bookingReference}
              </p>
              {cancelError && (
                <p className="mt-2 text-sm text-clay-dark">{cancelError}</p>
              )}
              <div className="mt-4 flex gap-3">
                <Button
                  variant="destructive"
                  disabled={cancel.isPending}
                  onClick={() =>
                    cancel.mutate(undefined, {
                      onSuccess: () => setConfirmingCancel(false),
                    })
                  }
                >
                  {cancel.isPending ? "Cancelling…" : "Confirm cancellation"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={cancel.isPending}
                  onClick={() => setConfirmingCancel(false)}
                >
                  Keep appointment
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex gap-3">
              {data.canReschedule && (
                <Button variant="outline" onClick={() => setMode("reschedule")}>
                  Reschedule
                </Button>
              )}
              {data.canCancel && (
                <Button
                  variant="ghost"
                  onClick={() => setConfirmingCancel(true)}
                >
                  Cancel appointment
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </Container>
  );
}
