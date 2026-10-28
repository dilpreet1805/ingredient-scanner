export type AgeTier = "blocked" | "teen" | "adult";
export type AgeState = AgeTier | "unknown";

/** Product choices. Change them here and nowhere else. */
export const BLOCKED_BELOW_AGE = 11; // 10 and under are not allowed
export const ADULT_AT_AGE = 18; // the law treats anyone who has not completed 18 as a child

export type DateParts = { year: number; month: number; day: number };

export type AgeResult =
  | { ok: true; age: number }
  | { ok: false; reason: "invalid_date" | "future_date" | "too_old" };

const MIN_YEAR = 1900;
const MAX_AGE = 120;

export function tierForAge(age: number): AgeTier {
  if (age < BLOCKED_BELOW_AGE) return "blocked";
  if (age < ADULT_AT_AGE) return "teen";
  return "adult";
}

/** Last day of a month (month is 1 to 12). Day 0 of the next month is the last day of this one. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function calculateAge(birth: DateParts, today: DateParts): AgeResult {
  const { year, month, day } = birth;
  const whole = [year, month, day].every(Number.isInteger);
  if (
    !whole ||
    year < MIN_YEAR ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month)
  ) {
    return { ok: false, reason: "invalid_date" };
  }

  const birthKey = year * 10000 + month * 100 + day;
  const todayKey = today.year * 10000 + today.month * 100 + today.day;
  if (birthKey > todayKey) return { ok: false, reason: "future_date" };

  let age = today.year - year;
  // The birthday has not happened yet this year. A February 29 birthday is reached on March 1 in other years.
  if (today.month * 100 + today.day < month * 100 + day) age -= 1;
  if (age > MAX_AGE) return { ok: false, reason: "too_old" };

  return { ok: true, age };
}

/** The local calendar date of a Date, as plain numbers. */
export function partsFromDate(date: Date): DateParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function todayParts(): DateParts {
  return partsFromDate(new Date());
}
