import type { Metadata } from "next";

import { mockArticles } from "@/data/articles";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section";
import { ArticleCard } from "@/components/shared/article-card";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Gentle, practical notes on homeopathy, preparing for a consultation, and everyday well-being.",
};

export default function JournalPage() {
  return (
    <section className="bg-canvas py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Journal"
          title="Notes on Gentle, Everyday Well-being"
          lede="Short reads on how homeopathy looks at the whole person, how to prepare for a consultation, and simple habits that support your health."
          align="center"
          className="mx-auto"
        />
        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockArticles.map((article) => (
            <li key={article.id} className="h-full">
              <ArticleCard article={article} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}