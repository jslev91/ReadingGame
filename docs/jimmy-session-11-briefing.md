# Jimmy — Session 11 Briefing Prompt

Paste this entire prompt at the start of your eleventh Claude Code session.

---

We are continuing work on Jimmy, a two-subject learning PWA. Read CLAUDE.md fully before touching anything. Then run `git status` and `git log --oneline -5` to reorient.

## Pre-session checks

**1. Verify session 10 is complete:**
- `src/core/`, `src/subjects/phonics/`, `src/subjects/maths/`, `src/apps/` folder structure in place
- Phonics app runs correctly end-to-end
- `sounds.js` service exists (`playCorrectSound()`)
- Tricky words section visible in ProgressScreen

**2. Check maths stub:** run `ls src/subjects/maths/` and `ls src/apps/maths/`. Both should exist with placeholder files. If either is missing, create the stubs before proceeding (see session 10 briefing for the stub content).

**3. No background removal needed this session.**

---

## Session 11 goals

Two loose ends first, then the main event: real maths content. By the end of this session the maths app should deliver genuine KS2 times table practice — a child can open it, create a profile, play a session, earn coins, and see their progress.

---

## Loose end A — Profile subject field

This was planned in session 10 but did not make it in. Each profile must belong to one subject so the phonics and maths apps show separate profile lists.

**Update the profile shape in `src/core/hooks/useProfiles.js`:**

```js
{
  id: string,
  name: string,
  colour: string,
  subject: 'phonics' | 'maths',   // which app this profile belongs to
  createdAt: ISO,
}
```

**Changes to `useProfiles`:**
- `createProfile({ name, colour, subject })` — `subject` is now required
- `createGuestProfile({ name, colour })` — sets `subject: 'phonics'`
- Add `getProfilesForSubject(subject)` — returns `profiles.filter(p => p.subject === subject)`
- On load: migrate any profile missing `subject` by defaulting it to `'phonics'`

**Changes to `ProfileSelectScreen`:**
- Receives a `subject` prop from `App.jsx`
- Renders only `getProfilesForSubject(subject)`
- Passes `subject` through to `CreateProfileScreen`

**Changes to `CreateProfileScreen`:**
- Receives `subject` prop; sets it on the new profile silently (no picker shown)

**Changes to `ParentAreaScreen`:**
- Profiles list filtered to current subject only

**Changes to `src/apps/phonics/App.jsx`:**
- Passes `subject='phonics'` to `ProfileSelectScreen` and `CreateProfileScreen`

**Changes to `src/apps/maths/App.jsx`:**
- Passes `subject='maths'` to `ProfileSelectScreen` and `CreateProfileScreen`

Verify: create a phonics profile and a maths profile. Open both apps — each should only show its own profiles.

Commit: `feat: add subject field to profiles, filter by app`.

---

## Loose end B — Maths Vercel deployment

If the maths app is not yet deployed to Vercel, do this now:

1. In Vercel, click **Add New → Project**
2. Import the same GitHub repository
3. Set:
   - **Build command:** `npm run build:maths`
   - **Output directory:** `dist-maths`
   - **Root directory:** `/` (repo root)
4. Deploy and confirm the maths stub renders at the new URL
5. Note the URL in CLAUDE.md

If `npm run build:maths` does not exist in `package.json`, add it (see session 10 briefing for the Vite config).

Commit: `docs: add maths Vercel URL to CLAUDE.md`.

---

## Step 1 — Maths curriculum data

Create (or fully replace the stub) `src/subjects/maths/data/curriculum.js`.

### Design decisions

The unit of progression in the maths app is a **topic** — a specific times table. The child masters one table before moving to the next. Each topic has a set of **facts** (individual multiplication pairs) that are sampled during questions.

Topics are grouped into phases, parallel to Letters and Sounds phases in phonics:
- **Phase 1** — ×2, ×10, ×5, ×3, ×4 (introduced in this order — 2, 10, 5 are the easiest)
- **Phase 2** — ×6, ×8, ×7, ×9, ×11, ×12

