import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { Article } from "@/lib/types";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/shared/article-card";
import { Reveal } from "@/components/shared/reveal";

export function EducationPreview({ articles }: { articles: Article[] }) {
  return (
    <section className="bg-canvas py-16 md:py-24 lg:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Journal"
            title="Learn at Your Own Pace"
            lede="General, educational reading on the online consultation process and everyday wellbeing."
          />
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/journal">
              Visit Journal
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {articles.map((article, i) => (
            <Reveal as="li" key={article.id} delay={i * 0.08} className="h-full">
              <ArticleCard article={article} />
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
