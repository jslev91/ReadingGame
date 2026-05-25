# Jimmy Phonics — Project Briefing

## Overview
A phonics learning PWA for children aged 5–6, guided by a parent or teacher. Teaches reading using systematic synthetic phonics following the Letters and Sounds / ELS methodology.

- **Core mechanic:** hear a phoneme, tap the correct grapheme from three options
- **Gamification:** a virtual pet giraffe called Jimmy whose energy rises with correct answers and decays slowly over time
- **Language:** British English throughout — all text, all audio

## Stack
- React + Vite
- Tailwind CSS (`@tailwindcss/vite`)
- Web Speech API for TTS (abstracted — see Services)
- PWA with service worker (`vite-plugin-pwa`) for offline use
- localStorage for persistence, keyed by `userId`

## Folder structure
```
src/
  data/        ← phonics curriculum (phonics.js, words.js)
  services/    ← tts.js, storage.js, questionSelector.js
  hooks/       ← usePet.js, useProgress.js, useJimmyAnimation.js
  components/  ← Jimmy.jsx, PhonemeQuestion.jsx, InitialSoundQuestion.jsx, BlendingQuestion.jsx
  screens/     ← HomeScreen.jsx, GameScreen.jsx, SessionSummaryScreen.jsx
  context/     ← React contexts (unused so far)
docs/          ← session briefings and reference material
```

## Services

### `src/services/tts.js`
Exported `speak(audioKey, fallbackText)` function. Plays `/audio/${audioKey}.wav` first; falls back to Web Speech API speaking `fallbackText` if the file is missing or fails. Web Speech API: prefers Google `en-GB` voice, rate 0.82, 100ms iOS delay. **Never call `speechSynthesis` or `new Audio()` directly in a component.**

Recorded `.wav` files live in `public/audio/`. All 50 graphemes have recordings — TTS fallback is available but not expected to trigger in normal use.

The cancel function returned by `speak()` clears both the Audio element and any pending TTS timer (100ms delay). Always use it as a `useEffect` cleanup. `speakBlending` in `BlendingQuestion` tracks cancel functions from all started `speak()` calls so `cancelAll` stops active audio, not just pending timeouts.

### `src/services/storage.js`
Wrapper around localStorage that always namespaces reads and writes by `userId` using the key pattern `jimmy:{userId}:{suffix}`. All persisted state must be keyed by `userId`. Current user: `{ id: "guest", name: "Player" }`.

### `src/services/questionSelector.js`
Exports `selectNextQuestion(progressMap)`. Determines which grapheme to ask next using these rules (in priority order):
1. Work through Phase 2 graphemes in Letters and Sounds order; don't start Phase 3 until 6 Phase 2 graphemes are `practising` or `mastered`
2. A new grapheme is introduced only when the most recently seen non-unseen grapheme has reached `practising` (3 correct answers) — this naturally paces introductions without a hard per-session cap
3. After introducing a new grapheme, interleave it with review of `introduced` and `practising` graphemes
4. `mastered` graphemes appear ~1 in 10 questions as maintenance review
5. Distractors come only from graphemes the child has been introduced to; Phase 2 graphemes fill slots if fewer than 2 are available

## Data

### `src/data/phonics.js`
Phase 2 (23 graphemes) and Phase 3 (27 graphemes) from Letters and Sounds. Each entry: `grapheme`, `ttsText`, `phonemeDescription`, `exampleWords`, `phase`, `order`.

Each entry has two audio-related fields:
- `audioKey`: filename stem for `/public/audio/*.wav` (matches grapheme for most; `oo_long` and `oo_short` for the two `oo` entries)
- `ttsText`: fallback text for Web Speech API when the audio file is missing (example word that starts with or clearly features the phoneme)

Always call `speak(entry.audioKey, entry.ttsText)` — never speak the grapheme directly.

**Important:** `oo` appears twice in Phase 3 (orders 17 and 18) with different phonemes ("oo as in moon" vs "oo as in book"). Components accept a full entry object rather than a bare grapheme string to avoid ambiguity. Use `===` reference equality to identify the correct answer.

Per-user grapheme status (`"unseen" | "introduced" | "practising" | "mastered"`) is stored separately via the storage service, not in this file.

