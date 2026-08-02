/**
 * Central site configuration.
 *
 * `practitionerName`, `practitionerTitle`, contact details, and anything
 * else marked "placeholder" below are NOT real. They exist so every part
 * of the UI that needs a practitioner-specific fact has one consistent
 * value to render — replace all of them, and remove the PlaceholderTag
 * usages that reference them, before this site goes live.
 */
export const siteConfig = {
  name: "Prana Homeo Care",
  shortName: "Prana Homeo Care",
  // The header/footer wordmark splits across two lines — see Logo.
  brandPrimary: "Prana",
  brandSecondary: "Homeo Care",
  tagline: "Attentive care for your natural well-being",
  description:
    "Compassionate homeopathic consultations with an individualized approach for every stage of life.",
  // `||`, not `??`: Docker's `ENV FOO=$BAR` sets FOO to "" (not unset) when
  // the ARG wasn't supplied at build time, and `new URL("")` throws.
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://pranahomeocare.com",

  // The individual practitioner's identity — still a placeholder until
  // supplied and verified, distinct from the clinic brand above.
  practitionerName: "Dr. Yamini Veduruparthi",
  practitionerTitle: "Consulting Homeopathic Physician",
  contactEmail: "[hello@example.com]",
  contactPhone: "[+1 (000) 000-0000]",

  social: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    linkedin: "https://linkedin.com/",
  },
} as const;

export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Stories", href: "/stories" },
  { label: "Journal", href: "/journal" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "FAQs", href: "/faq" },
];

export const FOOTER_EXPLORE_LINKS: NavItem[] = [
  { label: "Home", href: "/" },
  ...NAV_ITEMS,
  { label: "Contact", href: "/contact" },
];

export const FOOTER_LEGAL_LINKS: NavItem[] = [
  { label: "Privacy Policy", href: "/legal/privacy-policy" },
  { label: "Terms of Use", href: "/legal/terms-of-use" },
  { label: "Medical Disclaimer", href: "/legal/medical-disclaimer" },
  { label: "Cancellation & Refund Policy", href: "/legal/cancellation-refund-policy" },
  { label: "Cookie Notice", href: "/legal/cookie-notice" },
  { label: "Accessibility Statement", href: "/legal/accessibility-statement" },
];

export const EDUCATIONAL_DISCLAIMER =
  "This content is provided for general educational purposes and is not a substitute for diagnosis, emergency care, or treatment from a qualified healthcare professional.";
