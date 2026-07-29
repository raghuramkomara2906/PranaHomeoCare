import type { Practitioner } from "@/lib/types";
import { siteConfig } from "@/config/site";

export const mockPractitioner: Practitioner = {
  id: "practitioner_001",
  name: siteConfig.practitionerName,
  title: siteConfig.practitionerTitle,
  qualifications: [
    "BHMS (Bachelor of Homeopathic Medicine & Surgery)",
    "Consulting Homeopathic Physician",
  ],
  registrationPlaceholder: "[Registration / License No.]",
  yearsExperiencePlaceholder: "[Years of Experience]",
  languages: ["English", "Telugu"," Hindi"],
  philosophy:
    "My commitment to you is simple: fresh energy, undivided attention, and genuine time to listen to your story. Together, we build a gentle, thoughtful path to your natural well-being — a space where your health is heard, valued, and understood.",
  values: [
    "Fresh energy and undivided attention at every visit",
    "Unhurried consultations that respect your time",
    "Care for the whole person, not just individual symptoms",
    "An ongoing relationship, not a one-time visit",
  ],
  areasOfConsultation: [
    "General wellness conversations",
    "Ongoing follow-up support",
    "Family and household consultations",
  ],
  availabilitySummary:
    "Online consultation slots are released on a rolling basis — see live availability on the booking page.",
  photoAlt: "Photograph of Dr. Yamini Veduruparthi (placeholder)",
};