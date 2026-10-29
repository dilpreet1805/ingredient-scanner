# Interview notes

## Terms so far

### Paid API (future)
- **API key vs user token:** an API key identifies the customer's app; a user token identifies one person signed in to it.
- **Quota vs rate limit:** a quota is how much a customer may use per period (set by their plan); a rate limit is how fast they may call.
- **Usage metering:** counting every call per customer so we can bill them and enforce their quota.
- **API versioning:** keeping a fixed response shape under a version (like `/v1/`) so our changes don't break customers' apps.
- **Single source of truth:** one additive table on the server, so the app and the API can never give different answers.

### Additive accordion scroll (commit 3d0e228)
- **React Context vs prop drilling:** Context lets any child read a shared value (here `Screen`'s ScrollView ref via `useScreenScroll()`) without passing it down through every component's props.
- **`useRef` vs `useState`:** changing a ref does not re-render the component; changing state does.
- **Ref callback with cleanup (React 19):** a ref callback can return a cleanup function that React runs when the element goes away.
- **`useLayoutEffect` vs `useEffect`:** `useLayoutEffect` runs after layout but before the screen is painted, so we can measure and scroll without a visible jump; `useEffect` runs after paint.
- **`measureLayout`:** gives a view's position relative to another view (the scroll content), not relative to the phone screen.
- **Component type vs instance type:** `ScrollView` is the component; a ref holds an instance, typed `ScrollViewInstance` / `HostInstance` in RN 0.88.
- **Keep CLAUDE.md current:** a stale note misleads the next session, so update it in the same step as the code.
- **Stage files by name; `git commit -F`:** `git add <file>` avoids committing things by accident; `-F` reads the commit message from a file, which avoids PowerShell quoting problems with multi-line messages.
- **`git status -sb`:** short status plus a branch line showing how many commits you are ahead of or behind the remote.

### Git on Windows
- **Line endings (LF vs CRLF, `core.autocrlf`):** Unix ends lines with LF, Windows with CRLF; with `core.autocrlf=true` Git stores LF in the repo and gives you CRLF in your working folder (a `.gitattributes` file can fix this per repo for everyone).

### Barcode (6.8 step 1)
- **EAN-13 / GTIN-13 / GS1:** the 13-digit number under most retail barcodes; GS1 hands the numbers out, and the first 3 digits (GS1 prefix, e.g. 890 for India) show which GS1 office registered it, not where the product was made.
- **Check digit:** the last digit, calculated from the first 12: multiply by 1, 3, 1, 3… from the left, add up, then `(10 − sum mod 10) mod 10`. The outer `mod 10` turns 10 into 0.
- **What it catches vs misses:** catches every single wrong digit; misses swapping neighbouring digits that differ by 5 (the sum changes by exactly 10). A test documents this limit.
- **ID as string, not number:** a barcode is an identifier, not an amount; a `number` would drop leading zeros, and you never do maths on the whole thing.
- **Strict pure function:** exactly 13 digits, no trimming; cleaning up input is the caller's job. No imports, so the same code can run in the Deno server later.
- **Validate on the server too:** never trust the client; the server checks the barcode again before any shared-database write.

### Barcode formats (6.8 step 2)
- **GTIN family:** EAN-13, UPC-A (12), EAN-8 are all GTINs; adding zeros on the left keeps the same product and a valid check digit.
- **Normalization:** turning different forms of the same thing into one standard form before storing it, so one product = one key (here: GTIN-13).
- **Platform differences:** iPhone reports a UPC-A as EAN-13 with a leading 0, Android as 12 digits; without normalization the same product would get two database entries.
- **Don't infer type from length:** UPC-E and EAN-8 both have 8 digits but mean different things, so we use the scanner's format name.
- **`switch` vs lookup object:** a plain object lookup can find built-in keys like `toString`; a `switch` has no hidden keys.

### Shareable barcodes (6.8 step 3)
- **Restricted circulation numbers:** barcodes shops or companies use internally (weighed deli items, coupons, refund receipts); not unique worldwide, so never shared.
- **Blocklist vs allowlist:** a blocklist names what is forbidden (small, matches the GS1 rules); an allowlist names what is allowed (safer against new special ranges, but must track every country prefix).
- **Fail closed:** when input is invalid or unclear, answer "not allowed"; the safe default for anything shared.
- **Test helper for valid data:** `key()` adds the check digit, so each test fails only for the rule it tests.
- **Source caveat:** the prefix rules were checked against the GS1 prefix page and the GSCN 23-006 extract (sections 2.1.11 and 2.1.11.1), not the full General Specifications; re-check before sharing goes live. A secondary source said "40-49 is internal", which is wrong (400-440 is GS1 Germany), so primary sources matter.
