/**
 * Rule-based intent detection for the website assistant. No generative AI
 * is used anywhere in this module, per the Version 1 requirement — this is
 * plain keyword matching that decides which canned, pre-approved response
 * to show.
 *
 * Priority order matters: emergency language is checked first and wins
 * even if the message also contains FAQ-searchable words, because safety
 * responses must never be crowded out by a partial keyword match.
 */

const EMERGENCY_KEYWORDS = [
  "emergency",
  "chest pain",
  "can't breathe",
  "cant breathe",
  "cannot breathe",
  "suicide",
  "suicidal",
  "overdose",
  "severe bleeding",
  "heart attack",
  "stroke",
  "911",
  "999",
  "112",
  "unconscious",
  "life threatening",
  "life-threatening",
];

const MEDICAL_INTENT_KEYWORDS = [
  "diagnose",
  "diagnosis",
  "symptom",
  "prescribe",
  "prescription",
  "treatment for",
  "cure for",
  "what medicine",
  "which remedy",
  "dosage",
  "dose of",
  "side effect",
  "interact with",
  "what's wrong with me",
  "whats wrong with me",
  "condition do i have",
  "is it safe to take",
];

export type AssistantIntent = "emergency" | "medical" | "general";

export function detectAssistantIntent(rawText: string): AssistantIntent {
  const text = rawText.toLowerCase();

  if (EMERGENCY_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return "emergency";
  }
  if (MEDICAL_INTENT_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return "medical";
  }
  return "general";
}

export const EMERGENCY_RESPONSE =
  "This website is not an emergency service. Contact your local emergency services or seek immediate professional care.";

export const MEDICAL_REDIRECT_RESPONSE =
  "This website assistant cannot diagnose conditions or recommend treatment. Please schedule a consultation with the practitioner for personalized guidance.";

export const NO_RESULTS_RESPONSE =
  "I couldn't find an approved article or FAQ that matches that. You can browse the FAQ page, or contact support directly and a member of the team will help.";

export const OPENING_MESSAGE = "Hello. How may I help you today?";
