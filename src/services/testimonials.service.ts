import type { Testimonial } from "@/lib/types";
import { mockDelay } from "@/lib/api-client";
import { mockTestimonials } from "@/data/testimonials";

/**
 * Service module: testimonials.
 * Swap the body for apiFetch<Testimonial[]>("/testimonials") once the
 * backend exists. Real testimonials must only be published with the
 * patient's explicit, on-file permission.
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  await mockDelay();
  return mockTestimonials;
}
