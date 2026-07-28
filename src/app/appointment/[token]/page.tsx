import type { Metadata } from "next";

import { AppointmentManager } from "@/components/appointment/appointment-manager";

export const metadata: Metadata = {
  title: "Your appointment",
  robots: { index: false, follow: false },
};

export default async function AppointmentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <AppointmentManager token={token} />;
}