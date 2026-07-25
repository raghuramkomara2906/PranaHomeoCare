"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Video } from "lucide-react";

import type { Appointment } from "@/lib/types";
import {
  formatCountdown,
  formatDateInZone,
  formatTimeInZone,
  getLocalTimeZone,
} from "@/lib/format";
import { getJoinStatus } from "@/services/appointments.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** The next upcoming appointment gets this treatment — a live countdown
 * until the join window opens, then a (placeholder) way to join. Join
 * eligibility always comes from the server poll below; the countdown text
 * between polls is cosmetic, ticking against the local clock. */
export function JoinConsultationPanel({ appointment }: { appointment: Appointment }) {
  const viewerTimeZone = React.useMemo(() => getLocalTimeZone(), []);
  const [hasJoined, setHasJoined] = React.useState(false);
  const [now, setNow] = React.useState<number | null>(null);

  const { data: joinStatus } = useQuery({
    queryKey: ["joinStatus", appointment.id],
    queryFn: () => getJoinStatus(appointment.id),
    refetchInterval: 20_000,
  });

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remainingMs =
    joinStatus && now !== null
      ? new Date(joinStatus.joinAvailableAt).getTime() - now
      : null;
  const canJoin = joinStatus?.canJoin ?? false;

  return (
    <Card className="border-sage/30 bg-sage-light/40 shadow-lifted">
      <CardHeader>
        <p className="text-eyebrow text-sage-dark">Your next consultation</p>
        <CardTitle>{appointment.serviceName}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-ink-soft">
          {formatDateInZone(appointment.startTimeUtc, viewerTimeZone)}
        </p>
        <p className="font-mono text-sm text-ink-soft">
          {formatTimeInZone(appointment.startTimeUtc, viewerTimeZone)} (
          {viewerTimeZone})
        </p>

        {hasJoined ? (
          <div className="mt-5 flex flex-col items-center gap-2 rounded-lg border border-dashed border-sage/40 py-8 text-center">
            <Video className="size-6 text-sage-dark" aria-hidden="true" />
            <p className="max-w-xs text-sm font-medium text-sage-dark">
              Video call — placeholder
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-ink-faint">
              In a live deployment, this is where your video consultation
              would launch.
            </p>
          </div>
        ) : canJoin ? (
          <Button className="mt-5" onClick={() => setHasJoined(true)}>
            Join Consultation
          </Button>
        ) : remainingMs !== null ? (
          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.08em] text-ink-faint">
              Join opens in
            </p>
            <p className="mt-1 font-mono text-2xl text-ink">
              {formatCountdown(remainingMs)}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
