import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FOOTER_LEGAL_LINKS } from "@/config/site";
import { ComingSoon } from "@/components/shared/coming-soon";

const LEGAL_TITLES: Record<string, string> = Object.fromEntries(
  FOOTER_LEGAL_LINKS.map((link) => [link.href.split("/").pop() as string, link.label])
);

type LegalPageParams = { slug: string };

export function generateStaticParams() {
  return Object.keys(LEGAL_TITLES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<LegalPageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = LEGAL_TITLES[slug];
  if (!title) return {};
  return { title };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<LegalPageParams>;
}) {
  const { slug } = await params;
  const title = LEGAL_TITLES[slug];
  if (!title) notFound();

  return (
    <ComingSoon
      eyebrow="Legal"
      title={`${title} — draft coming next`}
      description="This document is a template and must be reviewed by qualified legal counsel before publication."
    />
  );
}
