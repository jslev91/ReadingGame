# Jimmy — Session 4 Briefing Prompt

Paste this entire prompt at the start of your fourth Claude Code session.

---

We are continuing work on Jimmy, a phonics learning PWA for 5–6 year olds. Read CLAUDE.md fully before touching anything. Then run `git status` and `git log --oneline -5` to reorient.

## Pre-session checklist — complete before writing any code

**1. Verify progression is working.** Play through the game and confirm that a third grapheme appears after 3 correct answers on 'a'. If not, fix it before proceeding.

**2. Check which sprites exist.** Run `ls -lh public/images/` and note what's there. The only required file is `jimmy-idle.png`. All other poses are optional — missing sprites fall back to idle automatically (see Step 2). The animation, position tracking, and all game logic work correctly regardless of which sprites are present. Real sprites can be dropped into `public/images/` at any time without any code changes.

## Session 4 goals

By the end of this session: Jimmy wanders around his habitat, reacts visibly to correct and wrong answers, a blending question type has been added (the most important missing educational skill), and each play session ends with a summary screen after 10 questions.

---

## Step 1 — `useJimmyAnimation` hook

Create `src/hooks/useJimmyAnimation.js`. This hook drives Jimmy's movement and pose independently of the game logic.

**State managed internally:**
```js
{
  pose: 'idle' | 'walk-1' | 'walk-2' | 'happy' | 'sad' | 'sleep',
  direction: 'left' | 'right',
  x: number,          // 5–90, percentage position across habitat width
  mode: 'wandering' | 'resting' | 'reacting'
}
```

**Behaviour rules:**
- On mount: start in `wandering` mode, direction `'right'`, x at 10
- Every 400ms (use `setInterval`): if `wandering`, alternate between `'walk-1'` and `'walk-2'` pose, and move x by +2 (right) or −2 (left)
- When x reaches 90: reverse direction to `'left'`
- When x reaches 5: reverse direction to `'right'`
- Each tick while wandering: 1 in 25 chance of switching to `resting` mode
- In `resting` mode: pose becomes `'idle'`, no movement. After a random 1.5–3s pause, resume `wandering`
- Clean up the interval on unmount

**`react(pose)` function** (exposed to callers):
- Immediately sets mode to `'reacting'` and pose to the given value (`'happy'` or `'sad'`)
- After 1200ms, resumes `wandering` mode and previous direction
- If already reacting, the new reaction replaces the current one (reset the timer)

**Exposed:** `{ pose, direction, x, react }`

Commit and push.

## Step 2 — Update `Jimmy.jsx` to use animation

