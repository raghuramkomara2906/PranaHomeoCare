import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
};

export default function FaqPage() {
  return (
    <ComingSoon
      eyebrow="Frequently Asked Questions"
      title="Categorized FAQs are coming next"
      description="This page will organize every question by topic — appointments, online consultations, payments, rescheduling, technical support, privacy, and the website assistant — with search."
    />
  );
}
