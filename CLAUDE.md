# Ingredient Scanner ("Decode")

React Native app (Expo SDK 58, TypeScript, NativeWind, Expo Router). Windows + PowerShell. The owner is learning
Claude and preparing for interviews, so TEACHING MATTERS AS MUCH AS THE CODE.

## How to work with me (most important)
- One small step at a time. Never bundle several steps or touch more files than the step needs.
- Before changing code: say what we are building, why this design, and one alternative we did not pick.
- After changing code: walk through the parts that matter, like a code review, so I could explain it in an interview.
- Ask before edits and commands (do not auto-approve). Show each change.
- After a step, give me ONE check to run (`npx tsc --noEmit`, `npm test`, or a phone test). Do not start the next step
  until I say the check passed and I understood.
- Keep a short running list of terms and design decisions worth remembering in `docs/interview-notes.md`.
  I will ask for interview questions at the end.
- Say plainly when you are unsure or could not verify something. Never invent file names, APIs or facts.

## What the app does
Photograph a product label -> read ingredients, additive/food codes and nutrition. The USP is "Decode":
explain additives as AWARENESS ONLY.
- No health claims, no verdicts, no brand targeting. The user decides.
- Explanations come only from our own sourced additive table. The AI only READS the label; it never writes explanations.
- "No source, no statement": every statement in the table has at least one source with a checkedOn date.
- A test blocks verdict words (safe, unsafe, harmful, toxic, healthy, good, bad, avoid...). Keep it passing.
- Unknown code -> "We don't have information on this additive yet".
- Never compute personal doses. Labels do not give additive amounts.
- Without an ingredient list there is no result (ask for that photo). Nutrition is optional.
Also: Planner (meals), profile, BMI. Later: barcode scan with a shared product database, chatbot, phone login, subscription.

## Layout and key ideas
- `src/app/` Expo Router screens. `src/features/` decode, additives, planner, home, age. `src/lib/` db, dates, image store.
- Scan flow: photo -> `runDecode` -> `Draft` -> `draftToNewScan` (returns null without ingredients) -> `NewScan` ->
  SQLite row -> `ScanResult`. Row <-> ScanResult mapping is in `scan-row.ts` and reads stored JSON safely.
- We store the label text (`ingredients_text`). Additive codes are found at display time, so table updates reach old scans.
- State: Zustand (`useCaptureDraft`, field `ingredientsUri` holds the first photo), TanStack Query, zod, expo-sqlite.
- Database changes: append a NEW entry to `migrations` in `src/lib/db.ts` (uses `PRAGMA user_version`). Never edit old entries.
- Label reading schema (`label-reading.ts`): the nutrition panel needs all 12 nutrient keys (null when absent).
- Additive accordion (`additive-list.tsx`): one row open at a time (`openCode`). Opening a row scrolls it to the top
  through `useScreenScroll()`, the ScrollView ref that `Screen` shares by context (null outside a `Screen`).
  Ref types in RN 0.88: `ScrollViewInstance` and `HostInstance`, not `ScrollView` or `View`.
- Codes with entries: see `ADDITIVES` in `additive-table.ts` (one source of truth).

## Backend (Supabase Edge Function `decode-label`, Deno)
- Uses Claude Haiku 5.5. Anonymous sign-in, daily decode limit.
- `verify_jwt` must stay `true` in `supabase/config.toml`.
- Deploy: `npx supabase functions deploy decode-label --use-api`
- Tests: `deno test --allow-all --config supabase/functions/decode-label/deno.json supabase/functions/decode-label`
- Type check: `deno check --config supabase/functions/decode-label/deno.json supabase/functions/decode-label/index.ts`
- Do NOT use backticks inside the SYSTEM_PROMPT template literal.
- Prompt rules that matter: copy the ingredient list word for word in printed order; a bracketed code belongs to the group
  name directly before it, even across line breaks; never move codes or reorder; copy every number exactly.

## Checks (run after every change)
- `npx tsc --noEmit` must be clean.
- `npm test` (vitest) must pass. Currently about 139 tests.

## Security
- Never paste or print API keys. A key was leaked once and had to be revoked. Rotate the Anthropic key before Nov 25.
- All writes to any shared database go through server functions; no direct client writes.

## Known open items
- Additive table: verify India (FSSAI) lines against current rules (uses the 2011 Appendix A); add more codes
  (e.g. 172(i), 132, 127, 104, 133, 171, 1202, 1518, 1521, 468, 462, 464, 470(ii), 470(iii));
  add a glossary for "not specified" / ADI from a WHO source.
- Next big step 6.8: barcode scan (EAN-13 check digit) + shared products table (a product is served to others only after
  2 independent user confirmations; barcode is the key; no photos or identities shared; RLS with no policies).
- Golden set: build a set of 25 to 30 label photos with hand-written correct answers (target 100 over time), keep about
  20% as a hidden test set, and use it to measure label-reading accuracy. Photos stay out of git.
- Future: decode as a paid API for other apps (customer API keys, per-plan quotas, usage metering,
  versioned JSON responses, additive table on the server). Design rule from now on: keep label reading
  and additive lookup in server code that does not depend on any app screen; the app is just one client.
  The phone-side lookup at display time (so table updates reach old scans) must still work: the app
  will use a copy of the server table, or ask the server again.
- Later: vitamins/minerals for supplements, privacy text update (photos go to the AI provider), legal review (DPDP,
  teen mode).
