// Reads additive codes (INS / E numbers) out of ingredient text, and writes them in one form.
//
// One written form: lower-case, no prefix, no spaces. "INS 160c (i)" and "E160c(i)" both become "160c(i)".

const ROMAN = "(?:iii|ii|iv|vi|vii|viii|ix|i|v|x)";
const CODE_BODY = `\\d{3,4}[a-z]?(?:\\s*\\(${ROMAN}\\))?`;

const SINGLE_CODE = new RegExp(`^(?:ins|e)?[\\s.-]*(\\d{3,4}[a-z]?)\\s*(\\(${ROMAN}\\))?$`, "i");

/** "INS 160c (i)" -> "160c(i)". Returns null when the text is not a code. */
export function normalizeCode(raw: string): string | null {
  const match = SINGLE_CODE.exec(raw.trim());
  if (!match) return null;
  const number = match[1].toLowerCase();
  const part = match[2] ? match[2].toLowerCase() : "";
  return `${number}${part}`;
}

// A code after "INS" or "E", and the bare numbers that follow it in the same list:
// "INS 104, INS 133 & 172 (i)" has a third code with no prefix.
const CODE_LIST = new RegExp(
  `\\b(?:INS|E)\\s*[-.]?\\s*(${CODE_BODY}(?:\\s*(?:,|&|and)\\s*${CODE_BODY})*)`,
  "gi",
);
const BARE_CODE = new RegExp(CODE_BODY, "gi");

/** Every different code in the text, in the order it first appears. */
export function findAdditiveCodes(text: string): string[] {
  const found: string[] = [];
  for (const list of text.matchAll(CODE_LIST)) {
    for (const piece of list[1].matchAll(BARE_CODE)) {
      const code = normalizeCode(piece[0]);
      if (code && !found.includes(code)) found.push(code);
    }
  }
  return found;
}
