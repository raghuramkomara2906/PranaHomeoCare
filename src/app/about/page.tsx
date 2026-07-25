import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "About the Practitioner",
};

export default function AboutPage() {
  return (
    <ComingSoon
      eyebrow="About the Practitioner"
      title="A full introduction is on its way"
      description="This page will include the practitioner's full profile, qualifications, philosophy, and areas of consultation."
    />
  );
}
