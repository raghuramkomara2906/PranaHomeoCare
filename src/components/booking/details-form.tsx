"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  bookingDetailsSchema,
  type BookingDetailsValues,
} from "@/lib/validation/booking-details";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function DetailsForm({
  submitting,
  errorMessage,
  onBack,
  onSubmit,
}: {
  submitting: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onSubmit: (values: BookingDetailsValues) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BookingDetailsValues>({
    resolver: zodResolver(bookingDetailsSchema),
    defaultValues: {
      patientName: "",
      mobileNumber: "",
      smsConsent: false,
      termsAccepted: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="patientName">Full name</Label>
        <Input
          id="patientName"
          autoComplete="name"
          aria-invalid={Boolean(errors.patientName)}
          {...register("patientName")}
        />
        {errors.patientName && (
          <p className="text-sm text-clay-dark">{errors.patientName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="mobileNumber">Mobile number</Label>
        <div className="flex items-center gap-2">
          <span className="flex h-11 items-center rounded-md border border-border-strong bg-surface-sunken px-3 font-mono text-sm text-ink-soft">
            +91
          </span>
          <Input
            id="mobileNumber"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="10-digit number"
            aria-invalid={Boolean(errors.mobileNumber)}
            {...register("mobileNumber")}
          />
        </div>
        {errors.mobileNumber && (
          <p className="text-sm text-clay-dark">{errors.mobileNumber.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <Controller
          control={control}
          name="smsConsent"
          render={({ field }) => (
            <label className="flex items-start gap-3 text-sm text-ink-soft">
              <Checkbox
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v === true)}
                aria-invalid={Boolean(errors.smsConsent)}
                className="mt-0.5"
              />
              <span>
                I agree to receive appointment-related SMS messages (OTP,
                confirmation, and reminders) on this number.
              </span>
            </label>
          )}
        />
        {errors.smsConsent && (
          <p className="text-sm text-clay-dark">{errors.smsConsent.message}</p>
        )}

        <Controller
          control={control}
          name="termsAccepted"
          render={({ field }) => (
            <label className="flex items-start gap-3 text-sm text-ink-soft">
              <Checkbox
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v === true)}
                aria-invalid={Boolean(errors.termsAccepted)}
                className="mt-0.5"
              />
              <span>I accept the booking terms and cancellation policy.</span>
            </label>
          )}
        />
        {errors.termsAccepted && (
          <p className="text-sm text-clay-dark">
            {errors.termsAccepted.message}
          </p>
        )}
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-clay-dark">
          {errorMessage}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending code…" : "Send verification code"}
        </Button>
      </div>
    </form>
  );
}