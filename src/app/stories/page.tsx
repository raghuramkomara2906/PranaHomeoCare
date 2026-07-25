import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Stories",
};

export default function StoriesPage() {
  return (
    <ComingSoon
      eyebrow="Stories"
      title="Patient stories are coming next"
      description="This page will bring together patient experiences and testimonials — each published only with the patient's explicit permission."
    />
  );
}
