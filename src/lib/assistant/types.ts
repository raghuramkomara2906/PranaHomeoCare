import type { FaqItem } from "@/lib/types";

export type AssistantTurn =
  | { id: string; from: "user"; text: string }
  | { id: string; from: "assistant"; kind: "menu"; text: string }
  | { id: string; from: "assistant"; kind: "text"; text: string }
  | { id: string; from: "assistant"; kind: "pricing"; text: string }
  | { id: string; from: "assistant"; kind: "contact"; text: string }
  | {
      id: string;
      from: "assistant";
      kind: "faq-results";
      text: string;
      results: FaqItem[];
    }
  | {
      id: string;
      from: "assistant";
      kind: "cta";
      text: string;
      href: string;
      ctaLabel: string;
    };
