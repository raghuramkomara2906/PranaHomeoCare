"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AssistantWidget } from "@/components/assistant/assistant-widget";

/**
 * The public site chrome (header, footer, assistant) wraps every page except
 * the authenticated /admin area, which gets a clean full-height surface.
 */
export function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  if (isAdmin) {
    return (
      <main id="main-content" className="flex-1 bg-canvas-muted">
        {children}
      </main>
    );
  }

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 pt-20">
        {children}
      </main>
      <Footer />
      <AssistantWidget />
    </>
  );
}