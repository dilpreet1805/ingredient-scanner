export type Limits = { user: number; subscriber: number; global: number };

const DEFAULTS: Limits = { user: 20, subscriber: 200, global: 300 };

function readLimit(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  // A bad value falls back to the default instead of removing the limit.
  return Number.isInteger(n) && n >= 0 && n <= 1_000_000 ? n : fallback;
}

/** Limits come from secrets, so you can change them without editing code. 0 turns a limit into an off switch. */
export function readLimits(get: (name: string) => string | undefined): Limits {
  return {
    user: readLimit(get("USER_DAILY_LIMIT"), DEFAULTS.user),
    subscriber: readLimit(get("SUBSCRIBER_DAILY_LIMIT"), DEFAULTS.subscriber),
    global: readLimit(get("GLOBAL_DAILY_LIMIT"), DEFAULTS.global),
  };
}

/** The calendar date in India as YYYY-MM-DD. India has no daylight saving time. */
export function todayInIndia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
