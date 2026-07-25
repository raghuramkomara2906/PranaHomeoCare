import type { Metadata } from "next";
import { PatientDashboard } from "@/components/dashboard/patient-dashboard";

export const metadata: Metadata = {
  title: "Your Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <PatientDashboard />;
}
