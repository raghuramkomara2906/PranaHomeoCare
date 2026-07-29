import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { mockArticles } from "@/data/articles";
import { formatShortDate } from "@/lib/format";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ArticleCoverArt } from "@/components/shared/article-cover-art";

export function generateStaticParams() {
  return mockArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = mockArticles.find((a) => a.slug === slug);
  return {
    title: article ? article.title : "Article",
    description: article?.summary,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = mockArticles.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <article className="bg-canvas py-12 md:py-16">
      <Container className="max-w-2xl">
        <Link
          href="/journal"
          className="text-sm text-sage-dark underline-offset-4 hover:underline"
        >
          ← Journal
        </Link>

        <Badge variant="sage" className="mt-5 w-fit">
          {article.category}
        </Badge>
        <h1 className="mt-3 font-display text-3xl leading-tight text-ink md:text-4xl">
          {article.title}
        </h1>
        <p className="mt-3 text-sm text-ink-faint">
          {article.author} · {article.readTimeMinutes} min read · Reviewed{" "}
          {formatShortDate(article.reviewedDate)}
        </p>

        <ArticleCoverArt
          seed={article.coverArtSeed}
          className="mt-8 aspect-[16/9] w-full rounded-xl"
        />

        <div className="mt-8 space-y-5">
          {(article.body ?? []).map((block, i) =>
            block.type === "paragraph" ? (
              <p key={i} className="text-base leading-relaxed text-ink-soft">
                {block.text}
              </p>
            ) : (
              <ul key={i} className="space-y-2">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-3 text-base leading-relaxed text-ink-soft">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-sage" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>

        <div className="mt-10 rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-ink">Ready to start your health journey?</p>
          <Link
            href="/book"
            className="mt-3 inline-flex items-center rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-ink-on-dark transition-colors hover:bg-sage-dark"
          >
            Book a free consultation
          </Link>
        </div>
      </Container>
    </article>
  );
}