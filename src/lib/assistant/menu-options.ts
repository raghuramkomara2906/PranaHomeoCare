import {
  CalendarPlus,
  ListChecks,
  CalendarClock,
  Compass,
  CalendarCog,
  Video,
  Tag,
  HelpCircle,
  Headset,
  type LucideIcon,
} from "lucide-react";

export type AssistantAction =
  | { type: "navigate"; href: string }
  | { type: "show-pricing" }
  | { type: "show-contact" }
  | { type: "require-login" };

export interface AssistantMenuOption {
  id: string;
  label: string;
  icon: LucideIcon;
  action: AssistantAction;
  /** Shown as the assistant's reply once this option is chosen. */
  responseText: string;
}

export const ASSISTANT_MENU_OPTIONS: AssistantMenuOption[] = [
  {
    id: "book",
    label: "Book a consultation",
    icon: CalendarPlus,
    action: { type: "navigate", href: "/book" },
    responseText:
      "I'll take you to the booking page, where you can choose a service, then a date and time.",
  },
  {
    id: "services",
    label: "View consultation services",
    icon: ListChecks,
    action: { type: "navigate", href: "/services" },
    responseText: "Here's where you can see every consultation service on offer.",
  },
  {
    id: "availability",
    label: "Check appointment availability",
    icon: CalendarClock,
    action: { type: "navigate", href: "/book" },
    responseText:
      "Live availability is shown as you go through the booking page.",
  },
  {
    id: "how-it-works",
    label: "Learn how online consultation works",
    icon: Compass,
    action: { type: "navigate", href: "/how-it-works" },
    responseText:
      "This page walks through the full journey, from booking to joining your call.",
  },
  {
    id: "reschedule",
    label: "Reschedule an appointment",
    icon: CalendarCog,
    action: { type: "navigate", href: "/dashboard" },
    responseText:
      "You can reschedule from your patient dashboard — you'll need to log in first if you haven't already.",
  },
  {
    id: "join",
    label: "Join my consultation",
    icon: Video,
    action: { type: "require-login" },
    responseText:
      "Joining a consultation requires you to be logged in. Let's get you signed in first.",
  },
  {
    id: "pricing",
    label: "View pricing",
    icon: Tag,
    action: { type: "show-pricing" },
    responseText: "Here's current pricing for each consultation type.",
  },
  {
    id: "faqs",
    label: "Read frequently asked questions",
    icon: HelpCircle,
    action: { type: "navigate", href: "/faq" },
    responseText: "Here's the full list of frequently asked questions.",
  },
  {
    id: "contact",
    label: "Contact support",
    icon: Headset,
    action: { type: "show-contact" },
    responseText: "Here's how to reach the team directly.",
  },
];
