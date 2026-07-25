import type { Testimonial } from "@/lib/types";

/**
 * MOCK DATA — sample placeholders only. Real testimonials must be
 * published with the patient's explicit permission (see the notice
 * rendered under the testimonial carousel), and should replace every
 * entry here, including the attribution style.
 */
export const mockTestimonials: Testimonial[] = [
  {
    id: "testimonial_1",
    quote:
      "Booking was simple and the reminders made it easy to stay on track. The whole process felt calm rather than clinical.",
    attribution: "J.M., Verified Patient (Placeholder)",
    serviceName: "Initial Online Consultation",
  },
  {
    id: "testimonial_2",
    quote:
      "I liked being able to choose a time that actually worked for my schedule and join the call from home without any hassle.",
    attribution: "R.K., Verified Patient (Placeholder)",
    serviceName: "Follow-up Consultation",
  },
  {
    id: "testimonial_3",
    quote:
      "Everything about the online consultation felt well organized, from confirmation through to joining the call itself.",
    attribution: "A.T., Verified Patient (Placeholder)",
    serviceName: "General Wellness Consultation",
  },
];
