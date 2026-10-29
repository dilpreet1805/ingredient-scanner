# Shared products database: design (step 6.8)

Status: **design agreed, not built.** Only the barcode helpers exist so far (see "Already built").
Last updated: 2026-10-29.

> **BLOCKER: sharing stays OFF** until (1) a legal review is done, and (2) the golden set exists,
> label-reading agreement has been measured, and a target agreement rate has been chosen together.

## 1. Goal and principles

A user scans a product barcode. If other users have already confirmed that product's label, we show its
details without needing a photo. Otherwise the normal photo flow runs.

- Awareness only: the shared table holds label text. Additive explanations still come only from our own
  additive table, looked up at display time.
- No brand targeting: brand is stored only so people can recognise their pack. Products are looked up by
  barcode only; there are no lists by brand.
- No photos and no identities are shared. All reads and writes go through server functions.
- "No confirmation, no sharing": nothing one person submitted is shown to others until a second,
  independent reading agrees.

## 2. Already built (`src/features/barcode/`)

| File | What |
|---|---|
| `ean13.ts` | `ean13CheckDigit`, `isValidEan13`: weights 1,3,1,3... from the left, `(10 - sum mod 10) mod 10` |
| `gtin.ts` | `toGtin13(format, code)`: one 13-digit key per product. EAN-13 as is, UPC-A + one leading 0, EAN-8 + five leading 0s. UPC-E and other formats return null |
| `shareable.ts` | `isShareableGtin13(key)`: blocks store-internal, coupon and refund prefixes (section 3) |

These files have no app or screen dependencies, so they can move to the server. Deno needs import paths
ending in `.ts`, so the imports will need adjusting when they do.

Not verified yet: the scanner format names (`ean13`, `upc_a`, `ean8`). No camera library is installed;
confirm them in the camera step. Expected platform difference: iPhone reports a UPC-A as EAN-13 with a
leading 0, Android as 12 digits. `toGtin13` gives both the same key.

## 3. Which barcodes may be shared

Not shareable if the 13-digit key:
- starts with `2` (200-299), `02`, `04` (040-049), `05` (050-059), `98` or `99`
  (coupons and refund receipts: the whole 98/99 range is blocked to be safe)
- starts with `000000` (internal numbers; 0000001-0000099 are unused)
- is a padded EAN-8 (`00000` + 8 digits) whose 8-digit code starts with `0` or `2`
- is not a valid GTIN-13 (fail closed)

Source: checked on 2026-10-29 against the GS1 prefix page and the GSCN 23-006 extract
(sections 2.1.11 and 2.1.11.1), **not the full GS1 General Specifications**. Re-check against the full
General Specifications before sharing is switched on.

## 4. Tables

All tables: RLS on, **no policies**, `revoke all ... from anon, authenticated`. Only server functions using
the service key can reach them. Database functions are `security definer` with `set search_path = ''`, and
only `service_role` may execute them. This is the same pattern as `supabase/migrations/*_usage_limits.sql`.

| Table | One row per | Columns (main) | Shown to others? |
|---|---|---|---|
| `products` | barcode | `gtin13` (primary key), id of the served version (a cache, recalculated on every change) | via lookup |
| `product_versions` | different ingredient list for one barcode | `gtin13`, ingredients fingerprint, `ingredients_text`, first seen, last confirmed | served version only |
| `product_confirmations` | user + barcode | anonymous `user_id`, `gtin13`, version id, date, that user's other fields (brand, name, category, serving size, nutrition, allergen statements) | **never** |
| `decode_readings` | stored label reading | `id` (= `decodeId`), `user_id`, `reading` (JSON text, never the image), `created_at`, `expires_at` | **never** |
| (age tier) | user | `user_id`, tier only (no birth date). Table name to be decided | **never** |

Never stored: photos, names, phone numbers, emails, location. The anonymous user id is treated as personal
data.

## 5. Server functions

All use `verify_jwt = true`. Anonymous users are allowed.

**`decode-label` (existing), changes:**
1. Optional `share: true` in the request body (must be a real boolean, else 400).
2. After `checkReading` passes, store the reading in `decode_readings` and return `decodeId`, but only if
   `share` is true AND the user's server-side tier is not teen AND sharing is switched on at the server
   (a secret, proposed name `SHARING_ENABLED`, off by default).
3. If storing fails, still return the reading without `decodeId`. A user's own decode never fails because
   of sharing. Log error codes only.
