import { assertEquals } from "@std/assert";

import { readLimits, todayInIndia } from "./limits.ts";

const env = (values: Record<string, string>) => (name: string) => values[name];

Deno.test("limits default to 20, 200 and 300", () => {
  assertEquals(readLimits(env({})), { user: 20, subscriber: 200, global: 300 });
  assertEquals(readLimits(env({ USER_DAILY_LIMIT: "  " })).user, 20);
});

Deno.test("limits can be changed with secrets", () => {
  const limits = readLimits(
    env({
      USER_DAILY_LIMIT: "3",
      SUBSCRIBER_DAILY_LIMIT: "50",
      GLOBAL_DAILY_LIMIT: "2",
    }),
  );
  assertEquals(limits, { user: 3, subscriber: 50, global: 2 });
});

Deno.test(
  "a bad value falls back to the default instead of removing the limit",
  () => {
    for (const bad of ["abc", "-5", "1.5", "99999999", "Infinity", "1e3x"]) {
      assertEquals(readLimits(env({ USER_DAILY_LIMIT: bad })).user, 20);
    }
  },
);

Deno.test("zero is allowed, as an emergency off switch", () => {
  assertEquals(readLimits(env({ GLOBAL_DAILY_LIMIT: "0" })).global, 0);
});

Deno.test("the day changes at midnight India time", () => {
  assertEquals(todayInIndia(new Date("2026-10-26T18:29:59Z")), "2026-10-26"); // 23:59:59 in India
  assertEquals(todayInIndia(new Date("2026-10-26T18:30:00Z")), "2026-10-27"); // midnight in India
  assertEquals(todayInIndia(new Date("2026-12-31T19:00:00Z")), "2027-01-01");
});
