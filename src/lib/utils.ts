import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and resolve Tailwind conflicts.
 * Used throughout src/components/ui and every domain component.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
