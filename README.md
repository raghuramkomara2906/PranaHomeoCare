# Online Homeopathic Consultation Platform — Frontend

A calm, premium frontend for an online homeopathic consultation practice, built with Next.js App Router. This README covers what's implemented so far and how to run it; each phase below will get its own short addendum as it lands.

## Status: Phase 1 of 4 — Design System & Homepage

- Phase 1 — Design system & homepage (this delivery)
- Phase 2 — Booking flow (service -> date -> time -> sign in -> review -> confirmation)
- Phase 3 — Patient dashboard, incl. the time-gated Join Consultation experience
- Phase 4 — Practitioner dashboard

Every other route in the sitemap (`/about`, `/services`, `/stories`, `/journal`, `/how-it-works`, `/faq`, `/login`, `/register`, `/book`, `/contact`, `/dashboard`, `/practitioner/dashboard`, `/legal/*`) already resolves to a lightweight "coming soon" placeholder built from the shared design system, so navigation works end-to-end today.

## Tech stack

Next.js 16 (App Router, TypeScript, `src/` dir) - React 19 - Tailwind CSS v4 (CSS-first `@theme` config) - shadcn/ui-style components (hand-authored on Radix primitives + CVA, not the CLI) - React Hook Form + Zod (installed, activates with the booking form in Phase 2) - TanStack Query (provider configured now; the homepage fetches via Server Components for performance/SEO -- Query takes over where client-side fetching genuinely applies, starting with live slot availability in Phase 2) - Lucide icons - Framer Motion (all animation is gated by `MotionConfig reducedMotion="user"`, so it automatically respects the OS-level reduced-motion setting) - embla-carousel-react for the testimonial carousel.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. No backend is required -- every page currently reads from mock data.

## Connecting the real backend later

All mock data lives in `src/data/*` and is only ever imported by the matching module in `src/services/*`. Each service function (e.g. `getServices()` in `src/services/services.service.ts`) is already `async` and returns the exact shape defined in `src/lib/types`. To connect the FastAPI backend:

1. Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`.
2. In each `src/services/*.ts` file, swap the mock-returning body for a call through `apiFetch()` (see `src/lib/api-client.ts`), e.g. `return apiFetch<Service[]>("/services")`.
3. Nothing above the service layer needs to change -- components only ever import from `src/services`, never from `src/data` directly.

## Project structure

```
src/
  app/                     Routes (App Router). Pages stay thin: fetch + compose.
    layout.tsx             Fonts, metadata, Header/Footer/Assistant chrome, providers
    page.tsx               Homepage
    <route>/page.tsx       One stub page per sitemap route (built out in later phases)
    legal/[slug]/page.tsx  Single dynamic route for all six legal documents
  components/
    ui/                    Design-system primitives (Button, Card, Accordion, Sheet, ...)
    layout/                Header, Footer, MobileNav
    home/                  One component per homepage section
    assistant/             The rule-based website assistant widget
    shared/                Cross-page pieces: ServiceCard, ArticleCard, botanical motifs, PlaceholderTag, ComingSoon
  lib/
    types/                 Domain TypeScript types, incl. the exact Appointment shape from spec
    assistant/              Assistant menu config + keyword-based safety detection (no generative AI)
    utils.ts, format.ts, api-client.ts
  data/                    Mock data only -- never imported outside src/services
  services/                Async functions components actually call; the future API boundary
  config/site.ts            Nav items, footer links, and placeholder practitioner identity
```

## Design system

Full rationale is in code comments at the top of `src/app/globals.css`. Summary: a warm off-white canvas with sage, teal, sand, and sky accents; dark charcoal text; generously rounded cards with soft, warm-toned shadows. Headings use Fraunces (a soft, warm serif), body text uses Inter, and anything representing precise, verified data -- prices, durations, appointment times, the future countdown timer -- uses IBM Plex Mono, so the typography itself signals which numbers are exact. The signature visual motif is original, hand-drawn botanical line art (`src/components/shared/botanical-motifs.tsx`) in the spirit of antique herbarium plates, used in place of stock photography or generic medical iconography.

## Hero photography

The homepage hero is a full-bleed image composition — currently a gradient placeholder clearly marked "Photograph placeholder" in the corner, with the exact swap-in code commented directly above it in `src/components/home/hero.tsx`. Drop a real photo at `public/images/hero-portrait.jpg` (portrait orientation, soft directional light, muted color grade works best) and swap the placeholder `<div>` for the commented-out `next/image` block. The header is fixed and transparent over this hero specifically (solid everywhere else, or once scrolled), so any hero photo should hold up under white overlaid text — the built-in gradient scrim helps with that regardless of the final image.

## Placeholder content

Anything specific to the real practitioner -- name, title, qualifications, license number, years of experience, contact details, service pricing, and all testimonials -- is mock or placeholder content and is marked one of two ways:

- Bracketed text, e.g. `[Practitioner Name]`, wherever a field appears frequently in small UI (header, footer).
- The `PlaceholderTag` component (a small dashed badge reading "Placeholder -- verify before publishing") next to specific claims like pricing and credentials.

**Do not launch with this content as-is.** Search the codebase for `PlaceholderTag` and `[` to find every instance that needs a real value, and route qualifications, licensing claims, and legal pages through appropriate review before publishing.

## Accessibility notes

Focus states are handled globally via `:focus-visible` in `globals.css` rather than per component, so keyboard focus is visible and consistent everywhere. All interactive primitives (Accordion, Sheet, Popover, Avatar) are built on Radix UI, which supplies correct ARIA roles/attributes and keyboard behavior. The assistant's conversation log uses `role="log" aria-live="polite"` so new responses are announced. Motion throughout respects `prefers-reduced-motion` via `MotionConfig`.

## Known placeholders in this phase

- No backend exists yet -- every list of appointments, slots, or user data will need Phase 2-4 plus a live API to become real.
- Article, "About", and "Services" detail pages are stubs; only the homepage's preview cards are fully built.
- A real logo/favicon is not included; `src/components/shared/logo.tsx` is a text + line-art placeholder.
