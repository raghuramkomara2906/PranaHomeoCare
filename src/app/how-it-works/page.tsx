import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "How It Works",
};

export default function HowItWorksPage() {
  return (
    <ComingSoon
      eyebrow="How It Works"
      title="The full consultation journey is coming next"
      description="This page will walk through registration, booking, preparing for your call, joining, and rescheduling — plus what you'll need on the day."
    />
  );
}
