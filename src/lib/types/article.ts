export type ArticleCategory =
  | "Online Consultation"
  | "General Wellness"
  | "Healthy Lifestyle"
  | "Family Wellness"
  | "Frequently Asked Questions";

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: ArticleCategory;
  author: string;
  publishedDate: string;
  reviewedDate: string;
  readTimeMinutes: number;
  featured?: boolean;
  coverArtSeed: number;
}
