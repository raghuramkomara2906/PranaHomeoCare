import type { Metadata } from "next";

import { getServices } from "@/services/services.service";
import { BookingFlow } from "@/components/book/booking-flow";

export const metadata: Metadata = {
  title: "Book a Consultation",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service: serviceSlug } = await searchParams;
  const services = await getServices();

  const initialService =
    services.find((service) => service.slug === serviceSlug) ?? null;

  return <BookingFlow services={services} initialService={initialService} />;
}