4. Unchanged: quota counting, and the image is never stored or logged.
App: `DecodeResult` gets an optional `decodeId`; older apps ignore it.

**`lookup-product`:** `{ format, code }` -> `toGtin13` again on the server -> `isShareableGtin13` ->
per-user lookup limit -> served version.
Responses: `found` (fields that passed agreement, plus "read from the label by N people, last on <date>"),
`not_found`, `invalid_barcode`, `not_shared` (the app says it's a shop's own code and asks for a photo).

**`submit-product`:** `{ format, code, decodeId }` -> validate and check shareable -> check the user may
contribute (section 7) -> per-user submit limit -> load the reading (must belong to this user, not
expired) -> fingerprint -> ONE atomic database function that deletes the reading (one-time use), saves or
replaces this user's confirmation for this barcode, recounts, and updates the served version. It's atomic
so that two simultaneous confirmations can't both count as "the second".

**Delete my sharing data:** called with the user's sign-in token. Deletes their confirmations and stored
readings, then recounts. A version that drops below the rules stops being served.

**Logging and counters:** `lookup-product` and `submit-product` never log a barcode together with a user
id. Rate-limit counters store only numbers (a count per user per day), never which barcodes were looked up.

## 6. Readings and consent

- One-time setting in Privacy: "Share label readings", **off by default**. Teens can't turn it on.
  Per product, the user still chooses whether to share after scanning a barcode.
- The consent comes before the photo is sent, because the reading is saved during the decode.
- Stored readings live **24 hours** and are **deleted on use**. An expired reading is refused even if
  cleanup is late. A scheduled job deletes old rows (I believe Supabase supports `pg_cron`; not verified
  for this project).
- Shared contents come **only from our server's reading**. User corrections are never shared.

## 7. Independent confirmations

A confirmation counts when it comes from:
- a different anonymous account,
- whose account is at least **3 days** old and active on at least **2 different days**
  (placeholders; activity comes from `usage_daily`),
- whose tier is not teen,
- using its own server-made reading (one reading, one submission).

One vote per user per barcode: a newer vote replaces the older one.

Known limit: anonymous accounts are free, so one person with two phones can still fake two confirmations.
Many accounts could also scrape the table by staying within each account's lookup limit.
Accepted for now. Mitigations: server-only readings (each costs a daily decode and needs a real-looking
label), the eligibility rules above, rate limits, and the photo flow always staying available. Device
checks (Play Integrity / App Attest) are not used; the real fix is phone login, later.

## 8. Versions and what is served

- Each different ingredients fingerprint for a barcode is its own version.
- **Serving rule:** serve the version with the most confirmations in the **last 180 days**, minimum **2**.
  **A tie means nothing is served** (the app asks for a photo).
- A recipe change resolves by itself: new packs get confirmed while old confirmations leave the window.
- **Other fields, agreement per field:** brand, name, category, serving size, nutrition (as one block) and
  allergen statements (as one block) are shown only when at least 2 confirmations of the served version
  agree on that field exactly (after formatting-only normalization). Otherwise that field is left out and
  the app asks for that photo.
- Category uses the existing list. It lives in two places today (app `ProductCategory` in
  `src/types/index.ts`, server `schema.ts`). The server's list should become the single source of truth.

## 9. Fingerprint and normalization

Fingerprint = hash of the normalized `ingredients_text` only. Two readings agree when fingerprints are
exactly equal.

| Normalize (formatting only) | Never (could merge different recipes) |
|---|---|
| Unicode NFKC | reorder anything (order is by weight) |
| lowercase | change, round or drop any number |
| all whitespace including line breaks -> one space | change additive codes (471 is not 472e) |
| dash and quote variants -> one each | spell-check or "fix" words |
| `[ ]` `{ }` -> `( )`, `;` -> `,` | remove words |
| no spaces next to punctuation (`2.5 %` -> `2.5%`) | fuzzy matching |
| `ins 471` / `ins-471` -> `ins471` | |
| drop a leading "ingredients:" and a trailing `.` | |

