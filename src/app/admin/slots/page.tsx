"use client";

import * as React from "react";

import { ApiError } from "@/lib/api-client";
import {
  useAdminSlots,
  useCreateSlot,
  useDeleteSlot,
  usePatchSlot,
} from "@/hooks/use-admin-slots";
import type { AdminSlot } from "@/lib/types/api";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function todayInIst(): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date()
  );
}

function fmtTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

const STATUS_BADGE: Record<string, string> = {
  available: "bg-sage-light text-sage-dark",
  booked: "bg-teal-light text-teal-dark",
  held: "bg-surface-sunken text-ink-soft",
  blocked: "bg-clay-light text-clay-dark",
};

export default function AdminSlotsPage() {
  const [date, setDate] = React.useState(todayInIst());
  const [time, setTime] = React.useState("");
  const slots = useAdminSlots({ fromDate: date, toDate: date });
  const create = useCreateSlot();

  const timezone = slots.data?.timezone ?? "Asia/Kolkata";
  const rows = [...(slots.data?.slots ?? [])].sort((a, b) =>
    a.startAt.localeCompare(b.startAt)
  );

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!time) return;
    const startAt = `${date}T${time}:00+05:30`;
    create.mutate(startAt, { onSuccess: () => setTime("") });
  }

  const createError =
    create.isError && create.error instanceof ApiError
      ? create.error.message
      : create.isError
        ? "Couldn't create the slot."
        : null;

  return (
    <Container className="max-w-3xl py-10">
      <h1 className="mb-6 font-display text-3xl text-ink">Availability</h1>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-sm text-ink-soft">Date</label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-44"
        />
      </div>

      <form
        onSubmit={submitCreate}
        className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4"
      >
        <div className="space-y-1.5">
          <label htmlFor="time" className="text-sm text-ink-soft">
            New 30-min slot at
          </label>
          <Input
            id="time"
            type="time"
            step={1800}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-36"
          />
        </div>
        <Button type="submit" disabled={create.isPending || !time}>
          {create.isPending ? "Creating…" : "Create slot"}
        </Button>
        {createError && (
          <p className="w-full text-sm text-clay-dark">{createError}</p>
        )}
      </form>

      {slots.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : slots.isError ? (
        <p role="alert" className="text-clay-dark">
          Couldn&apos;t load slots. Please refresh.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-ink-soft">
          No slots on this date yet. Create one above.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          {rows.map((slot, i) => (
            <SlotRow
              key={slot.id}
              slot={slot}
              timezone={timezone}
              divider={i > 0}
              fmtTime={fmtTime}
            />
          ))}
        </div>
      )}
    </Container>
  );
}

function SlotRow({
  slot,
  timezone,
  divider,
  fmtTime,
}: {
  slot: AdminSlot;
  timezone: string;
  divider: boolean;
  fmtTime: (iso: string, tz: string) => string;
}) {
  const patch = usePatchSlot(slot.id);
  const del = useDeleteSlot(slot.id);
  const busy = patch.isPending || del.isPending;

  const status = slot.effectiveStatus;
  const canBlock = status === "available";
  const canUnblock = status === "blocked";
  const canDelete = status === "available" || status === "blocked";

  const actionError = patch.error instanceof ApiError
    ? patch.error.message
    : del.error instanceof ApiError
      ? del.error.message
      : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 bg-surface px-5 py-4",
        divider && "border-t border-border"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-ink">
          {fmtTime(slot.startAt, timezone)} – {fmtTime(slot.endAt, timezone)}
        </span>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            STATUS_BADGE[status] ?? "bg-surface-sunken text-ink-soft"
          )}
        >
          {status}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {canBlock && (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => patch.mutate({ baseStatus: "blocked" })}
          >
            Block
          </Button>
        )}
        {canUnblock && (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => patch.mutate({ baseStatus: "available" })}
          >
            Unblock
          </Button>
        )}
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => del.mutate()}
          >
            Delete
          </Button>
        )}
        {!canBlock && !canUnblock && !canDelete && (
          <span className="text-xs text-ink-faint">No actions</span>
        )}
      </div>

      {actionError && (
        <p className="w-full text-sm text-clay-dark">{actionError}</p>
      )}
    </div>
  );
}