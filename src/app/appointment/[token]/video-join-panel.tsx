"use client";

import * as React from "react";

import { ApiError } from "@/lib/api-client";
import { useJoinConsultation, useJoinStatus } from "@/hooks/use-appointment";
import { Button } from "@/components/ui/button";

/** Video meeting states (P-015 / WF-004). Polls while the patient waits for the
 * link or the join window, then offers Join — which is the only call that
 * returns the raw Zoom URL. */
export function VideoJoinPanel({ token }: { token: string }) {
  const [poll, setPoll] = React.useState<number | false>(false);
  const status = useJoinStatus(token, { refetchInterval: poll });
  const join = useJoinConsultation(token);

  React.useEffect(() => {
    const state = status.data?.state;
    setPoll(state === "pending" || state === "too_early" ? 20000 : false);
  }, [status.data?.state]);

  function onJoin() {
    join.mutate(undefined, {
      onSuccess: (res) =>
        window.open(res.joinUrl, "_blank", "noopener,noreferrer"),
      onError: () => {
        void status.refetch();
      },
    });
  }

  if (status.isLoading) {
    return <p className="text-sm text-ink-soft">Checking meeting status…</p>;
  }
  const data = status.data;
  if (!data) return null;

  const joinError =
    join.isError && join.error instanceof ApiError
      ? join.error.message
      : join.isError
        ? "We couldn't open the meeting. Please try again."
        : null;

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-sm text-ink-soft">{data.message}</p>
      {data.canJoin && (
        <Button className="mt-4 w-full" onClick={onJoin} disabled={join.isPending}>
          {join.isPending ? "Opening…" : "Join video consultation"}
        </Button>
      )}
      {joinError && <p className="mt-2 text-sm text-clay-dark">{joinError}</p>}
    </div>
  );
}