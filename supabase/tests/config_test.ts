import { assert, assertEquals } from "jsr:@std/assert@1";

const configPath = new URL("../config.toml", import.meta.url);
const functionsDir = new URL("../functions/", import.meta.url);

/** Reads each [functions.NAME] block and returns its verify_jwt setting. */
export function readVerifyJwt(toml: string): Map<string, string | undefined> {
  const result = new Map<string, string | undefined>();
  let current: string | null = null;
  for (const raw of toml.split(/\r?\n/)) {
    const line = raw.trim();
    const section = line.match(/^\[functions\.([A-Za-z0-9_-]+)\]$/);
    if (section) {
      current = section[1];
      result.set(current, undefined);
      continue;
    }
    if (line.startsWith("[")) {
      current = null;
      continue;
    }
    if (current) {
      const setting = line.match(/^verify_jwt\s*=\s*(true|false)\b/);
      if (setting) result.set(current, setting[1]);
    }
  }
  return result;
}

Deno.test("the checker can see an open door", () => {
  const sample = "[functions.leaky]\nenabled = true\nverify_jwt = false\n";
  assertEquals(readVerifyJwt(sample).get("leaky"), "false");
});

Deno.test("every Edge Function explicitly requires a valid JWT", async () => {
  const settings = readVerifyJwt(await Deno.readTextFile(configPath));
  const problems: string[] = [];
  for await (const entry of Deno.readDir(functionsDir)) {
    if (!entry.isDirectory || entry.name.startsWith("_")) continue;
    const setting = settings.get(entry.name);
    if (setting !== "true") {
      problems.push(`${entry.name}: verify_jwt is ${setting ?? "not set"}`);
    }
  }
  assert(problems.length === 0, problems.join("; "));
});

Deno.test("no function block turns JWT checks off", async () => {
  const settings = readVerifyJwt(await Deno.readTextFile(configPath));
  const off = [...settings]
    .filter(([, value]) => value === "false")
    .map(([name]) => name);
  assert(off.length === 0, `verify_jwt = false for: ${off.join(", ")}`);
});
