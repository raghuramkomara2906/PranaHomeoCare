"use client";

import * as React from "react";

import { ApiError } from "@/lib/api-client";
import {
  useAccountCancel,
  useAccountJoin,
  useAccountJoinStatus,
  useAccountReschedule,
} from "@/hooks/use-account";
import type { AccountAppointmentItem } from "@/lib/types/api";
import {
  DateSlotPicker,
  type SlotSelection,
} from "@/components/booking/date-slot-picker";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

function fmtWhen(startAt: string, endAt: string, tz: string) {
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: tz,
  }).format(new Date(startAt));
  const t = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
    }).format(new Date(iso));
  return `${date}, ${t(startAt)} – ${t(endAt)} IST`;
}

function fmtDeadline(iso: string, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(new Date(iso));
}

function VideoJoin({ id }: { id: string }) {
  const [poll, setPoll] = React.useState<number | false>(false);
  const status = useAccountJoinStatus(id, { refetchInterval: poll });
  const join = useAccountJoin(id);

  React.useEffect(() => {
    const s = status.data?.state;
    setPoll(s === "pending" || s === "too_early" ? 20000 : false);
  }, [status.data?.state]);

  if (status.isLoading) {
    return <p className="text-sm text-ink-soft">Checking meeting status…</p>;
  }
  const data = status.data;
  if (!data) return null;

  const joinError =
    join.error instanceof ApiError
      ? join.error.message
      : join.isError
        ? "We couldn't open the meeting. Please try again."
        : null;

  return (
    <div className="mt-3 rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-ink-soft">{data.message}</p>
      {data.canJoin && (
        <Button
          className="mt-3 w-full"
          disabled={join.isPending}
          onClick={() =>
            join.mutate(undefined, {
              onSuccess: (r) =>
                window.open(r.joinUrl, "_blank", "noopener,noreferrer"),
              onError: () => {
                void status.refetch();
              },
            })
          }
        >
          {join.isPending ? "Opening…" : "Join video consultation"}
        </Button>
      )}
      {joinError && <p className="mt-2 text-sm text-clay-dark">{joinError}</p>}
    </div>
  );
}

export function AccountAppointmentCard({ item }: { item: AccountAppointmentItem }) {
  const [mode, setMode] = React.useState<"view" | "reschedule">("view");
  const [confirmingCancel, setConfirmingCancel] = React.useState(false);
  const cancel = useAccountCancel(item.id);
  const reschedule = useAccountReschedule(item.id);

  const tz = item.timezone;
  const isVideo = item.consultationType === "video_consultation";
  const isActive = item.status === "confirmed";

  function pickNewSlot(sel: SlotSelection) {
    reschedule.mutate(sel.slotId, { onSuccess: () => setMode("view") });
  }

  const cancelError =
    cancel.error instanceof ApiError
      ? cancel.error.message
      : cancel.isError
        ? "We couldn't cancel. Please try again or contact the clinic."
        : null;
  const rescheduleError =
    reschedule.error instanceof ApiError
      ? reschedule.error.message
      : reschedule.isError
        ? "We couldn't reschedule. Please try another time."
        : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
            {item.bookingReference}
          </p>
          <h3 className="mt-1 font-display text-xl text-ink">
            {isVideo ? "Video consultation" : "Teleconsultation"}
          </h3>
          <p className="mt-1 text-ink-soft">
            {fmtWhen(item.startAt, item.endAt, tz)}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
            STATUS_BADGE[item.status] ?? "bg-surface-sunken text-ink-soft"
          )}
        >
          {STATUS_LABEL[item.status] ?? item.status}
        </span>
      </div>

      {mode === "reschedule" ? (
        <div className="mt-4 space-y-4">
          <Separator />
          <p className="font-display text-lg text-ink">Choose a new time</p>
          <DateSlotPicker
            consultationType={item.consultationType}
            onSelect={pickNewSlot}
          />
          {rescheduleError && (
            <p className="text-sm text-clay-dark">{rescheduleError}</p>
          )}
          <Button
            variant="ghost"
            disabled={reschedule.isPending}
            onClick={() => setMode("view")}
          >
            {reschedule.isPending ? "Rescheduling…" : "Keep current time"}
          </Button>
        </div>
      ) : (
        <>
          {isActive && !isVideo && item.clinicPhone && (
            <div className="mt-4">
              <Button asChild variant="secondary" size="sm">
                <a href={`tel:${item.clinicPhone}`}>
                  Call clinic ({item.clinicPhone})
                </a>
              </Button>
            </div>
          )}

          {isActive && isVideo && <VideoJoin id={item.id} />}

          {isActive && (item.canCancel || item.canReschedule) && (
            <>
              <p className="mt-4 text-xs text-ink-faint">
                Reschedule until {fmtDeadline(item.rescheduleDeadline, tz)} · cancel
                until {fmtDeadline(item.cancellationDeadline, tz)} IST
              </p>

              {confirmingCancel ? (
                <div className="mt-3 rounded-lg border border-clay/40 bg-clay-light/30 p-4">
                  <p className="text-ink">Cancel this appointment?</p>
                  {cancelError && (
                    <p className="mt-2 text-sm text-clay-dark">{cancelError}</p>
                  )}
                  <div className="mt-3 flex gap-3">
                    <Button
                      variant="destructive"
                      size="sm"
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
                      size="sm"
                      disabled={cancel.isPending}
                      onClick={() => setConfirmingCancel(false)}
                    >
                      Keep it
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-3">
                  {item.canReschedule && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMode("reschedule")}
                    >
                      Reschedule
                    </Button>
                  )}
                  {item.canCancel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmingCancel(true)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
