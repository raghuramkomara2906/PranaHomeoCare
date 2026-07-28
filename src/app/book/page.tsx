import type { Metadata } from "next";

import { BookingFlow } from "@/components/booking/booking-flow";
import type { ConsultationType } from "@/lib/types/api";

export const metadata: Metadata = {
  title: "Book a Consultation",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const initialType: ConsultationType | null =
    type === "teleconsultation" || type === "video_consultation" ? type : null;

  return <BookingFlow initialType={initialType} />;
}