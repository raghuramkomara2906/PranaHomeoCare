import type { Article } from "@/lib/types";
import { siteConfig } from "@/config/site";

/**
 * MOCK DATA — replace with a real API response from GET /api/v1/articles
 * once the backend is connected (see src/services/articles.service.ts).
 */
export const mockArticles: Article[] = [
  {
    id: "article_first_consultation",
    slug: "what-to-expect-first-online-consultation",
    title: "What to Expect From Your First Online Consultation",
    summary:
      "A walk-through of what actually happens in a first appointment, from joining the call to what to have ready beforehand.",
    category: "Online Consultation",
    author: siteConfig.practitionerName,
    publishedDate: "2026-05-04",
    reviewedDate: "2026-06-18",
    readTimeMinutes: 5,
    featured: true,
    coverArtSeed: 1,
  },
  {
    id: "article_video_space",
    slug: "setting-up-your-video-visit-space",
    title: "Setting Up a Comfortable, Private Space for Your Video Visit",
    summary:
      "Small changes to lighting, seating, and connectivity that make a real difference to how a video consultation feels.",
    category: "Online Consultation",
    author: siteConfig.practitionerName,
    publishedDate: "2026-05-21",
    reviewedDate: "2026-06-18",
    readTimeMinutes: 4,
    featured: true,
    coverArtSeed: 2,
  },
  {
    id: "article_daily_habits",
    slug: "daily-habits-that-support-wellbeing",
    title: "Simple Daily Habits That Support Long-Term Wellbeing",
    summary:
      "General, everyday habits — sleep, movement, hydration, routine — that consistently come up in wellness conversations.",
    category: "General Wellness",
    author: siteConfig.practitionerName,
    publishedDate: "2026-06-02",
    reviewedDate: "2026-06-30",
    readTimeMinutes: 6,
    featured: true,
    coverArtSeed: 3,
  },
  {
    id: "article_rescheduling",
    slug: "rescheduling-made-simple",
    title: "Rescheduling or Cancelling: A Quick Guide",
    summary:
      "How rescheduling and cancellation work on this platform, and how to avoid last-minute stress.",
    category: "Online Consultation",
    author: siteConfig.practitionerName,
    publishedDate: "2026-04-16",
    reviewedDate: "2026-06-01",
    readTimeMinutes: 3,
    coverArtSeed: 4,
  },
  {
    id: "article_family_routine",
    slug: "family-routine-around-wellness-conversations",
    title: "Building a Family Routine Around Wellness Conversations",
    summary:
      "Ideas for households that want to make space for regular, low-pressure conversations about wellbeing together.",
    category: "Family Wellness",
    author: siteConfig.practitionerName,
    publishedDate: "2026-03-28",
    reviewedDate: "2026-05-30",
    readTimeMinutes: 5,
    coverArtSeed: 5,
  },
  {
    id: "article_sleep_movement_rest",
    slug: "sleep-movement-and-rest-the-basics",
    title: "Sleep, Movement, and Rest: The Basics That Matter Most",
    summary:
      "A general look at the everyday fundamentals that most wellbeing conversations circle back to, sooner or later.",
    category: "Healthy Lifestyle",
    author: siteConfig.practitionerName,
    publishedDate: "2026-02-19",
    reviewedDate: "2026-05-12",
    readTimeMinutes: 6,
    coverArtSeed: 6,
  },
];

export const featuredArticles = mockArticles.filter((article) => article.featured);
