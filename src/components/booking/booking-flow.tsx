"use client";

import * as React from "react";

import { ApiError } from "@/lib/api-client";
import { newIdempotencyKey } from "@/services/booking.service";
import { useCreateBookingRequest } from "@/hooks/use-booking";
import type {
  AppointmentConfirmation,
  ConsultationType,
} from "@/lib/types/api";
import type { BookingDetailsValues } from "@/lib/validation/booking-details";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import {
  DateSlotPicker,
  type SlotSelection,
} from "@/components/booking/date-slot-picker";
import { DetailsForm } from "@/components/booking/details-form";
import { OtpStep } from "@/components/booking/otp-step";
import { ConfirmationStep } from "@/components/booking/confirmation-step";

type Step = "type" | "schedule" | "details" | "otp" | "confirmed";

const TYPE_OPTIONS: {
  value: ConsultationType;
  title: string;
  description: string;
}[] = [
  {
    value: "teleconsultation",
    title: "Teleconsultation",
    description: "A phone call — you call the clinic at your appointment time.",
  },
  {
    value: "video_consultation",
    title: "Video consultation",
    description: "Over Zoom, using a secure link added before your appointment.",
  },
];

const STEP_TITLES: Record<Step, string> = {
  type: "Choose a consultation type",
  schedule: "Pick a date and time",
  details: "Your details",
  otp: "Verify your mobile",
  confirmed: "You're all set",
};

export function BookingFlow({
  initialType,
}: {
  initialType: ConsultationType | null;
}) {
  const [step, setStep] = React.useState<Step>(
    initialType ? "schedule" : "type"
  );
  const [consultationType, setConsultationType] =
    React.useState<ConsultationType | null>(initialType);
  const [selection, setSelection] = React.useState<SlotSelection | null>(null);
  const [idempotencyKey, setIdempotencyKey] = React.useState("");

  const [bookingRequestId, setBookingRequestId] = React.useState<string | null>(
    null
  );
  const [maskedMobile, setMaskedMobile] = React.useState("");
  const [resendSeconds, setResendSeconds] = React.useState(0);
  const [confirmation, setConfirmation] =
    React.useState<AppointmentConfirmation | null>(null);

  const create = useCreateBookingRequest();

  function chooseType(type: ConsultationType) {
    setConsultationType(type);
    setStep("schedule");
  }

  function chooseSlot(next: SlotSelection) {
    setSelection(next);
    setIdempotencyKey(newIdempotencyKey()); // fresh key per booking attempt
    setStep("details");
  }

  function submitDetails(values: BookingDetailsValues) {
    if (!consultationType || !selection) return;
    create.mutate(
      {
        consultationType,
        slotId: selection.slotId,
        patientName: values.patientName,
        mobileNumber: values.mobileNumber,
        smsConsent: values.smsConsent,
        termsAccepted: values.termsAccepted,
        idempotencyKey,
      },
      {
        onSuccess: (res) => {
          setBookingRequestId(res.id);
          setMaskedMobile(res.maskedMobile);
          setResendSeconds(res.resendAvailableInSeconds);
          setStep("otp");
        },
      }
    );
  }

  const createError = create.isError
    ? create.error instanceof ApiError
      ? create.error.message
      : "We couldn't start your booking. Please try again."
    : null;

  return (
    <Container className="max-w-2xl py-12">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
          Book a consultation
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink">
          {STEP_TITLES[step]}
        </h1>
      </header>

      {step === "type" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => chooseType(option.value)}
              className="rounded-lg border border-border-strong bg-surface p-6 text-left shadow-soft transition-colors hover:border-sage"
            >
              <span className="font-display text-lg text-ink">
                {option.title}
              </span>
              <span className="mt-2 block text-sm text-ink-soft">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      )}

      {step === "schedule" && consultationType && (
        <div className="space-y-6">
          <DateSlotPicker
            consultationType={consultationType}
            onSelect={chooseSlot}
          />
          {!initialType && (
            <Button variant="ghost" onClick={() => setStep("type")}>
              Back
            </Button>
          )}
        </div>
      )}

      {step === "details" && (
        <DetailsForm
          submitting={create.isPending}
          errorMessage={createError}
          onBack={() => setStep("schedule")}
          onSubmit={submitDetails}
        />
      )}

      {step === "otp" && bookingRequestId && (
        <OtpStep
          bookingRequestId={bookingRequestId}
          maskedMobile={maskedMobile}
          initialResendSeconds={resendSeconds}
          onConfirmed={(c) => {
            setConfirmation(c);
            setStep("confirmed");
          }}
        />
      )}

      {step === "confirmed" && confirmation && (
        <ConfirmationStep confirmation={confirmation} />
      )}
    </Container>
  );
}