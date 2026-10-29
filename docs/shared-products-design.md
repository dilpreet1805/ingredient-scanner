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
| `products` | barcode | `gtin13` (primary key), created date. No served version is stored (section 8). Its row is the per-barcode lock (section 5) | via lookup |
| `product_versions` | different ingredient list for one barcode | `gtin13`, ingredients fingerprint, `ingredients_text`, first seen, last confirmed | served version only |
| `product_confirmations` | user + barcode | anonymous `user_id`, `gtin13`, version id, date, that user's other fields (brand, name, category, serving size, nutrition, allergen statements), copied inside the database from that user's reading | **never** |
| `decode_readings` | stored label reading | `id` (= `decodeId`), `user_id`, `gtin13` (set at decode time), `reading` (JSON, never the image), `created_at`, `expires_at` | **never** |
| `user_age_tiers` | user | `user_id`, `tier` (`teen` or `adult`) only, no birth date. **No row = can't contribute** (fail closed) | **never** |
| `sharing_usage_daily` | user + day + kind | `user_id`, `day`, `kind` (`lookup` or `submit`), count. Never which barcodes | **never** |
| `sharing_usage_global` | day + kind | `day`, `kind`, count | **never** |

Never stored: photos, names, phone numbers, emails, location. The anonymous user id is treated as personal
data.

Database constraints (last line of defence; server-side zod checks first): `gtin13` is 13 digits; a
confirmation's version must belong to the same barcode (two-column foreign key); one version per
(barcode, fingerprint); `reading`, `nutrition` and `allergens` are jsonb with a `jsonb_typeof` check and a
byte-size cap; text fields have the length limits in section 11.

**Database tests** run on a **separate Supabase test project** (Free plan, holds no real user data and
none of the production secrets). New migrations are pushed there first and tested before they go to the
real project. Fallback, if the test project can't be used: run the test script inside a transaction that
ends in `rollback`, so test rows never stay. A local database isn't available (no Docker). Tests check
permissions through the catalog (no table or function rights for `anon`/`authenticated`, RLS on, no
policies). Concurrency can't be tested in one session: it needs two real database connections.

The migration is built in three parts: (A) tables, RLS, revokes and permission tests; (B) store reading,
submit, lookup and their helpers; (C) usage counters, delete my sharing data, cleanup.

## 5. Server functions

All use `verify_jwt = true`. Anonymous users are allowed.
**The user id always comes from the verified sign-in token** (`admin.auth.getUser`), never from the request
body. The same applies to the account creation date used for eligibility.

**`decode-label` (existing), changes:**
1. Optional `share: true` and the scanned barcode `{ format, code }` in the request body (`share` must be a
   real boolean, else 400).
2. After `checkReading` passes, store the reading in `decode_readings` with its `gtin13` and return
   `decodeId`, but only if `share` is true AND the barcode is valid and shareable (`toGtin13`,
   `isShareableGtin13`) AND the user's server-side tier is `adult` AND sharing is switched on at the server
   (a secret, proposed name `SHARING_ENABLED`, off by default). Before storing, it normalizes the
   non-ingredient fields and computes the ingredients fingerprint in TypeScript, and stores both in the
   reading (section 9).
3. If storing fails, still return the reading without `decodeId`. A user's own decode never fails because
   of sharing. Log error codes only.
4. Unchanged: quota counting, and the image is never stored or logged.
App: `DecodeResult` gets an optional `decodeId`; older apps ignore it.

**`lookup-product`:** `{ format, code }` -> `SHARING_ENABLED` switch (off: returns `not_found`) ->
`toGtin13` again on the server -> `isShareableGtin13` -> per-user lookup limit -> served version, worked
out at lookup time (section 8).
Responses: `found` (fields that passed agreement, plus "read from the label by N people, last on <date>"),
`not_found`, `invalid_barcode`, `not_shared` (the app says it's a shop's own code and asks for a photo).

**`submit-product`:** `{ format, code, decodeId }` -> `SHARING_ENABLED` switch (off: refuses) -> validate
and check shareable -> per-user submit limit -> ONE atomic database function. From the request it
receives only `decodeId` and `gtin13`; the user id and account creation date come from the verified
token, plus the eligibility numbers. Inside one transaction it:
1. checks the user may contribute (section 7),
2. deletes the reading (one-time use; must belong to this user, not be expired and have the same `gtin13`,
   else "not found" without saying why),
3. copies the ingredients text, the normalized fields and the fingerprint **from the deleted reading row**
   (section 9), never from the request,
4. locks the barcode's `products` row, so submissions for one barcode run one after another,
5. finds or creates the version and saves or replaces this user's confirmation.

Counts are always worked out from the confirmation rows, never kept in a counter column. With the lock, a
second submission waits for the first to commit and then sees it, so two simultaneous confirmations can't
both count as "the second".

**Delete my sharing data:** called with the user's sign-in token. Deletes:
- all their stored readings (`decode_readings`),
- all their confirmations (`product_confirmations`); a version that drops below the rules stops being
  served at the next lookup,
- their `sharing_usage_daily` rows except today's (today's stays so deleting can't reset the daily limits;
  cleanup removes it later).

It does not delete: `product_versions` (no user data), the global counters (no user data),
`user_age_tiers` and `usage_daily` (they belong to the account, not to sharing, and are needed for teen
enforcement and decode limits).

**Logging and counters:** `lookup-product` and `submit-product` never log a barcode together with a user
id. Rate-limit counters store only numbers (a count per user per day), never which barcodes were looked up.

## 6. Readings and consent

