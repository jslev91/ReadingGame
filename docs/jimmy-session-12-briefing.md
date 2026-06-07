# Jimmy — Session 12 Briefing Prompt

Paste this entire prompt at the start of your twelfth Claude Code session.

---

We are continuing work on Jimmy, a two-subject learning PWA. Read CLAUDE.md fully before touching anything. Then run `git status` and `git log --oneline -5` to reorient.

## Pre-session checks

**1. Verify session 11 is complete:**
- Maths app deployed to Vercel (URL in CLAUDE.md)
- Profile `subject` field in place; phonics and maths apps show separate profile lists
- `TimesTableQuestion` component exists and works
- Maths `GameScreen` delivers 10-question sessions
- Maths `ProgressScreen` shows times table grid colour-coded by status
- `useMathsProgress` persisted under `jimmy:{userId}:mathsProgress`

**2. No background removal needed this session.**

---

## Session 12 goals

Two new question types: one for maths (division), one for phonics (reading a written word and matching it to audio). Both are self-contained additions that extend their respective apps without touching existing question logic.

**Expected experience after this session:**

*Maths:* Once a times table is `practising` or `mastered`, the maths app will also ask the inverse: `12 ÷ 3 = ?` and `3 × ? = 12`. No new curriculum data needed — division reuses the existing times table facts.

*Phonics:* A written word appears on screen with no audio. Three numbered speaker buttons auto-play in sequence. The child listens to all three, then taps the button that spoke the word they can see. This is the only question type where reading — not listening — is the primary skill being tested.

---

## Part 1 — Maths: `DivisionQuestion` component

### What it tests

The inverse of multiplication. Given a times table fact `{ a, b, answer }` (e.g. `3 × 4 = 12`), present it in one of two formats chosen randomly:

- **Format A — standard division:** `12 ÷ 3 = ?` (find the quotient)
- **Format B — missing factor:** `3 × ? = 12` (find the missing multiplier)

Both formats test the same underlying knowledge from a different angle. Alternate formats keep practice varied without adding new data.

### Step 1 — `DivisionQuestion` component

Create `src/subjects/maths/components/DivisionQuestion.jsx`.

**Props:** `topic`, `fact` (`{ a, b, answer }`), `format` (`'division' | 'missing-factor'`), `onCorrect`, `onWrong`, `locked`

**Correct answer:**
- Format A (`12 ÷ 3 = ?`): answer is `fact.a` (the factor, not the product)
- Format B (`3 × ? = 12`): answer is `fact.a` (same)

Both formats ask for the same value — the unknown factor. The display string differs, nothing else.

**Display:**
- Format A: `{answer} ÷ {b} = ?` — `text-5xl font-bold`, centred
- Format B: `{b} × ? = {answer}` — same styling; show `?` in a clearly distinct colour (amber)

**TTS on mount:**

Use `factToSpeech` as a basis. Add a `divisionToSpeech(fact, format)` helper:
- Format A: `"${answer} divided by ${b}, equals"`
- Format B: `"${b} times what, equals ${answer}"`

**Answer options:** 3 options when topic is `introduced`, 4 when `practising` or `mastered`.

**Distractor generation:**

Adjacent factors of the same table work well here too:
- `fact.a - 1` and `fact.a + 1` (clamped to `topic.minFactor`–`topic.maxFactor`)
- Fill remaining slots with random factors from introduced tables

Never include the correct answer as a distractor. Shuffle all options.

**Tap handling:** same anti-guessing rules as all other question types.

Commit: `add DivisionQuestion component`.

---

### Step 2 — Eligibility and weighting in maths `GameScreen`

Update `src/subjects/maths/screens/GameScreen.jsx`.

`DivisionQuestion` is eligible for a given topic when `getMathsProgress(topic.id).status` is `'practising'` or `'mastered'`. It is never shown for topics that are only `introduced` — the child needs to know the multiplication direction first.

**Updated question selection:**

```js
const selection = selectNextTopic(mathsProgressMap)
const topicStatus = getMathsProgress(selection.topic.id).status
const divisionEligible = topicStatus === 'practising' || topicStatus === 'mastered'

// Weighted pick:
// TimesTableQuestion: 60%
// DivisionQuestion:   40% (when eligible, else 0% → 100% TimesTable)
```

When `DivisionQuestion` fires, choose `format` randomly: 50% `'division'`, 50% `'missing-factor'`.

Progress recording: call `recordMathsCorrect` / `recordMathsWrong` on the same topic regardless of question type — division and multiplication practice both count towards the same topic mastery.

Commit: `wire DivisionQuestion into maths GameScreen`.

---

## Part 2 — Phonics: `ReadingQuestion` component

### What it tests

This is the only question type in the phonics app where the child must **read** rather than listen. A written word is shown but not spoken. Three audio clips play automatically. The child must identify which clip matches the written word.

This tests decoding in the truest sense: can the child look at the letters, work out the sounds, and match them to speech?

### Step 3 — `ReadingQuestion` component

Create `src/subjects/phonics/components/ReadingQuestion.jsx`.

**Props:** `wordEntry` (the target word object from `words.js`), `distractors` (array of 2 other word objects), `onCorrect`, `onWrong`, `locked`

**How it works:**

**Phase 1 — auto-play sequence (no buttons yet):**

On mount, play all three audio clips in sequence with a short gap between each, numbered as they play. The order is shuffled on mount (so the target is not always in the same position).

