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

### Shared products design (6.8 discussion)
- **Fingerprint:** a hash of the normalized ingredient text; two readings "agree" when their fingerprints are exactly equal.
- **Formatting-only normalization:** change only how text looks (case, spaces, dash/quote/bracket shapes), never what it says (words, order, numbers, additive codes), so honest readings match but different recipes stay different.
- **Fuzzy matching isn't transitive:** A can be close to B and B close to C while A is not close to C, so it becomes unclear which version a reading belongs to; and one changed character (471 vs 472) can be a real recipe change.
- **Sybil attack:** one person creating many fake accounts to look like many independent people; anonymous sign-in can't stop it, phone login makes it expensive.
- **One-time-use readings:** a stored label reading is deleted when it's submitted, so one photo can't confirm several barcodes or count twice.
- **Consent before collection:** the user turns on "Share label readings" before the photo is sent, because the reading is saved during the decode; we never store data first and ask later.
- **Retention matched to purpose:** keep data only as long as it's needed; confirmations are deleted after 180 days because the serving rule only counts the last 180 days.
- **Partial staging (`git apply --cached`):** stages only part of a file's changes by applying a patch to the index without touching the working file; useful when one file's edits belong in two commits and `git add -p` isn't available.

### Shared products migration (6.8 design, round 3)
- **Lost update:** two transactions both read a count of 1 and both write 2, so one update disappears; we avoid it by never storing counts and always counting rows.
- **Read committed (Postgres default):** each statement sees only data committed before it started; a later statement in the same function can see commits that happened in between.
- **Row lock (`select ... for update`):** locks one row until the transaction ends; locking the barcode's `products` row makes a second submission for that barcode wait, then see the first one.
- **`security definer` and `set search_path = ''`:** the function runs with its owner's rights, not the caller's; an empty search path forces full names (`public.x`), so nobody can slip in a look-alike table or function.
- **Two layers of protection:** revoked table rights decide whether a role can touch a table at all; RLS with no policies decides which rows it sees (none). If one layer is undone by mistake, the other still blocks.
- **Fail closed (here):** no `user_age_tiers` row means the user can't contribute; unknown is treated as "no".
- **Single source of truth:** one place holds each fact and everything else points to it (here: the served version is worked out from the confirmation rows, not copied into a column that can go stale).
- **Binding a reading to its barcode:** tie a stored reading to the barcode when it is created, so it can't be reused for another product.
