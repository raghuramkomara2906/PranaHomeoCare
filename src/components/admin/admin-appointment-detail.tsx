"use client";

import * as React from "react";
import Link from "next/link";

import { ApiError } from "@/lib/api-client";
import {
  useAdminAppointment,
  useAdminCancelAppointment,
  useSetAppointmentStatus,
  useSetMeetingLink,
} from "@/hooks/use-admin-appointments";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function fmt(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

function apiError(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function AdminAppointmentDetail({ id }: { id: string }) {
  const appt = useAdminAppointment(id);
  const meeting = useSetMeetingLink(id);
  const status = useSetAppointmentStatus(id);
  const cancel = useAdminCancelAppointment(id);

  const [joinUrl, setJoinUrl] = React.useState("");
  const [meetingId, setMeetingId] = React.useState("");

  if (appt.isLoading) {
    return (
      <Container className="max-w-3xl py-10">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </Container>
    );
  }
  if (appt.isError || !appt.data) {
    return (
      <Container className="max-w-3xl py-16">
        <p className="text-clay-dark">Appointment not found.</p>
        <Link href="/admin/appointments" className="text-sage-dark hover:underline">
          Back to appointments
        </Link>
      </Container>
    );
  }

  const d = appt.data;
  const tz = d.timezone;
  const isVideo = d.consultationType === "video_consultation";
  const isActive = d.status === "confirmed";

  return (
    <Container className="max-w-3xl py-10">
      <Link
        href="/admin/appointments"
        className="text-sm text-sage-dark hover:underline"
      >
        ← Appointments
      </Link>

      <div className="mt-3 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
            {d.bookingReference}
          </p>
          <h1 className="mt-1 font-display text-3xl text-ink">{d.patientName}</h1>
        </div>
        <span className="rounded-full bg-surface-sunken px-3 py-1 text-xs font-medium text-ink-soft">
          {d.status}
        </span>
      </div>

      <div className="grid gap-4 rounded-lg border border-border bg-surface p-6 sm:grid-cols-2">
        <Field label="Mobile" value={d.mobile} mono />
        <Field
          label="Type"
          value={isVideo ? "Video consultation" : "Teleconsultation"}
        />
        <Field label="When" value={`${fmt(d.startAt, tz)} – ${fmt(d.endAt, tz)} IST`} />
        <Field label="Slot" value={d.slotEffectiveStatus} />
        <Field label="OTP verified" value={d.otpVerified ? "Yes" : "No"} />
        <Field label="Booked" value={fmt(d.bookingCreatedAt, tz)} />
        {d.teleconsultationPhone && (
          <Field label="Clinic number" value={d.teleconsultationPhone} mono />
        )}
      </div>

      {/* Zoom link (video only) */}
      {isVideo && (
        <section className="mt-6 rounded-lg border border-border bg-surface p-6">
          <h2 className="font-display text-xl text-ink">Zoom meeting</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Status: {d.meeting?.status ?? "not set"}
            {d.meeting?.joinUrl ? ` · current link on file` : ""}
          </p>
          {isActive ? (
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="joinUrl">Zoom URL</Label>
                <Input
                  id="joinUrl"
                  placeholder="https://…zoom.us/j/…"
                  value={joinUrl}
                  onChange={(e) => setJoinUrl(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meetingId">Meeting ID (optional)</Label>
                <Input
                  id="meetingId"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                />
              </div>
              {meeting.isError && (
                <p className="text-sm text-clay-dark">
                  {apiError(meeting.error, "Couldn't save the link.")}
                </p>
              )}
              {meeting.isSuccess && (
                <p className="text-sm text-sage-dark">{meeting.data.message}</p>
              )}
              <Button
                disabled={meeting.isPending || !joinUrl}
                onClick={() =>
                  meeting.mutate(
                    {
                      joinUrl,
                      meetingIdentifier: meetingId || undefined,
                    },
                    { onSuccess: () => setMeetingId("") }
                  )
                }
              >
                {meeting.isPending
                  ? "Saving…"
                  : d.meeting?.hasLink
                    ? "Replace link & notify patient"
                    : "Save link & notify patient"}
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">
              The appointment is {d.status}; the Zoom link can&apos;t be changed.
            </p>
          )}
        </section>
      )}

      {/* Status actions */}
      {isActive && (
        <section className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            disabled={status.isPending}
            onClick={() => status.mutate({ status: "completed" })}
          >
            Mark completed
          </Button>
          <Button
            variant="outline"
            disabled={status.isPending}
            onClick={() => status.mutate({ status: "no_show" })}
          >
            Mark no-show
          </Button>
          <Button
            variant="destructive"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate({ reason: "doctor_cancelled" })}
          >
            Cancel appointment
          </Button>
          {(status.isError || cancel.isError) && (
            <p className="w-full text-sm text-clay-dark">
              {apiError(
                status.error ?? cancel.error,
                "That action couldn't be completed."
              )}
            </p>
          )}
        </section>
      )}

      {/* History */}
      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 font-display text-lg text-ink">Events</h3>
          {d.events.length === 0 ? (
            <p className="text-sm text-ink-faint">No events.</p>
          ) : (
            <ul className="space-y-2">
              {d.events.map((e, i) => (
                <li key={i} className="text-sm">
                  <span className="text-ink">{e.eventType.replace(/_/g, " ")}</span>
                  <span className="text-ink-faint">
                    {" "}
                    · {e.actorType} · {fmt(e.createdAt, tz)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="mb-2 font-display text-lg text-ink">SMS</h3>
          {d.notifications.length === 0 ? (
            <p className="text-sm text-ink-faint">No messages.</p>
          ) : (
            <ul className="space-y-2">
              {d.notifications.map((n, i) => (
                <li key={i} className="text-sm">
                  <span className="text-ink">
                    {n.notificationType.replace(/_/g, " ")}
                  </span>
                  <span
                    className={cn(
                      "ml-2 rounded-full px-2 py-0.5 text-xs",
                      n.status === "failed"
                        ? "bg-clay-light text-clay-dark"
                        : "bg-surface-sunken text-ink-soft"
                    )}
                  >
                    {n.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </Container>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={cn("text-ink", mono && "font-mono")}>{value}</p>
    </div>
  );
}