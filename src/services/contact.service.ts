import type { ContactMessage, ContactMessageInput } from "@/lib/types";
import { apiFetch } from "@/lib/api-client";

export async function submitContactMessage(
  input: ContactMessageInput
): Promise<ContactMessage> {
  return apiFetch<ContactMessage>("/contact", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
