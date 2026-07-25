"use client";

import * as React from "react";
import { MessageCircle, X, SendHorizontal, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { mockFaqs } from "@/data/faqs";
import { searchFaqsSync } from "@/services/faq.service";
import {
  detectAssistantIntent,
  EMERGENCY_RESPONSE,
  MEDICAL_REDIRECT_RESPONSE,
  NO_RESULTS_RESPONSE,
  OPENING_MESSAGE,
} from "@/lib/assistant/detection";
import { ASSISTANT_MENU_OPTIONS } from "@/lib/assistant/menu-options";
import type { AssistantTurn } from "@/lib/assistant/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { AssistantMessage } from "@/components/assistant/assistant-message";

let turnCounter = 0;
function nextId() {
  turnCounter += 1;
  return `turn_${turnCounter}_${Date.now()}`;
}

const OPENING_TURN: AssistantTurn = {
  id: "opening",
  from: "assistant",
  kind: "menu",
  text: OPENING_MESSAGE,
};

export function AssistantWidget() {
  const [open, setOpen] = React.useState(false);
  const [turns, setTurns] = React.useState<AssistantTurn[]>([OPENING_TURN]);
  const [inputValue, setInputValue] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns]);

  function pushTurn(turn: AssistantTurn) {
    setTurns((prev) => [...prev, turn]);
  }

  function handleOptionClick(optionId: string) {
    const option = ASSISTANT_MENU_OPTIONS.find((o) => o.id === optionId);
    if (!option) return;

    pushTurn({ id: nextId(), from: "user", text: option.label });

    if (option.action.type === "show-pricing") {
      pushTurn({
        id: nextId(),
        from: "assistant",
        kind: "pricing",
        text: option.responseText,
      });
      return;
    }
    if (option.action.type === "show-contact") {
      pushTurn({
        id: nextId(),
        from: "assistant",
        kind: "contact",
        text: option.responseText,
      });
      return;
    }
    if (option.action.type === "require-login") {
      pushTurn({
        id: nextId(),
        from: "assistant",
        kind: "cta",
        text: option.responseText,
        href: "/login",
        ctaLabel: "Log In to Continue",
      });
      return;
    }
    // type === "navigate"
    pushTurn({
      id: nextId(),
      from: "assistant",
      kind: "cta",
      text: option.responseText,
      href: option.action.href,
      ctaLabel: "Take Me There",
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    pushTurn({ id: nextId(), from: "user", text });
    setInputValue("");

    const intent = detectAssistantIntent(text);

    if (intent === "emergency") {
      pushTurn({
        id: nextId(),
        from: "assistant",
        kind: "text",
        text: EMERGENCY_RESPONSE,
      });
      return;
    }

    if (intent === "medical") {
      pushTurn({
        id: nextId(),
        from: "assistant",
        kind: "cta",
        text: MEDICAL_REDIRECT_RESPONSE,
        href: "/book",
        ctaLabel: "Book a Consultation",
      });
      return;
    }

    const results = searchFaqsSync(text, mockFaqs).slice(0, 3);
    if (results.length > 0) {
      pushTurn({
        id: nextId(),
        from: "assistant",
        kind: "faq-results",
        text: "Here's what I found in the approved FAQ content:",
        results,
      });
    } else {
      pushTurn({
        id: nextId(),
        from: "assistant",
        kind: "cta",
        text: NO_RESULTS_RESPONSE,
        href: "/faq",
        ctaLabel: "Browse All FAQs",
      });
    }
  }

  function handleReset() {
    setTurns([OPENING_TURN]);
    setInputValue("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className={cn(
            "fixed bottom-5 right-5 z-50 size-14 rounded-full shadow-lifted transition-transform hover:scale-105 sm:bottom-8 sm:right-8",
            open && "scale-95"
          )}
          aria-label={open ? "Close assistant" : "Open website assistant"}
        >
          {open ? (
            <X className="size-6" aria-hidden="true" />
          ) : (
            <MessageCircle className="size-6" aria-hidden="true" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="flex h-[min(32rem,75vh)] w-[min(23rem,90vw)] flex-col p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="font-display text-base text-ink">Website Assistant</p>
            <p className="text-xs text-ink-faint">
              General questions only — not a diagnostic tool
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Start over
          </button>
        </div>

        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          aria-label="Assistant conversation"
          className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
        >
          {turns.map((turn) => (
            <AssistantMessage key={turn.id} turn={turn} />
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2.5">
          {ASSISTANT_MENU_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleOptionClick(option.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface px-2.5 py-1 text-[0.7rem] font-medium text-ink-soft transition-colors hover:border-sage hover:bg-sage-light hover:text-sage-dark"
            >
              <option.icon className="size-3" aria-hidden="true" />
              {option.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-border p-3"
        >
          <label htmlFor="assistant-input" className="sr-only">
            Ask a general question
          </label>
          <input
            id="assistant-input"
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Ask a general question…"
            className="h-10 flex-1 rounded-full border border-border-strong bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint focus-visible:border-sage"
          />
          <Button type="submit" size="icon" aria-label="Send message">
            <SendHorizontal className="size-4" aria-hidden="true" />
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
