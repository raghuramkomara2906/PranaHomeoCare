import { apiFetch } from "@/lib/api-client";
import type { ChatIntro, ChatMessageInput, ChatReply } from "@/lib/types/api";

/** Optional consultation-guidance chatbot (never required for booking). */
export async function getChatIntro(): Promise<ChatIntro> {
  return apiFetch<ChatIntro>("/api/v1/chatbot/intro");
}

export async function sendChatMessage(
  input: ChatMessageInput
): Promise<ChatReply> {
  return apiFetch<ChatReply>("/api/v1/chatbot/message", {
    method: "POST",
    body: JSON.stringify(input),
  });
}