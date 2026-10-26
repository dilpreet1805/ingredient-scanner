const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** The Monday of the week that contains the given day. */
export function startOfWeek(key: string): string {
  const offset = (fromDateKey(key).getDay() + 6) % 7; // Monday = 0
  return addDays(key, -offset);
}

export function weekDays(key: string): string[] {
  const start = startOfWeek(key);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatDayLabel(key: string, todayKey: string): string {
  if (key === todayKey) return "Today";
  if (key === addDays(todayKey, -1)) return "Yesterday";
  if (key === addDays(todayKey, 1)) return "Tomorrow";
  return fromDateKey(key).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function weekdayShort(key: string): string {
  return fromDateKey(key).toLocaleDateString(undefined, { weekday: "short" });
}