- One-time setting in Privacy: "Share label readings", **off by default**. Teens can't turn it on.
  Per product, the user still chooses whether to share after scanning a barcode.
- The consent comes before the photo is sent, because the reading is saved during the decode.
- The barcode is scanned before the photo, so the stored reading is tied to that barcode.
- Stored readings live **24 hours** and are **deleted on use**. An expired reading is refused even if
  cleanup is late. A scheduled job deletes old rows (I believe Supabase supports `pg_cron`; not verified
  for this project).
- Shared contents come **only from our server's reading**. User corrections are never shared.

## 7. Independent confirmations

A confirmation counts when it comes from:
- a different anonymous account,
- whose account is at least **3 days** old and active on at least **2 different days**
  (placeholders; activity comes from `usage_daily`),
- whose tier is adult,
- using its own server-made reading (one reading, one submission).

One vote per user per barcode: a newer vote replaces the older one.

Known limit: anonymous accounts are free, so one person with two phones can still fake two confirmations.
Many accounts could also scrape the table by staying within each account's lookup limit.
**The server cannot verify that the barcode belongs to the photographed pack**: a user could scan one
product's barcode and photograph another's label. The reading is tied to the barcode at decode time, and
a version is only served after two independent readings for that barcode agree.
Accepted for now. Mitigations: server-only readings (each costs a daily decode and needs a real-looking
label), the eligibility rules above, rate limits, and the photo flow always staying available. Device
checks (Play Integrity / App Attest) are not used; the real fix is phone login, later.

## 8. Versions and what is served

- Each different ingredients fingerprint for a barcode is its own version.
- **Serving rule:** serve the version with the most confirmations in the **last 180 days**, minimum **2**.
  **A tie means nothing is served** (the app asks for a photo).
- The served version is **worked out at each lookup, not stored**. A stored copy would go stale on its
  own: confirmations leave the 180-day window with no write that could update it.
- A recipe change resolves by itself: new packs get confirmed while old confirmations leave the window.
- **Other fields, agreement per field:** brand, name, category, serving size, nutrition (as one block) and
  allergen statements (as one block) are shown only when at least 2 confirmations of the served version
  agree on that field exactly (after formatting-only normalization). Otherwise that field is left out and
  the app asks for that photo.
- For brand, name, serving size and category, confirmations keep **both the original and the normalized
  value**. Agreement compares the normalized value; the app is shown the original.
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

**Where it runs:** all normalization is TypeScript in `decode-label`, before the reading is stored. That
covers the ingredients fingerprint and the formatting-only normalization of the non-ingredient fields used
for per-field agreement (section 8). The stored reading holds the fingerprint and the normalized fields.
The database never normalizes: it copies these values from the reading row and compares them exactly.

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
  longer count for serving); sharing usage counters (`sharing_usage_daily`, `sharing_usage_global`)
  deleted after about **35 days**; version rows (no user data) are kept as history. A cleanup function
  does all of this; how it is scheduled is still open (section 14). The age tier is kept while the
  account exists.
- Deletion: see "Delete my sharing data" (section 5). If the user uninstalled first, their anonymous account
  is gone and they can't prove which rows were theirs.
- Teens: tier stored on the server (tier only); lookup-only; can't enable sharing.
- Privacy screen (`src/app/profile/privacy.tsx`) is already out of date ("only on this phone"). Before
  launch it must say:
  - label photos go to our server and an AI provider to be read, and we don't keep them (the provider's
    own retention terms need checking in the legal review)
  - with sharing on, the label text (not the photo) and the barcode you scanned are kept up to 24 hours
    so they can be shared
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

Round 3 (database migration):
| # | Question | Decision | Not picked |
|---|---|---|---|
| 1 | Served version | worked out at lookup time | stored cache (goes stale as the window moves); cache + daily job |
| 2 | Age tier table | `user_age_tiers`; no row = can't contribute | default to adult |
| 3 | Account age | passed in by the edge function from the verified token | read `auth.users` inside the database |
| 4 | Migration size | three parts (section 4) | one migration |
| 5 | Submitted contents | taken from the deleted reading row inside the database; only `decodeId` and `gtin13` come from the request | passing text and fields from the edge function |
| 6 | Reading and barcode | `gtin13` stored with the reading at decode time; submit must match | any barcode at submit time |
| 7 | jsonb fields | `jsonb_typeof` + byte-size check | type check only |
| 8 | Counter retention | sharing usage rows deleted after about 35 days | keep forever |
| 9 | Database tests | separate Supabase test project; fallback: a transaction ending in `rollback` | test rows cleaned up by hand; local database (no Docker) |
| 10 | User id | from the verified token only | from the request body |
| 11 | Concurrency | per-barcode row lock; counts from rows | advisory lock (hash collisions); serializable + retries |
| 12 | Where normalization runs | TypeScript in `decode-label`; fingerprint and normalized fields stored in the reading | normalizing in SQL (two copies of the rules, hard to test) |
| 13 | Delete-my-data and limits | keeps today's usage row, so deleting can't reset the daily limit | delete all usage rows |
| 14 | Eligibility order | runs after the daily submit limit, so an ineligible user uses up one submit | eligibility first (a separate database call) |
| 15 | Original vs normalized fields | brand, name, serving size, category: keep both; compare normalized, show original | keep only normalized (users would see e.g. lowercase brands) |

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
- Exact normalization rules per field: to be written with the TypeScript code and tests.
- Which original value is shown when agreeing confirmations have different originals (e.g. Amul and
  AMUL): proposed rule is the original from the most recent agreeing confirmation; decide in migration
  part B.
- How `supabase/tests/usage_limits.sql` was run: unknown.