### `src/data/words.js`
50 decodable Phase 2 CVC words used by `BlendingQuestion`. Each entry:
```js
{ word: "sat", graphemes: ["s", "a", "t"], phase: 2, minIntroduced: 3 }
```
`minIntroduced` gates words behind progression — a word only appears when the child has introduced at least that many Phase 2 graphemes AND all its component graphemes.

Exports `selectBlendingWord(progressMap)` which returns `{ wordEntry, distractors }` or `null` if fewer than 3 eligible words exist.

## Hooks

### `src/hooks/usePet.js`
Persisted under `jimmy:{userId}:petState`. State shape:
```js
{
  energy:  { value: 70, max: 100 },
  hunger:  { value: 80, max: 100 },
  cleanliness:  { value: 90, max: 100 },
  coins: 0,
  lastDecayTimestamp: <ISO string>
}
```
Decay (calculated from `lastDecayTimestamp` on load):
- Energy: −1 per 5 minutes
- Hunger: −1 per 8 minutes
- Social: −1 per 20 minutes

Reward/penalty:
- Correct: +1 coin, +5 energy
- Wrong: −3 energy
- Coins never decrease from gameplay (shop not built yet)
- Hunger and cleanliness decay passively only — not yet affected by gameplay

`mood` derived from average of energy/hunger/cleanliness: `"happy"` > 60, `"okay"` > 30, `"sad"` otherwise.

Exposes: `stats`, `mood`, `onCorrect()`, `onWrong()`

### `src/hooks/useProgress.js`
Per-user, per-grapheme progress stored under `jimmy:{userId}:graphemeProgress`.

State shape per grapheme:
```js
{ status: "unseen"|"introduced"|"practising"|"mastered", correctCount: 0, lastSeen: null }
```

Transitions: `unseen → introduced` on first presentation; `introduced → practising` at 3 correct; `practising → mastered` at 7 correct. Wrong answers don't regress status.

Exposes: `progressMap`, `getProgress(grapheme)`, `recordPresented(grapheme)`, `recordCorrect(grapheme)`, `recordWrong(grapheme)`.

### `src/hooks/useJimmyAnimation.js`
Drives Jimmy's movement and pose independently of game logic. Internal state:
```js
{ pose, direction: 'left'|'right', x: 5–90, mode: 'wandering'|'resting'|'reacting' }
```
- Ticks every 400ms: alternates `walk-1`/`walk-2`, moves x ±2, bounces at 5 and 90
- 1-in-25 chance per tick of switching to `resting` (pose: `idle`, no movement, 1.5–3s pause)
- `react(pose)`: sets mode to `reacting`, holds pose for 1200ms, then resumes `wandering`
- Exposes: `{ pose, direction, x, react }`

## Components

### `src/components/Jimmy.jsx`
The Jimmy habitat. Uses `useJimmyAnimation` internally. Exposed via `forwardRef` + `useImperativeHandle` so callers can call `ref.current.react(pose)` to trigger reactions without managing animation state.

A fixed-height (`h-48`) rectangular zone with sky-blue background and green grass strip. Jimmy's sprite is absolutely positioned at `left: ${x}%` with `transition: left 0.4s linear`. Direction flipping uses `transform: scaleX(-1)` — no separate right-facing sprites needed.

Sprite mapping (all fall back to `jimmy-idle.png` via `onError`):
```
idle     → jimmy-idle.png      (required — must exist)
walk-1   → jimmy-walk-1.png
walk-2   → jimmy-walk-2.png
happy    → jimmy-happy.png
sad      → jimmy-sad.png
sleep    → jimmy-sleep.png
```
Drop new sprites into `public/images/` and they appear automatically with no code changes.

Optional `pose` prop overrides animation (used by SessionSummaryScreen for a static pose).

Coin counter (🪙) in top-right corner. Three slim stat bars below: ⚡ Energy (green), 🍃 Hunger (orange), 💬 Social (purple).

Props: `stats`, `mood`, `pose` (optional override).

### `src/components/PhonemeQuestion.jsx`
Props: `entry`, `distractors`, `onCorrect`, `onWrong`, `locked`.
Speaks the phoneme on mount. Shows 🔊 replay. Three `flex-1` grapheme buttons (shuffled). One attempt only.

### `src/components/InitialSoundQuestion.jsx`
Props: same as PhonemeQuestion. Child hears a whole word and taps its target grapheme. TTS fallback intentional. Question wording is position-aware via `getSegmentInfo(entry)`:
- Grapheme at start → "What sound is at the beginning of sat?"
- Grapheme at end → "What sound is at the end of duck?"
- Grapheme in middle → "What sound do you hear in rain?"

