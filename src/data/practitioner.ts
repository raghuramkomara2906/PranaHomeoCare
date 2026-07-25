import type { Practitioner } from "@/lib/types";
import { siteConfig } from "@/config/site";

/**
 * MOCK DATA — replace with a real API response from
 * GET /api/v1/practitioner once the backend is connected (see
 * src/services/practitioner.service.ts). Every "placeholder" field below
 * must be verified before this content is published.
 */
export const mockPractitioner: Practitioner = {
  id: "practitioner_001",
  name: siteConfig.practitionerName,
  title: siteConfig.practitionerTitle,
  qualifications: [
    "[Qualification — e.g., Diploma in Homeopathic Medicine]",
    "[Qualification — e.g., Registered Homeopath, professional body name]",
  ],
  registrationPlaceholder: "[Registration / License No.]",
  yearsExperiencePlaceholder: "[Years of Experience]",
  languages: ["English"],
  philosophy:
    "Every consultation starts with listening. Before anything else, I want to understand your goals and what brought you here — the conversation itself, not a checklist, shapes how we work together going forward.",
  values: [
    "Unhurried, attentive consultations",
    "Clear communication, in plain language",
    "Respect for your privacy and your time",
    "Honesty about what online consultation can and cannot offer",
  ],
  areasOfConsultation: [
    "General wellness conversations",
    "Ongoing follow-up support",
    "Family and household consultations",
  ],
  availabilitySummary:
    "Online consultation slots are released on a rolling basis — see live availability on the booking page.",
  photoAlt: "Placeholder for a professional photograph of the practitioner",
};
