import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Consultation Services",
};

export default function ServicesPage() {
  return (
    <ComingSoon
      eyebrow="Consultation Services"
      title="The full services grid is coming next"
      description="This page will list every consultation type in detail, each with its own service page and booking link."
    />
  );
}
