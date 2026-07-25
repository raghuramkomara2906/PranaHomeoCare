import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <ComingSoon
      eyebrow="Contact"
      title="A full contact page is coming next"
      description="This page will include a contact form, business details, and technical support information — with a clear notice not to submit medical information here."
    />
  );
}
