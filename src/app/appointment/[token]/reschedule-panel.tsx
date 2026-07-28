"use client";

import { ApiError } from "@/lib/api-client";
import {
  useRescheduleAppointment,
  useRescheduleOptions,
} from "@/hooks/use-appointment";
import {
  DateSlotPicker,
  type SlotSelection,
} from "@/components/booking/date-slot-picker";
import { Button } from "@/components/ui/button";
import type { ConsultationType } from "@/lib/types/api";

export function ReschedulePanel({
  token,
  consultationType,
  onBack,
  onDone,
}: {
  token: string;
  consultationType: ConsultationType;
  onBack: () => void;
  onDone: () => void;
}) {
  const options = useRescheduleOptions(token);
  const reschedule = useRescheduleAppointment(token);

  function pick(selection: SlotSelection) {
    reschedule.mutate(selection.slotId, { onSuccess: () => onDone() });
  }

  const error =
    reschedule.isError && reschedule.error instanceof ApiError
      ? reschedule.error.message
      : reschedule.isError
        ? "We couldn't reschedule. Please try another time."
        : null;

  if (options.isLoading) {
    return <p className="text-ink-soft">Loading available times…</p>;
  }

  if (options.data && !options.data.canReschedule) {
    return (
      <div className="space-y-4">
        <p className="text-ink-soft">
          Online rescheduling is no longer available for this appointment. Please
          contact the clinic.
        </p>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-ink">Choose a new time</h2>
      <DateSlotPicker consultationType={consultationType} onSelect={pick} />
      {error && <p className="text-sm text-clay-dark">{error}</p>}
      {reschedule.isPending && (
        <p className="text-sm text-ink-soft">Rescheduling…</p>
      )}
      <Button variant="ghost" onClick={onBack} disabled={reschedule.isPending}>
        Keep current appointment
      </Button>
    </div>
  );
}