import * as React from "react";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import {
  siteConfig,
  FOOTER_EXPLORE_LINKS,
  FOOTER_LEGAL_LINKS,
} from "@/config/site";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/shared/logo";
import { BotanicalSprigMini } from "@/components/shared/botanical-motifs";

export function Footer() {
  return (
    <footer className="border-t border-border bg-canvas-muted text-ink">
      <Container className="py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              {siteConfig.description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <SocialLink href={siteConfig.social.instagram} label="Instagram" />
              <SocialLink href={siteConfig.social.facebook} label="Facebook" />
              <SocialLink href={siteConfig.social.linkedin} label="LinkedIn" />
            </div>
          </div>

          <FooterColumn title="Explore" links={FOOTER_EXPLORE_LINKS} />
          <FooterColumn title="Legal" links={FOOTER_LEGAL_LINKS} />

          <div>
            <h3 className="text-eyebrow text-sage-dark">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden="true" />
                <span className="text-ink-soft">{siteConfig.contactEmail}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden="true" />
                <span className="text-ink-soft">{siteConfig.contactPhone}</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col gap-4 text-xs text-ink-faint md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-2">
            <BotanicalSprigMini className="size-4 text-ink-faint" />
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
            reserved.
          </p>
          <p className="max-w-xl leading-relaxed">
            {siteConfig.name} provides general educational content and
            online scheduling. It is not an emergency service and does not
            provide diagnosis, treatment, or medical advice online.
          </p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-eyebrow text-sage-dark">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-ink-soft transition-colors hover:text-sage-dark"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full border border-border-strong px-3.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-sage hover:text-sage-dark"
    >
      {label}
    </a>
  );
}
