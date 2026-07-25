import type { FaqItem } from "@/lib/types";
import { mockDelay } from "@/lib/api-client";
import { mockFaqs, homepageFaqs } from "@/data/faqs";

/**
 * Service module: FAQs. Backs both the FAQ page and the rule-based
 * website assistant's approved-content search (see
 * src/components/assistant). Swap bodies for apiFetch calls against
 * GET /api/v1/faqs once the backend exists.
 */
export async function getHomepageFaqs(): Promise<FaqItem[]> {
  await mockDelay();
  return homepageFaqs;
}

export async function getFaqs(): Promise<FaqItem[]> {
  await mockDelay();
  return mockFaqs;
}

/**
 * Simple client-safe keyword search over approved FAQ content. This is
 * intentionally not AI-generated — it ranks by keyword overlap only, per
 * the "rule-based, no generative AI" requirement for Version 1.
 */
export function searchFaqsSync(query: string, faqs: FaqItem[] = mockFaqs): FaqItem[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);

  if (terms.length === 0) return [];

  return faqs
    .map((faq) => {
      const haystack = `${faq.question} ${faq.answer}`.toLowerCase();
      const score = terms.reduce(
        (total, term) => total + (haystack.includes(term) ? 1 : 0),
        0
      );
      return { faq, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.faq);
}
