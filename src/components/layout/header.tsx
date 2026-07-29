"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/config/site";
import { Button, ButtonDot } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/shared/logo";
import { MobileNav } from "@/components/layout/mobile-nav";

const HEADER_NAV_ITEMS = [{ label: "Home", href: "/" }, ...NAV_ITEMS];

export function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-border bg-canvas/95 shadow-soft backdrop-blur"
          : "bg-transparent"
      )}
    >
      <Container className="flex h-20 items-center justify-between gap-6">
        <Logo />

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Primary"
        >
          {HEADER_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-sage-light hover:text-sage-dark",
                  isActive && "bg-sage-light text-sage-dark"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/login"
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-sage-light hover:text-sage-dark",
              pathname === "/login" && "bg-sage-light text-sage-dark"
            )}
          >
            login
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/book">
              Book Consultation
              <ButtonDot />
            </Link>
          </Button>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
