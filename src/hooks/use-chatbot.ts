"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { getChatIntro, sendChatMessage } from "@/services/chatbot.service";
import type { ChatMessageInput } from "@/lib/types/api";

export function useChatIntro(enabled = true) {
  return useQuery({
    queryKey: queryKeys.chatbot.intro,
    queryFn: getChatIntro,
    enabled,
  });
}

export function useSendChatMessage() {
  return useMutation({
    mutationFn: (input: ChatMessageInput) => sendChatMessage(input),
  });
}