Phase 2 unlocks when 3 Phase 1 topics are `practising` or `mastered`.

### Topic data shape

```js
{
  id: 'times-2',
  name: '2 times table',
  shortName: '×2',
  phase: 1,
  order: 1,          // curriculum order within phase
  operand: 2,        // the fixed multiplier for this table
  minFactor: 1,      // facts range: 1×2 through 12×2
  maxFactor: 12,
}
```

### Exports

```js
export const TOPICS = [...]   // all topics in curriculum order

export function getTopic(id) { ... }

export function generateFacts(topic) {
  // Returns array of { a, b, answer } for the topic
  // a ranges from topic.minFactor to topic.maxFactor
  // answer = a × topic.operand
  // Always include both orderings: 3×2 and 2×3 (commutativity)
  // but deduplicate when a === b (e.g. 2×2 appears once)
}
```

`generateFacts` returns all facts for the topic. The question selector samples from these randomly.

Commit: `add maths curriculum data (times tables, phase 1 and 2)`.

---

## Step 2 — `useMathsProgress` hook

Replace the stub at `src/subjects/maths/hooks/useProgress.js` with a full implementation.

Persisted under `jimmy:{userId}:mathsProgress`.

### Per-topic state shape

```js
{
  status: 'unseen' | 'introduced' | 'practising' | 'mastered',
  correctCount: 0,
  lastSeen: null,
}
```

Transitions (same thresholds as phonics):
- `unseen → introduced`: on first presentation
- `introduced → practising`: at 5 correct answers
- `practising → mastered`: at 15 correct answers

(Higher thresholds than phonics — times tables need more repetition to stick.)

Wrong answers don't regress status.

### `selectNextTopic(mathsProgressMap)` — export as standalone function

Returns `{ topic, facts }` where `facts` is the full array from `generateFacts(topic)`:

