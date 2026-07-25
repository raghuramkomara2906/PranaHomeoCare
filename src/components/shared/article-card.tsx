import * as React from "react";
import Link from "next/link";

import type { Article } from "@/lib/types";
import { formatShortDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArticleCoverArt } from "@/components/shared/article-cover-art";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden p-0 transition-shadow duration-300 hover:shadow-lifted">
      <Link
        href={`/journal/${article.slug}`}
        className="flex h-full flex-col"
      >
        <ArticleCoverArt seed={article.coverArtSeed} className="aspect-[16/10]" />
        <div className="flex flex-1 flex-col gap-3 p-6">
          <Badge variant="sage" className="w-fit">
            {article.category}
          </Badge>
          <h3 className="font-display text-lg leading-snug text-ink transition-colors group-hover:text-sage-dark">
            {article.title}
          </h3>
          <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-ink-soft">
            {article.summary}
          </p>
          <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-ink-faint">
            <span>{article.author}</span>
            <span>Reviewed {formatShortDate(article.reviewedDate)}</span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
