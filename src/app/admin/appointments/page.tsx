"use client";

import * as React from "react";
import Link from "next/link";

import { useAdminAppointments } from "@/hooks/use-admin-appointments";
import type { AdminAppointmentFilters } from "@/lib/types/api";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const selectClass =
  "h-11 rounded-md border border-border-strong bg-surface px-3 text-sm text-ink";

const STATUS_BADGE: Record<string, string> = {
  confirmed: "bg-sage-light text-sage-dark",
  cancelled: "bg-clay-light text-clay-dark",
  completed: "bg-teal-light text-teal-dark",
  no_show: "bg-clay-light text-clay-dark",
};

function fmt(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export default function AdminAppointmentsPage() {
  const [filters, setFilters] = React.useState<AdminAppointmentFilters>({});
  const [search, setSearch] = React.useState("");
  const list = useAdminAppointments(filters);

  function update<K extends keyof AdminAppointmentFilters>(
    key: K,
    value: string
  ) {
    setFilters((f) => ({ ...f, [key]: value || undefined }));
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters((f) => ({ ...f, q: search || undefined }));
  }

  const timezone = list.data?.timezone ?? "Asia/Kolkata";
  const rows = list.data?.appointments ?? [];

  return (
    <Container className="py-10">
      <h1 className="mb-6 font-display text-3xl text-ink">Appointments</h1>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          className={selectClass}
          value={filters.consultationType ?? ""}
          onChange={(e) => update("consultationType", e.target.value)}
        >
          <option value="">All types</option>
          <option value="teleconsultation">Teleconsultation</option>
          <option value="video_consultation">Video</option>
        </select>
        <select
          className={selectClass}
          value={filters.status ?? ""}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
          <option value="no_show">No show</option>
        </select>
        <select
          className={selectClass}
          value={filters.meetingStatus ?? ""}
          onChange={(e) => update("meetingStatus", e.target.value)}
        >
          <option value="">Any Zoom link</option>
          <option value="pending">Pending</option>
          <option value="ready">Ready</option>
          <option value="review_required">Review required</option>
        </select>
        <form onSubmit={submitSearch} className="flex items-center gap-2">
          <Input
            placeholder="Reference, name, or mobile"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {list.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : list.isError ? (
        <p role="alert" className="text-clay-dark">
          Couldn&apos;t load appointments. Please refresh.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-ink-soft">No appointments match these filters.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          {rows.map((a, i) => (
            <Link
              key={a.id}
              href={`/admin/appointments/${a.id}`}
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 bg-surface px-5 py-4 hover:bg-surface-sunken",
                i > 0 && "border-t border-border"
              )}
            >
              <div className="min-w-40">
                <p className="text-ink">{fmt(a.startAt, timezone)} IST</p>
                <p className="font-mono text-xs text-ink-faint">
                  {a.bookingReference}
                </p>
              </div>
              <div className="min-w-32">
                <p className="text-ink">{a.patientName}</p>
                <p className="font-mono text-xs text-ink-soft">{a.mobile}</p>
              </div>
              <span className="text-sm text-ink-soft">
                {a.consultationType === "video_consultation" ? "Video" : "Tele"}
                {a.meetingStatus ? ` · ${a.meetingStatus}` : ""}
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  STATUS_BADGE[a.status] ?? "bg-surface-sunken text-ink-soft"
                )}
              >
                {a.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}