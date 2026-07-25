import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Journal",
};

export default function JournalPage() {
  return (
    <ComingSoon
      eyebrow="Journal"
      title="Searchable articles are coming next"
      description="This page will bring together every educational article with search, category filters, and reading history."
    />
  );
}
