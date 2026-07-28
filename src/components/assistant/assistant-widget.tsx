"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, RotateCcw, SendHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api-client";
import { useChatIntro, useSendChatMessage } from "@/hooks/use-chatbot";
import type { ChatAction, QuickReply } from "@/lib/types/api";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Turn =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "bot";
      text: string;
      safety?: boolean;
      quickReplies?: QuickReply[];
      actions?: ChatAction[];
    };

let counter = 0;
const nextId = () => `t${(counter += 1)}`;

export function AssistantWidget() {
  const [open, setOpen] = React.useState(false);
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const intro = useChatIntro(open);
  const send = useSendChatMessage();

  const introTurn = React.useCallback((): Turn[] => {
    if (!intro.data) return [];
    return [
      {
        id: "intro",
        role: "bot",
        text: intro.data.greeting,
        quickReplies: intro.data.quickReplies,
      },
    ];
  }, [intro.data]);

  // Seed the opening message once the intro loads.
  React.useEffect(() => {
    if (open && intro.data && turns.length === 0) {
      setTurns(introTurn());
    }
  }, [open, intro.data, turns.length, introTurn]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns, send.isPending]);

  function ask(
    payload: { message?: string; choiceId?: string },
    userLabel: string
  ) {
    setTurns((prev) => [...prev, { id: nextId(), role: "user", text: userLabel }]);
    send.mutate(payload, {
      onSuccess: (r) =>
        setTurns((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "bot",
            text: r.reply,
            safety: r.safety,
            quickReplies: r.quickReplies,
            actions: r.actions,
          },
        ]),
      onError: (e) =>
        setTurns((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "bot",
            text:
              e instanceof ApiError
                ? e.message
                : "Something went wrong. Please try again.",
          },
        ]),
    });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || send.isPending) return;
    setInput("");
    ask({ message: text }, text);
  }

  function reset() {
    setTurns(introTurn());
    setInput("");
  }

  const last = turns[turns.length - 1];
  const quickReplies =
    last && last.role === "bot" && !send.isPending ? last.quickReplies ?? [] : [];

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
            <p className="font-display text-base text-ink">Assistant</p>
            <p className="text-xs text-ink-faint">
              Consultation guidance — not a diagnostic tool
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
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
          className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
        >
          {intro.isLoading && turns.length === 0 && (
            <p className="text-sm text-ink-faint">Starting up…</p>
          )}

          {turns.map((turn) =>
            turn.role === "user" ? (
              <div
                key={turn.id}
                className="max-w-[80%] self-end rounded-2xl rounded-br-sm bg-sage px-3.5 py-2 text-sm text-ink-on-dark"
              >
                {turn.text}
              </div>
            ) : (
              <div key={turn.id} className="max-w-[85%] space-y-2 self-start">
                <div
                  className={cn(
                    "rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm",
                    turn.safety
                      ? "bg-clay-light text-clay-dark"
                      : "bg-surface-sunken text-ink"
                  )}
                >
                  {turn.text}
                </div>
                {turn.actions?.map((action) => (
                  <Button
                    key={action.path}
                    asChild
                    size="sm"
                    variant="secondary"
                    className="w-full"
                  >
                    <Link href={action.path} onClick={() => setOpen(false)}>
                      {action.label}
                    </Link>
                  </Button>
                ))}
              </div>
            )
          )}

          {send.isPending && (
            <div className="max-w-[85%] self-start rounded-2xl rounded-bl-sm bg-surface-sunken px-3.5 py-2 text-sm text-ink-faint">
              …
            </div>
          )}
        </div>

        {quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2.5">
            {quickReplies.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => ask({ choiceId: q.id }, q.label)}
                className="inline-flex items-center rounded-full border border-border-strong bg-surface px-2.5 py-1 text-[0.7rem] font-medium text-ink-soft transition-colors hover:border-sage hover:bg-sage-light hover:text-sage-dark"
              >
                {q.label}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={submit}
          className="flex items-center gap-2 border-t border-border p-3"
        >
          <label htmlFor="assistant-input" className="sr-only">
            Ask a question
          </label>
          <input
            id="assistant-input"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask a question…"
            className="h-10 flex-1 rounded-full border border-border-strong bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint focus-visible:border-sage"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            disabled={send.isPending}
          >
            <SendHorizontal className="size-4" aria-hidden="true" />
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}