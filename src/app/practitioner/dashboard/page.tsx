import type { Metadata } from "next";
import { PractitionerDashboard } from "@/components/practitioner/practitioner-dashboard";

export const metadata: Metadata = {
  title: "Practitioner Dashboard",
  robots: { index: false, follow: false },
};

export default function PractitionerDashboardPage() {
  return <PractitionerDashboard />;
}