Fuzzy matching was rejected: a one-character change can be a real recipe change, and fuzzy matching isn't
transitive (A~B and B~C don't mean A~C), so a reading's version becomes unclear.

## 10. Measuring agreement (golden set)

The agreement rate is unknown until measured. Using the golden set:
1. same photo decoded twice (the AI's own randomness)
2. two photos of the same pack (realistic case)
3. similar but different recipes must NOT match

Choose the target agreement rate together after the first numbers. If agreement is low, improve the
normalization or the prompt; never loosen to fuzzy matching.

Planned prompt change: on bilingual labels, copy the English ingredient list. It must be measured on the
golden set before and after, and must pass the existing Deno tests.

## 11. Limits and safe text

- Field sizes (server-side zod): name <= 120 characters, brand <= 80, serving size <= 40,
  `ingredients_text` <= 4,000, nutrition: the 12 keys each a number in a sensible range or null,
  category from the fixed list.
- Per user per day: 10 submissions, 200 lookups (atomic counters like `usage_daily`), plus a global cap
  (number to be decided).
- Text: plain text only, never HTML. Normalize Unicode; remove control characters and invisible characters
  (zero-width, text-direction overrides). React Native `<Text>` doesn't run HTML; the future paid API's
  documentation must tell customers to escape our text when showing it on web pages.

## 12. Privacy, retention, deletion (DPDP)

- Retention: stored readings 24 hours (deleted on use); confirmations deleted after **180 days** (they no
  longer count for serving); version rows (no user data) are kept as history.
- Deletion: see "Delete my sharing data" (section 5). If the user uninstalled first, their anonymous account
  is gone and they can't prove which rows were theirs.
- Teens: tier stored on the server (tier only); lookup-only; can't enable sharing.
- Privacy screen (`src/app/profile/privacy.tsx`) is already out of date ("only on this phone"). Before
  launch it must say:
  - label photos go to our server and an AI provider to be read, and we don't keep them (the provider's
    own retention terms need checking in the legal review)
  - with sharing on, the label text (not the photo) is kept up to 24 hours so it can be shared
  - shared product details are visible to other users, without your identity
  - we keep a link between your anonymous account and the products you confirmed for 180 days,
    to count independent confirmations and stop abuse
  - how to delete it, and that deleting can take a product out of sharing
  - under-18s can't share
- Legal review before launch covers DPDP (consent, erasure, children's data) and this text.

## 13. Decision log

Round 1:
| # | Question | Decision | Not picked |
|---|---|---|---|
| 1 | Shared contents | server reading only | allowing user corrections (easier to abuse) |
| 2 | What must match | ingredients only, exact after normalization | including nutrition; fuzzy matching |
| 3 | Serving rule | most confirmations in 180 days, min 2, ties hidden | latest wins (easy to override); most ever (stuck on old recipes) |
| 4 | Who contributes | account >= 3 days, active >= 2 days (placeholders); teens lookup-only | no minimum |
| 5 | Device checks | wait for phone login | Play Integrity / App Attest now |
| 6 | User ids | keep, with clear retention text | anonymize after N days |
| 7 | Category | existing ProductCategory list | free text |
| 8 | Limits | as in section 11 | |
| 9 | GS1 prefixes | rules in section 3, checked on 2026-10-29 against the GS1 prefix page and the GSCN 23-006 extract | |
| 10 | Legal | review before launch; sharing off until then | |

Round 2:
| # | Question | Decision | Not picked |
|---|---|---|---|
| 1 | Consent | one-time setting, off by default; teens can't enable | asking on each review screen (would need storage before consent) |
| 2 | Reading lifetime | 24 hours, deleted on use | 7 days; forever |
| 3 | Other fields | per-field "two must agree" | latest reading's values; ingredients only |
| 4 | Teen enforcement | age tier stored on the server (tier only) | trusting the app; waiting for phone login |
| 5 | Retention | delete confirmations after 180 days | keep indefinitely |
| 6 | Bilingual labels | prompt: copy the English list, measured before/after, Deno tests must pass | no prompt change |
| 7 | Agreement target | measure first, choose together | fixed target now |

Plus: the golden set is a prerequisite for turning sharing on (see blocker).

## 14. Still open

- Report button: proposed (hide a version after X reports, with limits on reporting); not yet decided.
- Rejecting links and phone numbers in text fields: proposed, not decided.
- Global daily caps for lookups and submissions: numbers not chosen.
- Eligibility numbers (3 days / 2 days) are placeholders.
- Agreement target rate: after measurement.
- UPC-E support.
- Re-check prefix rules against the full GS1 General Specifications.
- Confirm scanner format names in the camera step.
- Scheduled cleanup mechanism (`pg_cron` or similar): verify.
- Products with no new confirmation for 180 days stop being served (their confirmations leave the window
  and are deleted). Option: keep anonymous per-version counts after deleting user ids. Not decided.
- Define the normalization for each non-ingredient field (brand, name, category, serving size, nutrition,
  allergen statements) used by the per-field agreement in section 8.
