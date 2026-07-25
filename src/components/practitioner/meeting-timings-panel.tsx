"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { Trash2 } from "lucide-react";

import type { WeeklyRule, WeeklyRuleInput } from "@/lib/types";
import {
  createException,
  deleteException,
  getExceptions,
  getWeeklyRules,
  replaceWeeklyRules,
} from "@/services/admin.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function minutesToTimeInput(minutes: number) {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

function timeInputToMinutes(value: string) {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

function WeeklyHoursEditor() {
  const queryClient = useQueryClient();
  const { data: rules, isLoading } = useQuery({
    queryKey: ["weeklyRules"],
    queryFn: getWeeklyRules,
  });
  const [draft, setDraft] = React.useState<WeeklyRule[] | null>(null);
  const [loadedRules, setLoadedRules] = React.useState<WeeklyRule[] | null>(null);

  // Seed the editable draft the first time the fetched rules arrive, without
  // clobbering in-progress edits on a background refetch. Adjusting state
  // during render (rather than in a useEffect) avoids an extra render pass.
  if (rules && rules !== loadedRules && draft === null) {
    setLoadedRules(rules);
    setDraft([...rules].sort((a, b) => a.weekday - b.weekday));
  }

  const saveMutation = useMutation({
    mutationFn: (input: WeeklyRuleInput[]) => replaceWeeklyRules(input),
    onSuccess: (updated) => {
      setDraft([...updated].sort((a, b) => a.weekday - b.weekday));
      queryClient.invalidateQueries({ queryKey: ["weeklyRules"] });
    },
  });

  function updateRow(weekday: number, patch: Partial<WeeklyRule>) {
    setDraft(
      (current) =>
        current?.map((rule) => (rule.weekday === weekday ? { ...rule, ...patch } : rule)) ??
        current
    );
  }

  if (isLoading || !draft) {
    return (
      <div className="grid gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-2">
        {draft.map((rule) => (
          <div
            key={rule.weekday}
            className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface p-4"
          >
            <label className="flex w-36 shrink-0 items-center gap-2.5">
              <Checkbox
                checked={rule.isActive}
                onCheckedChange={(checked) =>
                  updateRow(rule.weekday, { isActive: checked === true })
                }
              />
              <span className="text-sm font-medium text-ink">
                {WEEKDAY_LABELS[rule.weekday]}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={minutesToTimeInput(rule.startMinute)}
                disabled={!rule.isActive}
                onChange={(e) =>
                  updateRow(rule.weekday, {
                    startMinute: timeInputToMinutes(e.target.value),
                  })
                }
                className="w-32"
              />
              <span className="text-sm text-ink-faint">to</span>
              <Input
                type="time"
                value={minutesToTimeInput(rule.endMinute)}
                disabled={!rule.isActive}
                onChange={(e) =>
                  updateRow(rule.weekday, {
                    endMinute: timeInputToMinutes(e.target.value),
                  })
                }
                className="w-32"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button
          onClick={() =>
            saveMutation.mutate(
              draft.map(({ weekday, startMinute, endMinute, isActive }) => ({
                weekday,
                startMinute,
                endMinute,
                isActive,
              }))
            )
          }
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Saving…" : "Save hours"}
        </Button>
        {saveMutation.isSuccess ? (
          <p className="text-sm text-sage-dark">Saved.</p>
        ) : null}
      </div>
    </div>
  );
}

function ExceptionsEditor() {
  const queryClient = useQueryClient();
  const [date, setDate] = React.useState("");
  const [note, setNote] = React.useState("");

  const startIso = format(new Date(), "yyyy-MM-dd");
  const endIso = format(addDays(new Date(), 90), "yyyy-MM-dd");

  const { data: exceptions, isLoading } = useQuery({
    queryKey: ["exceptions", startIso, endIso],
    queryFn: () => getExceptions(startIso, endIso),
  });

  const addMutation = useMutation({
    mutationFn: () => createException({ date, isClosed: true, note: note || null }),
    onSuccess: () => {
      setDate("");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["exceptions"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteException(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exceptions"] }),
  });

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (date) addMutation.mutate();
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="exception-date">Block a date</Label>
          <Input
            id="exception-date"
            type="date"
            value={date}
            min={startIso}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="exception-note">Note (optional)</Label>
          <Input
            id="exception-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Holiday"
            className="w-48"
          />
        </div>
        <Button type="submit" variant="outline" disabled={!date || addMutation.isPending}>
          Add
        </Button>
      </form>

      <div className="mt-4 grid gap-2">
        {isLoading ? (
          <Skeleton className="h-10" />
        ) : exceptions && exceptions.length > 0 ? (
          exceptions.map((exception) => (
            <div
              key={exception.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5"
            >
              <div>
                <span className="font-mono text-sm text-ink">
                  {format(new Date(`${exception.date}T00:00:00`), "MMM d, yyyy")}
                </span>
                {exception.note ? (
                  <span className="ml-2 text-sm text-ink-soft">{exception.note}</span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeMutation.mutate(exception.id)}
                disabled={removeMutation.isPending}
                className="text-ink-faint transition-colors hover:text-clay-dark"
                aria-label="Remove blocked date"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-ink-faint">No blocked dates in the next 90 days.</p>
        )}
      </div>
    </div>
  );
}

export function MeetingTimingsPanel() {
  return (
    <div className="grid gap-10">
      <div>
        <h2 className="font-display text-lg text-ink">Weekly hours</h2>
        <p className="mt-1 text-sm text-ink-soft">
          These hours drive what patients can book on the site.
        </p>
        <div className="mt-4">
          <WeeklyHoursEditor />
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg text-ink">Blocked dates</h2>
        <p className="mt-1 text-sm text-ink-soft">
          One-off closures — holidays, time off — that override your weekly hours.
        </p>
        <div className="mt-4">
          <ExceptionsEditor />
        </div>
      </div>
    </div>
  );
}
