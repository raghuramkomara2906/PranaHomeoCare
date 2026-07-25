"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarX2 } from "lucide-react";

import type { AppointmentStatus } from "@/lib/types";
import { formatDateInZone, formatTimeInZone, getLocalTimeZone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getAdminAppointments, updateAppointment } from "@/services/admin.service";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type RangeMode = "week" | "month";

const ACTIVE_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "RESCHEDULED"];

const STATUS_BADGE: Record<AppointmentStatus, BadgeProps["variant"]> = {
  SLOT_HELD: "outline",
  PENDING: "gold",
  CONFIRMED: "sage",
  RESCHEDULED: "sky",
  CANCELLED_BY_PATIENT: "clay",
  CANCELLED_BY_PRACTITIONER: "clay",
  COMPLETED: "teal",
  NO_SHOW: "clay",
  EXPIRED: "outline",
};

function rangeFor(mode: RangeMode, anchor: Date) {
  return mode === "week"
    ? { start: startOfWeek(anchor, { weekStartsOn: 0 }), end: endOfWeek(anchor, { weekStartsOn: 0 }) }
    : { start: startOfMonth(anchor), end: endOfMonth(anchor) };
}

export function ConsultationsPanel() {
  const [mode, setMode] = React.useState<RangeMode>("week");
  const [anchor, setAnchor] = React.useState(() => new Date());
  const viewerTimeZone = React.useMemo(() => getLocalTimeZone(), []);
  const queryClient = useQueryClient();

  const { start, end } = rangeFor(mode, anchor);
  const startIso = format(start, "yyyy-MM-dd");
  const endIso = format(end, "yyyy-MM-dd");

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["adminAppointments", startIso, endIso],
    queryFn: () => getAdminAppointments(startIso, endIso),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointment(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAppointments"] });
    },
  });

  function goPrev() {
    setAnchor((current) => (mode === "week" ? subWeeks(current, 1) : subMonths(current, 1)));
  }
  function goNext() {
    setAnchor((current) => (mode === "week" ? addWeeks(current, 1) : addMonths(current, 1)));
  }

  const rangeLabel =
    mode === "week"
      ? `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
      : format(anchor, "MMMM yyyy");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
          {(["week", "month"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.08em] transition-colors",
                mode === option
                  ? "bg-sage-light text-sage-dark"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              {option === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goPrev} aria-label="Previous">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <p className="font-mono text-sm text-ink">{rangeLabel}</p>
          <Button variant="ghost" size="icon" onClick={goNext} aria-label="Next">
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : appointments && appointments.length > 0 ? (
          appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg text-ink">
                      {appointment.patientFullName}
                    </p>
                    <Badge variant={STATUS_BADGE[appointment.status]}>
                      {appointment.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{appointment.serviceName}</p>
                  <p className="mt-1 font-mono text-sm text-ink-soft">
                    {formatDateInZone(appointment.startTimeUtc, viewerTimeZone)} ·{" "}
                    {formatTimeInZone(appointment.startTimeUtc, viewerTimeZone)}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {appointment.patientEmail} · {appointment.patientPhone}
                  </p>
                </div>

                {ACTIVE_STATUSES.includes(appointment.status) ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({ id: appointment.id, status: "COMPLETED" })
                      }
                    >
                      Mark completed
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({
                          id: appointment.id,
                          status: "CANCELLED_BY_PRACTITIONER",
                        })
                      }
                    >
                      Cancel
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong py-14 text-center">
            <CalendarX2 className="size-6 text-ink-faint" aria-hidden="true" />
            <p className="text-sm text-ink-soft">Nothing booked in this range.</p>
          </div>
        )}
      </div>
    </div>
  );
}