### `src/components/BlendingQuestion.jsx`
Props: `wordEntry`, `distractors` (2 word objects), `onCorrect`, `onWrong`, `locked`.
Speaks each grapheme's phoneme in sequence (500ms gaps) then speaks the whole word (700ms after last phoneme). Child taps the correct written word from three options. Distractors share at least one grapheme with the target. Same anti-guessing rules.

## Screens

### `src/screens/HomeScreen.jsx`
Shows Jimmy habitat and "Play with Jimmy" button.

### `src/screens/GameScreen.jsx`
Main game loop. 10 questions per session (`SESSION_LENGTH = 10`). Tracks `sessionCorrect` and `sessionCoins` via refs (reset on mount). Calls `onSessionComplete({ correct, total, coinsEarned })` after the 10th question.

Question type selection per question (weighted random, evaluated each time):
- `PhonemeQuestion`: always eligible — 50% weight when others available
- `InitialSoundQuestion`: eligible when 2+ graphemes introduced — 25% weight
- `BlendingQuestion`: eligible when `selectBlendingWord` returns non-null — 25% weight
- If only one or two types eligible, weights are redistributed proportionally

`questionIndex` dep array pattern — see comment in code. `progressMap` intentionally absent; adding it would cause an infinite loop via `recordPresented`.

Holds a `jimmyRef` and calls `jimmyRef.current.react('happy'/'sad')` on answer.
Progress is only recorded for phoneme/initial questions — blending questions don't map to a single grapheme.

### `src/screens/SessionSummaryScreen.jsx`
Shown after 10 questions. Displays Jimmy habitat (static pose based on score), coins earned, a score message, and "Play again" / "Home" buttons.
- ≥ 7 correct → `happy` pose, "Amazing! Jimmy is so happy! 🌟"
- ≥ 4 correct → `idle` pose, "Well done! Keep going! 😊"
- < 4 correct → `sad` pose, "Good try! Practice makes perfect! 💪"

## Navigation
React state in `App.jsx` (`screen`: `"home"` | `"game"` | `"summary"`). No router library.

## Anti-guessing principle — critical design constraint
- Each question gets exactly **one attempt**
- Wrong answer immediately reveals the correct answer — no retry
- Energy is always deducted on a wrong answer
- **Never** show a "try again" prompt

## UI constraints
- All interactive elements: minimum **64px** touch target
- Simple, bold fonts — no decorative or serif fonts
- Navigation must not require reading — use icons or imagery
- Bright, friendly colour palette

## Git rules — mandatory every session, without being asked
- After each meaningful unit of work: `git add` the relevant files, commit with a descriptive message, and `git push`
- Commit messages must be concise and specific (e.g. `add Phase 2 phonics data`, not `update files`)
- Never batch unrelated changes into a single commit
- If a step fails or produces broken code, commit the broken state with a message starting `WIP:` before attempting a fix
- At the start of every new session: run `git status` and `git log --oneline -5` before touching anything
- **Update CLAUDE.md whenever architecture, data shapes, design decisions, or behaviour changes** — do not wait to be asked

## Session build history
- **Session 1:** Scaffold, CLAUDE.md, tts + storage services, phonics data, usePet, PhonemeQuestion, basic App wiring
- **Session 2:** TTS voice selection + iOS fix, Jimmy component, useProgress (full), questionSelector, GameScreen, HomeScreen, App navigation; fixed stale-closure question auto-advance bug; fixed progression gate (removed per-session cap, replaced with practising-status check); added ttsText to all phonics entries + word-by-word TTS pacing; recorded .wav files for all 50 graphemes; fixed StrictMode double-audio (AbortError guard + fallbackCalled flag)
- **Session 3:** Refactored usePet to multi-stat model (energy, hunger, cleanliness, coins); replaced Jimmy emoji with habitat component (sprite, sky/grass, stat bars, coin counter); added InitialSoundQuestion; question type mixing (every 3rd question); updated HomeScreen to show habitat
- **Session 4:** useJimmyAnimation hook (wandering/resting/reacting); animated Jimmy with forwardRef reactions; words.js with 50 Phase 2 CVC words; BlendingQuestion (phoneme-by-phoneme audio); weighted question type mixing (50/25/25); 10-question session tracking; SessionSummaryScreen
