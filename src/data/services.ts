import type { Service } from "@/lib/types";

/**
 * MOCK DATA — replace with a real API response from GET /api/v1/services
 * once the backend is connected (see src/services/services.service.ts).
 * Prices are illustrative placeholders (`isPriceEstimate: true`) — confirm
 * real pricing before launch.
 */
export const mockServices: Service[] = [
  {
    id: "svc_initial",
    slug: "initial-consultation",
    name: "Initial Online Consultation",
    shortDescription:
      "A comprehensive first meeting to get to know you and explain how ongoing consultations work.",
    description:
      "Your first appointment is a relaxed, thorough conversation over video call. It gives the practitioner a full picture of your goals and gives you a clear sense of what to expect from consultations going forward — no forms to fill in beforehand beyond your booking details.",
    durationMinutes: 60,
    price: 120,
    currency: "USD",
    isPriceEstimate: true,
    appropriateFor: [
      "First-time patients",
      "Anyone new to online consultations",
      "People who'd like to understand the process before committing further",
    ],
    included: [
      "A 60-minute video consultation",
      "Time to ask questions about the process",
      "A clear summary of recommended next steps",
    ],
    isOnline: true,
  },
  {
    id: "svc_followup",
    slug: "follow-up-consultation",
    name: "Follow-up Consultation",
    shortDescription:
      "A shorter check-in to discuss how things have been going since your last visit.",
    description:
      "Follow-up consultations keep the conversation going for existing patients. They're shorter than an initial consultation and focused on continuity — what's changed, what questions have come up, and what happens next.",
    durationMinutes: 30,
    price: 65,
    currency: "USD",
    isPriceEstimate: true,
    appropriateFor: [
      "Existing patients with a prior consultation on file",
      "Anyone continuing a regular series of visits",
    ],
    included: [
      "A 30-minute video consultation",
      "A chance to ask follow-up questions",
      "Help scheduling your next visit, if needed",
    ],
    isOnline: true,
  },
  {
    id: "svc_wellness",
    slug: "general-wellness-consultation",
    name: "General Wellness Consultation",
    shortDescription:
      "For anyone who'd like an open conversation about overall wellbeing.",
    description:
      "This consultation is designed for people who don't yet have a specific reason to book, but want to start a conversation about their general wellbeing with a qualified practitioner in a calm, unhurried setting.",
    durationMinutes: 45,
    price: 90,
    currency: "USD",
    isPriceEstimate: true,
    appropriateFor: [
      "Anyone curious about general wellbeing conversations",
      "People who are not currently an existing patient",
    ],
    included: [
      "A 45-minute video consultation",
      "An open, unhurried conversation",
      "Guidance on whether further visits may be useful",
    ],
    isOnline: true,
  },
  {
    id: "svc_family",
    slug: "family-consultation",
    name: "Family Consultation",
    shortDescription:
      "A single extended session for multiple family or household members together.",
    description:
      "Family consultations give households a shared block of time to speak with the practitioner together. It's a practical option when several family members would each like some time on the same call.",
    durationMinutes: 75,
    price: 150,
    currency: "USD",
    isPriceEstimate: true,
    appropriateFor: [
      "Households or families attending together",
      "Multiple family members with overlapping availability",
    ],
    included: [
      "A 75-minute video consultation for multiple attendees",
      "Shared and individual discussion time",
      "Guidance on booking any individual follow-ups",
    ],
    isOnline: true,
  },
];
