import type { Article } from "@/lib/types";
import { mockDelay } from "@/lib/api-client";
import { mockArticles, featuredArticles } from "@/data/articles";

/**
 * Service module: Journal articles.
 * Swap bodies for apiFetch calls against GET /api/v1/articles once the
 * backend exists.
 */
export async function getFeaturedArticles(): Promise<Article[]> {
  await mockDelay();
  return featuredArticles;
}

export async function getArticles(): Promise<Article[]> {
  await mockDelay();
  return mockArticles;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  await mockDelay();
  return mockArticles.find((article) => article.slug === slug) ?? null;
}
