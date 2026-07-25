"use client";

import * as React from "react";

import type {
  Appointment,
  PatientContactDetails,
  Service,
  TimeSlot,
} from "@/lib/types";
import { ApiError } from "@/lib/api-client";
import { createAppointment } from "@/services/appointments.service";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { BookingStepper, type BookingStepMeta } from "@/components/book/booking-stepper";
import { SelectServiceStep } from "@/components/book/steps/select-service-step";
import { DateTimeStep } from "@/components/book/steps/date-time-step";
import { PatientDetailsStep } from "@/components/book/steps/patient-details-step";
import { ReviewStep } from "@/components/book/steps/review-step";
import { ConfirmationStep } from "@/components/book/steps/confirmation-step";

const STEPS: BookingStepMeta[] = [
  { id: "service", label: "Service" },
  { id: "datetime", label: "Date & Time" },
  { id: "details", label: "Your details" },
  { id: "review", label: "Review" },
  { id: "confirmation", label: "Confirmation" },
];

interface BookingState {
  step: number;
  furthestStep: number;
  service: Service | null;
  dateIso: string | null;
  slot: TimeSlot | null;
  patient: PatientContactDetails | null;
  agreedToTerms: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  appointment: Appointment | null;
}

type BookingAction =
  | { type: "SELECT_SERVICE"; service: Service }
  | { type: "SELECT_DATE"; dateIso: string }
  | { type: "SELECT_SLOT"; slot: TimeSlot }
  | { type: "SUBMIT_DETAILS"; patient: PatientContactDetails }
  | { type: "SET_AGREED"; value: boolean }
  | { type: "GOTO"; step: number }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "START_SUBMIT" }
  | { type: "SUBMIT_ERROR"; message: string }
  | { type: "CONFIRMED"; appointment: Appointment }
  | { type: "RESET"; service: Service | null };

function advance(state: BookingState, step: number): BookingState {
  return { ...state, step, furthestStep: Math.max(state.furthestStep, step) };
}

function reducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "SELECT_SERVICE":
      return { ...state, service: action.service };
    case "SELECT_DATE":
      return { ...state, dateIso: action.dateIso, slot: null };
    case "SELECT_SLOT":
      return { ...state, slot: action.slot };
    case "SUBMIT_DETAILS":
      return advance({ ...state, patient: action.patient }, 3);
    case "SET_AGREED":
      return { ...state, agreedToTerms: action.value };
    case "GOTO":
      return action.step <= state.furthestStep
        ? { ...state, step: action.step, submitError: null }
        : state;
    case "NEXT":
      return advance(state, state.step + 1);
    case "BACK":
      return { ...state, step: Math.max(0, state.step - 1), submitError: null };
    case "START_SUBMIT":
      return { ...state, isSubmitting: true, submitError: null };
    case "SUBMIT_ERROR":
      return { ...state, isSubmitting: false, submitError: action.message };
    case "CONFIRMED":
      return advance(
        { ...state, isSubmitting: false, appointment: action.appointment },
        4
      );
    case "RESET":
      return {
        step: action.service ? 1 : 0,
        furthestStep: action.service ? 1 : 0,
        service: action.service,
        dateIso: null,
        slot: null,
        patient: null,
        agreedToTerms: false,
        isSubmitting: false,
        submitError: null,
        appointment: null,
      };
    default:
      return state;
  }
}

export function BookingFlow({
  services,
  initialService,
}: {
  services: Service[];
  initialService: Service | null;
}) {
  const [state, dispatch] = React.useReducer(reducer, {
    step: initialService ? 1 : 0,
    furthestStep: initialService ? 1 : 0,
    service: initialService,
    dateIso: null,
    slot: null,
    patient: null,
    agreedToTerms: false,
    isSubmitting: false,
    submitError: null,
    appointment: null,
  });

  async function handleConfirm() {
    if (!state.service || !state.slot || !state.patient) return;
    dispatch({ type: "START_SUBMIT" });

    try {
      const appointment = await createAppointment({
        serviceId: state.service.id,
        startTimeUtc: state.slot.startTimeUtc,
        patient: state.patient,
      });
      dispatch({ type: "CONFIRMED", appointment });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Something went wrong confirming your booking — please try again.";
      dispatch({ type: "SUBMIT_ERROR", message });
    }
  }

  const stepId = STEPS[state.step].id;

  return (
    <Section spacing="tight" className="min-h-[70vh]">
      <Container className="max-w-3xl">
        {stepId !== "confirmation" ? (
          <div className="mb-10">
            <BookingStepper
              steps={STEPS}
              currentIndex={state.step}
              furthestIndex={state.furthestStep}
              onStepSelect={(step) => dispatch({ type: "GOTO", step })}
            />
          </div>
        ) : null}

        {stepId === "service" ? (
          <SelectServiceStep
            services={services}
            selectedServiceId={state.service?.id ?? null}
            onSelect={(service) => dispatch({ type: "SELECT_SERVICE", service })}
            onNext={() => dispatch({ type: "NEXT" })}
          />
        ) : null}

        {stepId === "datetime" && state.service ? (
          <DateTimeStep
            service={state.service}
            selectedDateIso={state.dateIso}
            selectedSlot={state.slot}
            onSelectDate={(dateIso) => dispatch({ type: "SELECT_DATE", dateIso })}
            onSelectSlot={(slot) => dispatch({ type: "SELECT_SLOT", slot })}
            onBack={() => dispatch({ type: "BACK" })}
            onNext={() => dispatch({ type: "NEXT" })}
          />
        ) : null}

        {stepId === "details" ? (
          <PatientDetailsStep
            defaultValues={state.patient}
            onBack={() => dispatch({ type: "BACK" })}
            onSubmit={(patient) => dispatch({ type: "SUBMIT_DETAILS", patient })}
          />
        ) : null}

        {stepId === "review" && state.service && state.slot && state.patient ? (
          <ReviewStep
            service={state.service}
            slot={state.slot}
            patient={state.patient}
            agreedToTerms={state.agreedToTerms}
            onAgreedToTermsChange={(value) =>
              dispatch({ type: "SET_AGREED", value })
            }
            onEditStep={(step) => dispatch({ type: "GOTO", step })}
            onBack={() => dispatch({ type: "BACK" })}
            onConfirm={handleConfirm}
            isSubmitting={state.isSubmitting}
            submitError={state.submitError}
          />
        ) : null}

        {stepId === "confirmation" && state.appointment ? (
          <ConfirmationStep
            appointment={state.appointment}
            onBookAnother={() => dispatch({ type: "RESET", service: null })}
          />
        ) : null}
      </Container>
    </Section>
  );
}
