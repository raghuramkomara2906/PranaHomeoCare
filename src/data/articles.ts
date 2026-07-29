import type { Article } from "@/lib/types";
import { siteConfig } from "@/config/site";

/** Article cards + full bodies, shown on the Journal list and detail pages. */
export const mockArticles: Article[] = [
  {
    id: "article_whole_person",
    slug: "how-homeopathy-looks-at-the-whole-person",
    title: "How Homeopathy Looks at the Whole Person",
    summary:
      "Why we focus on your overall well-being, not just individual symptoms.",
    category: "Holistic Wellness",
    author: siteConfig.practitionerName,
    publishedDate: "2026-06-02",
    reviewedDate: "2026-06-30",
    readTimeMinutes: 4,
    featured: true,
    coverArtSeed: 1,
    body: [
      {
        type: "paragraph",
        text:
          "Homeopathy takes a different approach: we view your health as an interconnected system where physical symptoms, emotional stress, lifestyle, and daily energy all play a role.",
      },
      {
        type: "paragraph",
        text:
          "During a consultation, we don't just look at what is bothering you — we look at how your body experiences it. By understanding your complete health picture, we can suggest a personalized approach intended to gently support your overall sense of well-being.",
      },
    ],
  },
  {
    id: "article_what_to_share",
    slug: "what-information-is-helpful-to-share",
    title: "What Information Is Helpful to Share in Your Consultation?",
    summary: "A quick guide on what to keep in mind before our conversation.",
    category: "Getting Ready",
    author: siteConfig.practitionerName,
    publishedDate: "2026-06-10",
    reviewedDate: "2026-06-30",
    readTimeMinutes: 4,
    featured: true,
    coverArtSeed: 2,
    body: [
      {
        type: "paragraph",
        text:
          "You don't need to prepare a formal presentation before our call. Sharing a few specific details, though, helps us build a much deeper understanding of your situation:",
      },
      {
        type: "list",
        items: [
          "Your main concerns: what bothered you first, and how long it has been present.",
          "Symptom triggers: whether weather, specific foods, time of day, or stress levels make things better or worse.",
          "General body patterns: your sleep, appetite, thermal comfort (feeling naturally warmer or colder), and energy levels through the day.",
          "Past medical history: any previous health conditions, ongoing medications, or medical reports.",
        ],
      },
      {
        type: "paragraph",
        text:
          "Remember: no detail is too small. Every piece helps paint a clear picture of your individual health.",
      },
    ],
  },
  {
    id: "article_everyday_habits",
    slug: "simple-everyday-habits-for-natural-vitality",
    title: "Simple Everyday Habits for Natural Vitality",
    summary:
      "Gentle, everyday routines that support long-term balance and wellness.",
    category: "Everyday Health",
    author: siteConfig.practitionerName,
    publishedDate: "2026-06-18",
    reviewedDate: "2026-06-30",
    readTimeMinutes: 5,
    featured: true,
    coverArtSeed: 3,
    body: [
      {
        type: "paragraph",
        text:
          "Gentle, supportive daily practices go hand in hand with your consultations. Here are a few foundational habits to help keep your body balanced:",
      },
      {
        type: "list",
        items: [
          "Hydrate mindfully: sip fresh water through the day to keep your digestion and energy active.",
          "Prioritize unhurried rest: aim for consistent sleep timings to give your nervous system time to repair and reset.",
          "Gentle daily movement: light walking or stretching improves circulation and helps release physical and mental tension.",
          "Listen to your body: notice early signs of fatigue or stress, and give yourself space to pause before burnout sets in.",
        ],
      },
    ],
  },
];

export const featuredArticles: Article[] = mockArticles.filter((a) => a.featured);