```
[Word 1 plays] ... 800ms gap ... [Word 2 plays] ... 800ms gap ... [Word 3 plays]
```

While playing, show a pulsing indicator ("Listening... 1 / 2 / 3") so the child knows which word is currently playing.

Speak each word via TTS: `speak('', wordEntry.word)` — no recorded audio needed, TTS fallback handles this correctly.

**Phase 2 — answer columns:**

After all three clips have played, show three side-by-side columns. Each column contains two elements stacked vertically:

1. **🔊 speaker button** (top) — tapping plays that word's audio. Can be tapped freely as many times as the child needs. No commitment.
2. **↑ select button** (bottom) — tapping submits that word as the answer. Large, at least 64px. This is the only action that commits.

Layout: three columns in a `flex flex-row justify-around` container, each column `flex flex-col items-center gap-2`. Speaker button and select button sized consistently across all three columns. The written target word sits above the three columns, large and centred (`text-5xl font-bold`). A small instruction above that: "Which one said that word?"

The visual separation between the 🔊 (preview) and ↑ (choose) makes the interaction self-explanatory — a child naturally understands "listen here, choose here."

**Tap handling:**
- Tapping 🔊: plays that word's audio. No state change, no commitment. Child can tap any speaker in any order as many times as they like.
- Tapping ↑ on the correct column: `onCorrect()` fires immediately
- Tapping ↑ on a wrong column: highlight correct column's ↑ button green, wrong column's ↑ button red; wait 800ms then `onWrong()`
- Anti-guessing preserved: once a ↑ button is tapped, all buttons lock (`locked` state)

**Replay:** a global 🔊 "Hear all again" button replays the full auto-sequence (all three in order) at any time during phase 2.

Commit: `add ReadingQuestion component`.

---

### Step 4 — Wire `ReadingQuestion` into phonics `GameScreen`

Update `src/subjects/phonics/screens/GameScreen.jsx`.

**Eligibility:** `ReadingQuestion` is eligible when `selectBlendingWord` returns non-null — it draws from the same word pool as `BlendingQuestion` and `SpellingQuestion`. Use the same `wordEntry` + `distractors` data that `selectBlendingWord` returns.

**Updated question weights (6 types):**

| Type | Weight |
|---|---|
| `PhonemeQuestion` | 30% |
| `InitialSoundQuestion` | 20% |
| `BlendingQuestion` | 15% |
| `SpellingQuestion` | 15% |
| `TrickyWordQuestion` | 10% |
| `ReadingQuestion` | 10% |

Ineligible types get weight 0 and the remaining weights rescale proportionally (existing behaviour unchanged).

`ReadingQuestion` does not call `recordCorrect`/`recordWrong` on a grapheme — like `BlendingQuestion`, it tests the whole word and has no single grapheme to record.

Commit: `wire ReadingQuestion into phonics GameScreen`.

---

## Step 5 — Update CLAUDE.md

CLAUDE.md must reflect:

- `DivisionQuestion`: two formats (standard division, missing factor), eligibility (practising/mastered topic only), `divisionToSpeech` helper, 60/40 weighting with `TimesTableQuestion`
- Updated maths `GameScreen`: `DivisionQuestion` wired in, format chosen randomly
- `ReadingQuestion`: two-phase interaction (auto-play sequence then numbered buttons), two-step confirmation (highlight then second tap), replay button, uses `selectBlendingWord` word pool
- Updated phonics question weights: 30/20/15/15/10/10
- Session 12 in build history
- Notes for session 13: addition and subtraction question type for maths; difficulty calibration (rolling 20-question window)

Commit and push.

---

## Definition of done

- [ ] `DivisionQuestion` renders `12 ÷ 3 = ?` and `3 × ? = 12` formats correctly
- [ ] TTS speaks division questions aloud on mount
- [ ] Division only appears for topics that are `practising` or `mastered`
- [ ] Correct and wrong answers update the same topic's progress count
- [ ] Maths `GameScreen` alternates `TimesTableQuestion` and `DivisionQuestion` at ~60/40 when eligible
- [ ] `ReadingQuestion` auto-plays all three words in sequence on mount
- [ ] 🔊 speaker buttons play audio freely with no commitment
- [ ] ↑ select buttons submit the answer — clearly separated from the speaker buttons
- [ ] Wrong answer reveals the correct button; anti-guessing rules preserved
- [ ] `ReadingQuestion` appears in phonics gameplay (verify over several sessions)
- [ ] Phonics question weights updated to 30/20/15/15/10/10
- [ ] CLAUDE.md updated and accurate
- [ ] All committed and pushed

---

## What we are NOT building this session
- Addition and subtraction question type — session 13
- Difficulty calibration — session 13
- Sentence reading
- Phase 3 phonics audio recordings

---

## Notes for session 13

**Addition and subtraction** is the next maths question type. Unlike times tables (fixed 144 facts), arithmetic facts are infinite — generate them programmatically. Track progress by difficulty band rather than individual fact: Band 1 (sums to 10), Band 2 (sums to 20), Band 3 (two-digit addition without carrying), Band 4 (two-digit with carrying), and so on. The same mastery status model applies per band.

**Difficulty calibration** for both apps: maintain a rolling window of the last 20 answers per subject per profile. If correct rate exceeds 85%, introduction of new topics/graphemes can accelerate. If below 55%, pause introduction and focus on consolidating what is already `introduced`. A small indicator in the parent area can show the rolling rate so parents can see how the child is performing across sessions.
