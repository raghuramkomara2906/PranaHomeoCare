"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { PatientContactDetails } from "@/lib/types";
import {
  patientDetailsSchema,
  type PatientDetailsFormValues,
} from "@/lib/validation/booking";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PatientDetailsStep({
  defaultValues,
  onBack,
  onSubmit,
}: {
  defaultValues: PatientContactDetails | null;
  onBack: () => void;
  onSubmit: (details: PatientContactDetails) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientDetailsFormValues>({
    resolver: zodResolver(patientDetailsSchema),
    defaultValues: defaultValues ?? {
      fullName: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  return (
    <div>
      <h2 className="font-display text-2xl text-ink md:text-3xl">
        Your details
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
        We&apos;ll use these to hold your appointment and send confirmation.
        Already have an account? Accounts aren&apos;t available yet — this
        booking will be linked to one automatically once they are.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-8 grid max-w-md gap-5"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            {...register("fullName")}
          />
          {errors.fullName ? (
            <p className="text-xs text-clay-dark">{errors.fullName.message}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-xs text-clay-dark">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
          {errors.phone ? (
            <p className="text-xs text-clay-dark">{errors.phone.message}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="notes">Anything you&apos;d like us to know (optional)</Label>
          <textarea
            id="notes"
            rows={3}
            aria-invalid={Boolean(errors.notes)}
            className={cn(
              "flex w-full rounded-md border border-border-strong bg-surface px-4 py-2.5 text-sm text-ink shadow-none transition-colors placeholder:text-ink-faint hover:border-ink-faint focus-visible:border-teal disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-clay"
            )}
            {...register("notes")}
          />
          {errors.notes ? (
            <p className="text-xs text-clay-dark">{errors.notes.message}</p>
          ) : null}
        </div>

        <div className="mt-3 flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </div>
  );
}