1. If no topics have been introduced yet, return the first Phase 1 topic (×2) — introduce it
2. Phase gating: Phase 2 topics are only candidates once 3 Phase 1 topics are `practising` or `mastered`
3. A new topic is introduced only when the most recently introduced topic has reached `practising`
4. Priority: topics at `introduced` (70%) over `practising` (30%); `mastered` topics appear ~1 in 10 for maintenance
5. Returns `null` only if no topics are available at all (shouldn't happen)

### Exposed functions

```js
{
  mathsProgressMap,              // full map: topicId → progress object
  getMathsProgress(topicId),     // returns progress for one topic
  recordMathsPresented(topicId), // unseen → introduced
  recordMathsCorrect(topicId),   // increments count, updates status
  recordMathsWrong(topicId),     // updates lastSeen only
  setTopicStatus(topicId, status), // admin override (parent area)
}
```

Commit: `add useMathsProgress hook`.

---

## Step 3 — `TimesTableQuestion` component

Create `src/subjects/maths/components/TimesTableQuestion.jsx`.

**What it tests:** recall of a multiplication fact. The child sees the sum and must tap the correct answer.

**Props:** `topic`, `fact` (`{ a, b, answer }`), `onCorrect`, `onWrong`, `locked`

**Layout:**

Phase 1 (presentation, 1000ms on first introduction only — when `isNew` is true):
- Show the whole table briefly: `2, 4, 6, 8...` scrolling or fading in
- Skip this for review questions

Phase 2 (question):
- Show the sum large and centred: `3 × 4 = ?` (`text-5xl font-bold`)
- TTS reads it on mount: `speak('', 'three times four, equals...')` — construct the spoken string from `fact.a`, the operator, and `fact.b`
- 🔊 replay button
- Answer buttons: 3 options when topic is `introduced`, 4 when `practising` or `mastered`

**Distractor generation:**

Good distractors for times tables stay within the same table or nearby tables — they should feel plausible to a child who half-remembers:
1. Adjacent facts in the same table: `(fact.a - 1) × topic.operand` and `(fact.a + 1) × topic.operand` — skip if out of range or equal to answer
2. If more distractors needed: a random answer from another introduced table

Never include the correct answer as a distractor (obvious but worth stating). Shuffle all options before rendering.

**Tap handling:** same anti-guessing rules as phonics — one attempt, wrong reveals correct (green highlight on correct button, red on tapped button), `onWrong()` fires after 800ms, `onCorrect()` fires immediately.

Commit: `add TimesTableQuestion component`.

---

## Step 4 — Maths `GameScreen`

Replace the stub at `src/subjects/maths/screens/GameScreen.jsx` with a real implementation.

Structure is near-identical to the phonics `GameScreen` — same 10-question session, same `sessionCorrect`/`sessionCoins` refs, same `jimmyRef.current.react()` calls, same `onSessionComplete` callback.

**Question selection:**

For session 11, there is one question type: `TimesTableQuestion`. It is always eligible once `selectNextTopic` returns non-null.

```js
const selection = selectNextTopic(mathsProgressMap)
// selection: { topic, facts } or null

// Pick a random fact from selection.facts
const fact = selection.facts[Math.floor(Math.random() * selection.facts.length)]
```

Pass `isNew` to `TimesTableQuestion` when the topic's current status is `'unseen'` (first introduction).

**Progress recording:**
- Call `recordMathsPresented(topic.id)` on question mount
- Call `recordMathsCorrect(topic.id)` on correct answer
- Call `recordMathsWrong(topic.id)` on wrong answer

**Coin/energy rewards:** same as phonics — `pet.onCorrect()` and `pet.onWrong()`. `playCorrectSound()` on correct.

If `selectNextTopic` returns null (no topics available — shouldn't happen but guard it), show a "Well done, you've completed everything!" screen and skip to summary.

Commit: `add maths GameScreen`.

---

## Step 5 — Maths `ProgressScreen`

Replace the stub at `src/subjects/maths/screens/ProgressScreen.jsx`.

**Layout:**

Header: "Times Tables" with a back button.

Phase 1 and Phase 2 sections, each with a heading and a grid of topic tiles.

Each tile shows the topic's `shortName` (e.g. `×2`) and is colour-coded by status — same scheme as phonics:
- Grey: unseen
- Yellow: introduced
- Orange: practising
- Green: mastered

Summary chips above each phase: counts of Introduced / Practising / Mastered.

In editable mode (`editable` prop, used by `ParentAreaScreen`): tapping a tile cycles `unseen → introduced → practising → mastered`. Calls `setTopicStatus(topicId, newStatus)`.

**`ParentAreaScreen` update:** add "Edit Maths Progress" button alongside "Edit Progress" (phonics) — passes `editable` to the maths `ProgressScreen`. Only show this button when in the maths app.

To know which app is active, pass a `subject` prop down through the navigation to `ParentAreaScreen`, or read it from `activeProfile.subject`.

Commit: `add maths ProgressScreen`.

---

## Step 6 — Wire maths `App.jsx`

Update `src/apps/maths/App.jsx` to use the real components.

**Navigation:** same screen states as phonics App — `"home"`, `"game"`, `"summary"`, `"shop"`, `"progress"`, `"editProgress"`, `"profiles"`, `"createProfile"`.

**Hooks:**
- `useProfiles()` — for profile management; pass `subject='maths'`
- `usePet(activeProfile?.id)` — pet state for the active maths profile
- `useMathsProgress(activeProfile?.id)` — maths progress for the active profile

**Screen routing:**
- `HomeScreen` from core — shared, no changes needed
- `ShopScreen` from core — shared
- `SessionSummaryScreen` from core — shared
- `ProfileSelectScreen` / `CreateProfileScreen` / `ParentAreaScreen` from core — pass `subject='maths'`
- `GameScreen` from `subjects/maths/screens/` — maths game
- `ProgressScreen` from `subjects/maths/screens/` — times table grid

Pass `selectNextTopic`, `mathsProgressMap` and the record functions to the maths `GameScreen`.

Commit: `wire maths App.jsx with real screens and hooks`.

---

## Step 7 — TTS helper for maths

Add a helper to `src/subjects/maths/` (or inline in `TimesTableQuestion`) to convert a fact to a spoken string:

```js
const NUMBER_WORDS = {
  1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
  6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
  11: 'eleven', 12: 'twelve',
  // extend as needed for answers up to 144
  ...
}

export function factToSpeech(fact) {
  return `${NUMBER_WORDS[fact.a]} times ${NUMBER_WORDS[fact.b]}, equals`
}
```

The trailing "equals" gives the child a moment before the answer buttons appear. TTS fires on mount via `speak('', factToSpeech(fact))`.

Extend `NUMBER_WORDS` to cover all possible answers (1–144). Missing entries fall back to the number itself which TTS handles fine, so this is belt-and-braces.

Commit: `add maths TTS helper`.

---

## Step 8 — Update CLAUDE.md

CLAUDE.md must reflect:

- Profile `subject` field added; `getProfilesForSubject(subject)`; migration for legacy profiles
- Maths Vercel URL
- `src/subjects/maths/data/curriculum.js`: topic shape, `TOPICS` array, `generateFacts(topic)`, phase ordering
- `src/subjects/maths/hooks/useProgress.js` (now `useMathsProgress`): per-topic state shape, thresholds (5 correct → practising, 15 → mastered), `selectNextTopic`, all exposed functions
- `TimesTableQuestion`: layout, distractor generation, TTS via `factToSpeech`, `isNew` flag
- Maths `GameScreen`: 10 questions, single question type for now, same pet/coin mechanics as phonics
- Maths `ProgressScreen`: times table grid by phase, colour-coded, editable mode
- `ParentAreaScreen`: now receives `subject` prop; shows "Edit Maths Progress" in maths app
- `factToSpeech` helper
- Session 11 in build history
- Notes for session 12: division facts as a second maths question type (`a × ? = answer` / `answer ÷ b = ?`); addition and subtraction question type; difficulty calibration (rolling performance window)

Commit and push.

---

## Definition of done

- [ ] Profile `subject` field in place; phonics and maths apps show separate profile lists
- [ ] Creating a profile in the maths app sets `subject: 'maths'`; existing profiles default to `'phonics'`
- [ ] Maths app deployed to Vercel (URL noted in CLAUDE.md)
- [ ] `curriculum.js` exports `TOPICS` (Phase 1 + 2 tables) and `generateFacts(topic)`
- [ ] `useMathsProgress` persists under `jimmy:{userId}:mathsProgress`
- [ ] `selectNextTopic` gates Phase 2 behind 3 practising Phase 1 topics
- [ ] `TimesTableQuestion` shows sum, speaks it, offers 3–4 answer options
- [ ] Correct distractor is always a plausible answer (adjacent multiple or same table)
- [ ] Anti-guessing: one attempt, wrong reveals correct
- [ ] Maths GameScreen delivers 10-question sessions, calls pet.onCorrect/onWrong
- [ ] Coins and energy rewards work in maths app (same Jimmy mechanics)
- [ ] Maths ProgressScreen shows all tables colour-coded by status
- [ ] Editable mode in maths ProgressScreen (tap to cycle status)
- [ ] ParentAreaScreen "Edit Maths Progress" works from maths app
- [ ] CLAUDE.md updated and accurate
- [ ] All committed and pushed

---

## What we are NOT building this session
- Division as a question type — session 12
- Addition and subtraction — session 12
- Word problems
- Phase 3 phonics audio recordings
- Animated reward sequences

---

## Notes for session 12

**Division facts** are the natural second maths question type — they use the same times table data. Two formats: `answer ÷ b = ?` (find the missing factor) and `a × ? = answer` (missing multiplier). Both test the inverse of multiplication and reinforce times table mastery. Reuse `curriculum.js` facts; no new data needed.

**Addition and subtraction** would be a third question type. Data can be generated programmatically (no static list needed): for a given difficulty level, generate `a + b = ?` or `a - b = ?` where a and b are drawn from an appropriate range. Progress would be tracked by difficulty band rather than individual fact.

**Difficulty calibration:** once real children are using the app, a rolling 20-question window tracking correct rate can gate the introduction pace — faster introduction when the child is at 90%+, slower review when below 60%.
