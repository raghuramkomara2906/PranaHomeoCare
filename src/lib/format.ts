/**
 * Formatting helpers shared across the design system.
 * Kept framework-agnostic (no React) so they can be unit tested in isolation.
 */

/** Formats a whole-number price placeholder, e.g. formatPrice(120) -> "$120". */
export function formatPrice(amount: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Formats minutes as a short duration label, e.g. 60 -> "60 min". */
export function formatDuration(minutes: number) {
  if (minutes % 60 === 0 && minutes >= 60) {
    const hours = minutes / 60;
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }
  return `${minutes} min`;
}

/** Formats an ISO date string using the viewer's (or a given) IANA time zone. */
export function formatDateInZone(
  isoString: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  }
) {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone }).format(
    new Date(isoString)
  );
}

/** Formats an ISO time string using the viewer's (or a given) IANA time zone. */
export function formatTimeInZone(isoString: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(new Date(isoString));
}

/** Returns the viewer's local IANA time zone, with a safe fallback. */
export function getLocalTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Human-readable "reviewed" / "published" date, e.g. "Reviewed Jun 3, 2026". */
export function formatShortDate(isoString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoString));
}

/** Formats a millisecond duration as a countdown, e.g. "1h 05m 32s" / "04m 12s". */
export function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0
    ? `${hours}h ${pad(minutes)}m ${pad(seconds)}s`
    : `${pad(minutes)}m ${pad(seconds)}s`;
}
