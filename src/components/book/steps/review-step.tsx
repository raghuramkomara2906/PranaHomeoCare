"use client";

import * as React from "react";

import type { PatientContactDetails, Service, TimeSlot } from "@/lib/types";
import { formatDateInZone, formatDuration, formatPrice, formatTimeInZone, getLocalTimeZone } from "@/lib/format";
import { EDUCATIONAL_DISCLAIMER } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PlaceholderTag } from "@/components/shared/placeholder-tag";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ReviewStep({
  service,
  slot,
  patient,
  agreedToTerms,
  onAgreedToTermsChange,
  onEditStep,
  onBack,
  onConfirm,
  isSubmitting,
  submitError,
}: {
  service: Service;
  slot: TimeSlot;
  patient: PatientContactDetails;
  agreedToTerms: boolean;
  onAgreedToTermsChange: (value: boolean) => void;
  onEditStep: (index: number) => void;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  submitError?: string | null;
}) {
  const viewerTimeZone = React.useMemo(() => getLocalTimeZone(), []);

  return (
    <div>
      <h2 className="font-display text-2xl text-ink md:text-3xl">
        Review &amp; confirm
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
        Take a moment to check everything below before you confirm.
      </p>

      <div className="mt-8 grid max-w-xl gap-4">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-base">{service.name}</CardTitle>
              <p className="mt-1 text-sm text-ink-soft">
                {formatDuration(service.durationMinutes)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(0)}
              className="text-sm font-medium text-sage-dark underline-offset-4 hover:underline"
            >
              Edit
            </button>
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-0">
            <span className="font-mono text-lg text-ink">
              {formatPrice(service.price, service.currency)}
            </span>
            {service.isPriceEstimate ? (
              <PlaceholderTag label="Price placeholder" />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-base">
                {formatDateInZone(slot.startTimeUtc, viewerTimeZone)}
              </CardTitle>
              <p className="mt-1 font-mono text-sm text-ink-soft">
                {formatTimeInZone(slot.startTimeUtc, viewerTimeZone)}
              </p>
              <p className="mt-1 text-xs text-ink-faint">
                Your local time zone ({viewerTimeZone})
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="text-sm font-medium text-sage-dark underline-offset-4 hover:underline"
            >
              Edit
            </button>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-base">{patient.fullName}</CardTitle>
              <p className="mt-1 text-sm text-ink-soft">{patient.email}</p>
              <p className="text-sm text-ink-soft">{patient.phone}</p>
              {patient.notes ? (
                <p className="mt-2 text-sm italic text-ink-faint">
                  &ldquo;{patient.notes}&rdquo;
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-sm font-medium text-sage-dark underline-offset-4 hover:underline"
            >
              Edit
            </button>
          </CardHeader>
        </Card>

        <p className="text-xs leading-relaxed text-ink-faint">
          {EDUCATIONAL_DISCLAIMER}
        </p>

        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
          <Checkbox
            id="agree-terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) =>
              onAgreedToTermsChange(checked === true)
            }
          />
          <Label htmlFor="agree-terms" className="text-sm font-normal leading-relaxed text-ink-soft">
            I confirm the details above are accurate and I agree to the
            practice&apos;s cancellation and privacy policies.
          </Label>
        </div>
      </div>

      {submitError ? (
        <p className="mt-6 max-w-xl rounded-lg border border-clay/40 bg-clay-light px-4 py-3 text-sm text-clay-dark">
          {submitError}
        </p>
      ) : null}

      <div className="mt-8 flex max-w-xl justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!agreedToTerms || isSubmitting}
        >
          {isSubmitting ? "Confirming…" : "Confirm booking"}
        </Button>
      </div>
    </div>
  );
}