Update `src/components/Jimmy.jsx` to consume `useJimmyAnimation` internally (the hook lives inside the component — callers don't manage animation state directly).

**Sprite mapping with fallback:**
```js
const SPRITES = {
  'idle':    '/images/jimmy-idle.png',
  'walk-1':  '/images/jimmy-walk-1.png',
  'walk-2':  '/images/jimmy-walk-2.png',
  'happy':   '/images/jimmy-happy.png',
  'sad':     '/images/jimmy-sad.png',
  'sleep':   '/images/jimmy-sleep.png',
}
const FALLBACK = '/images/jimmy-idle.png'
```

All sprites fall back to `FALLBACK` if the file is missing or fails to load. Implement this by setting `onError` on the `<img>` element to swap `src` to `FALLBACK`. This means the only file that must exist is `jimmy-idle.png` — all others are progressive enhancements. When real sprites are dropped into `public/images/`, they appear automatically with no code changes.

**Rendering:**
- Jimmy is absolutely positioned within the habitat at `left: ${x}%`
- CSS transition on `left`: `transition: left 0.4s linear` for smooth movement
- When `direction === 'right'`: apply `transform: scaleX(-1)` to flip the sprite horizontally (no need for separate right-facing sprites)
- Render sprite at `h-24` (96px height), width auto

**Exposing `react`:** the component must expose the `react` function so GameScreen can trigger reactions. Use `forwardRef` + `useImperativeHandle`, or accept a `reactRef` prop. Whichever pattern is cleaner — document the choice in a comment.

Commit and push.

## Step 3 — Wire reactions into GameScreen

Update `GameScreen.jsx`:
- Hold a ref to the `Jimmy` component
- On correct answer: call `jimmyRef.current.react('happy')` before starting the 1000ms advance timer
- On wrong answer: call `jimmyRef.current.react('sad')` before starting the 1500ms advance timer
- The reaction animation and the advance timer run concurrently — do not wait for the reaction to finish before advancing

Commit and push.

## Step 4 — Word data for blending

Create `src/data/words.js`. This contains decodable CVC words used by the blending question type.

**Data shape per word:**
```js
{
  word: "sat",
  graphemes: ["s", "a", "t"],   // must match grapheme strings in phonics.js exactly
  phase: 2,
  minIntroduced: 3              // minimum number of Phase 2 graphemes child must have 
                                // introduced before this word can appear (prevents 
                                // showing words with unknown graphemes)
}
```

**Include at minimum 40 Phase 2 CVC words** covering a range of `minIntroduced` values from 3 upward, so that words become available progressively as the child learns more graphemes. Examples: sat (3), tip (5), dog (9), hen (14), bug (17). Generate the full list from common English CVC words using only these Phase 2 graphemes: s, a, t, p, i, n, m, d, g, o, c, k, e, u, r, h, b, f, l.

**Word selection function:** export `selectBlendingWord(progressMap, allWords)` that returns a word object where all component graphemes have been introduced to this child. If no eligible words exist yet (too early in progression), return `null`.

Commit and push.

## Step 5 — Blending question type

Create `src/components/BlendingQuestion.jsx`.

**What it tests:** the child hears a word spoken phoneme-by-phoneme (blending cue), then identifies the written word from three options. This is the core blending skill — connecting a phoneme sequence to its written form.

**How it works:**
- Receives props: `wordEntry` (from words.js), `distractors` (2 other word objects), `onCorrect`, `onWrong`, `locked`
- On mount, speaks the word phoneme-by-phoneme using the existing TTS service: speak each grapheme's `ttsText` in sequence with a 500ms pause between each, then after a 700ms pause speak the whole word naturally (use `speak('', wordEntry.word)` to TTS the full word)
- Shows a 🔊 button to replay the full sequence
- Displays three written words as large buttons (the target word + 2 distractors)
- Font should be large, bold, and clear — this is the first time children see full words, it matters
- Same anti-guessing rules as all other question types: one attempt, wrong reveals correct, no retry

**Distractor selection:** choose 2 other words from the eligible pool (words the child could theoretically decode) that share at least one grapheme with the target word — this makes the choice genuinely challenging rather than obvious. If fewer than 3 eligible words exist, the `BlendingQuestion` should not be shown (handled by question mixing logic below).

Commit and push.

## Step 6 — Update question type mixing

Update `GameScreen.jsx` question type selection:

**New mixing logic:**
- Determine eligible question type(s) before each question:
  - `PhonemeQuestion`: always eligible once any grapheme is introduced
  - `InitialSoundQuestion`: eligible once 2+ graphemes are introduced
  - `BlendingQuestion`: eligible only when `selectBlendingWord` returns a non-null result
- If only one type is eligible, use it
- If multiple are eligible, select using weighted random: 50% Phoneme, 25% InitialSound, 25% Blending
- Pass the appropriate props to each component type

Commit and push.

## Step 7 — Session summary screen

Create `src/screens/SessionSummaryScreen.jsx`.

**Triggered:** after 10 questions in a single play session. GameScreen tracks `sessionQuestionCount` (separate from `questionIndex` which persists across sessions) and calls `onSessionComplete({ correct, total, coinsEarned })` when it reaches 10.

**Display:**
- Jimmy visible at top using the habitat component — his pose should be `'happy'` if correct ≥ 7, `'idle'` if correct ≥ 4, `'sad'` if correct < 4. Pass pose as a prop to override animation.
- Large display of coins earned this session: 🪙 +{coinsEarned}
- Simple one-line message:
  - ≥ 8 correct: "Amazing! Jimmy is so happy! 🌟"
  - ≥ 5 correct: "Well done! Keep going! 😊"
  - < 5 correct: "Good try! Practice makes perfect! 💪"
- Two large buttons: "Play again" (starts a new 10-question session) and "🏠 Home"
- No score percentage, no stars, no ranking — keep it warm and non-competitive

Update `App.jsx` to handle the `"summary"` screen state. Navigation: game → summary → game or home.

Commit and push.

## Step 8 — Update CLAUDE.md

CLAUDE.md must be updated to reflect:
- `useJimmyAnimation` hook: state shape, behaviour rules, `react()` function
- Updated `Jimmy.jsx`: sprite mapping, direction flipping, `react` exposure pattern
- `src/data/words.js`: data shape and `selectBlendingWord` function
- `BlendingQuestion` component: how audio works, distractor rule
- Updated question mixing logic
- `SessionSummaryScreen`: trigger condition and navigation
- Session 4 added to build history

Commit and push.

## Definition of done

- [ ] Jimmy visibly moves left and right across the habitat floor (using idle sprite until walk frames arrive)
- [ ] Jimmy pauses occasionally then resumes moving (resting mode)
- [ ] Jimmy flips direction correctly using `scaleX(-1)` — always faces the direction he's moving
- [ ] Correct answer triggers the `happy` pose (or idle fallback) for ~1.2 seconds then Jimmy resumes
- [ ] Wrong answer triggers the `sad` pose (or idle fallback) for ~1.2 seconds then Jimmy resumes
- [ ] When real sprites are added to `public/images/`, they appear without any code changes
- [ ] `BlendingQuestion` appears during gameplay (verify by playing through ~12 questions)
- [ ] Blending audio plays phoneme-by-phoneme then speaks the whole word
- [ ] Written word options are large and clearly readable
- [ ] After exactly 10 questions the summary screen appears
- [ ] Summary screen shows coins earned and an appropriate message
- [ ] "Play again" starts a fresh 10-question session; "Home" returns to home screen
- [ ] All question types still follow the anti-guessing rules
- [ ] CLAUDE.md is accurate and updated
- [ ] All changes committed and pushed to GitHub

## What we are NOT building this session
- The shop or any coin-spending mechanic
- Additional question types beyond the three now existing
- User profiles or authentication
- Tricky words / sight words
- Sentence reading
- Phase 3 blending words (Phase 2 CVC only for now)

## Note on session length
This is the largest session so far. If time runs short, drop the session summary screen (Step 7) and carry it into session 5 — the walking animation and blending question type are the priorities. Do not skip either of those.
