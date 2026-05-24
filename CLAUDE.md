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
  data/        ← phonics curriculum
  services/    ← tts.js, storage.js, questionSelector.js
  hooks/       ← usePet.js, useProgress.js
  components/  ← Jimmy.jsx, PhonemeQuestion.jsx
  screens/     ← HomeScreen.jsx, GameScreen.jsx
  context/     ← React contexts (unused so far)
docs/          ← session briefings and reference material
```

## Services

### `src/services/tts.js`
Exported `speak(audioKey, fallbackText)` function. Plays `/audio/${audioKey}.wav` first; falls back to Web Speech API speaking `fallbackText` if the file is missing or fails. Web Speech API: prefers Google `en-GB` voice, rate 0.82, 100ms iOS delay. **Never call `speechSynthesis` or `new Audio()` directly in a component.**

Recorded `.wav` files live in `public/audio/`. All 50 graphemes have recordings — TTS fallback is available but not expected to trigger in normal use.

### `src/services/storage.js`
Wrapper around localStorage that always namespaces reads and writes by `userId` using the key pattern `jimmy:{userId}:{suffix}`. All persisted state must be keyed by `userId`. Current user: `{ id: "guest", name: "Player" }`.

### `src/services/questionSelector.js`
Exports `selectNextQuestion(progressMap)`. Determines which grapheme to ask next using these rules (in priority order):
1. Work through Phase 2 graphemes in Letters and Sounds order; don't start Phase 3 until 6 Phase 2 graphemes are `practising` or `mastered`
2. A new grapheme is introduced only when the most recently seen non-unseen grapheme has reached `practising` (3 correct answers) — this naturally paces introductions without a hard per-session cap
3. After introducing a new grapheme, interleave it with review of `introduced` and `practising` graphemes
4. `mastered` graphemes appear ~1 in 10 questions as maintenance review
5. Distractors come only from graphemes the child has been introduced to; Phase 2 graphemes fill slots if fewer than 2 are available

## Data — `src/data/phonics.js`
Phase 2 (23 graphemes) and Phase 3 (27 graphemes) from Letters and Sounds. Each entry: `grapheme`, `ttsText`, `phonemeDescription`, `exampleWords`, `phase`, `order`.

Each entry has two audio-related fields:
- `audioKey`: filename stem for `/public/audio/*.wav` (matches grapheme for most; `oo_long` and `oo_short` for the two `oo` entries)
- `ttsText`: fallback text for Web Speech API when the audio file is missing (example word that starts with or clearly features the phoneme)

Always call `speak(entry.audioKey, entry.ttsText)` — never speak the grapheme directly.

**Important:** `oo` appears twice in Phase 3 (orders 17 and 18) with different phonemes ("oo as in moon" vs "oo as in book"). Components accept a full entry object rather than a bare grapheme string to avoid ambiguity. Use `===` reference equality to identify the correct answer.

Per-user grapheme status (`"unseen" | "introduced" | "practising" | "mastered"`) is stored separately via the storage service, not in this file.

## Hooks

### `src/hooks/usePet.js`
Persisted under `jimmy:{userId}:petState`. State shape:
```js
{
  energy:  { value: 70, max: 100 },
  hunger:  { value: 80, max: 100 },
  social:  { value: 90, max: 100 },
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
- Hunger and social decay passively only — not yet affected by gameplay

`mood` derived from average of energy/hunger/social: `"happy"` > 60, `"okay"` > 30, `"sad"` otherwise.

Exposes: `stats`, `mood`, `onCorrect()`, `onWrong()`

### `src/hooks/useProgress.js`
Per-user, per-grapheme progress stored under `jimmy:{userId}:graphemeProgress`.

State shape per grapheme:
```js
{ status: "unseen"|"introduced"|"practising"|"mastered", correctCount: 0, lastSeen: null }
```

Transitions: `unseen → introduced` on first presentation; `introduced → practising` at 3 correct; `practising → mastered` at 7 correct. Wrong answers don't regress status.

Exposes: `progressMap`, `getProgress(grapheme)`, `recordPresented(grapheme)`, `recordCorrect(grapheme)`, `recordWrong(grapheme)`.

## Components

### `src/components/Jimmy.jsx`
The Jimmy habitat. A fixed-height (`h-48`) rectangular zone with sky-blue background and a green grass strip at the bottom. Jimmy's sprite sits on the grass line, centred, rendered at `h-24`.

Pose system: accepts a `pose` prop (default `"idle"`). Currently maps only `"idle"` → `jimmy-idle.png`. Future pose filenames to add under `public/images/`:
- `walking-1` → `jimmy-walk-1.png`
- `walking-2` → `jimmy-walk-2.png`
- `sleep` → `jimmy-sleep.png`
- `eating` → `jimmy-eating.png`
- `happy` → `jimmy-happy.png`
- `sad` → `jimmy-sad.png`

Coin counter (🪙) in top-right corner of habitat. Three slim stat bars below the habitat: ⚡ Energy (green), 🍃 Hunger (orange), 💬 Social (purple).

Props: `stats` (full usePet stats object), `mood` (string), `pose` (default `"idle"`).

### `src/components/PhonemeQuestion.jsx`
Props: `entry` (full phonics entry object), `distractors` (array of 2 entry objects from questionSelector), `onCorrect`, `onWrong`, `locked`.

Speaks the phoneme on mount via TTS. Shows a 🔊 button to replay. Displays three grapheme buttons (correct + 2 distractors, shuffled). One attempt only — wrong answer immediately reveals the correct answer in green. `locked` prop disables all buttons during the auto-advance feedback pause.

### `src/components/InitialSoundQuestion.jsx`
Reverse of PhonemeQuestion: the child hears a whole word and taps the grapheme for the target sound. Audio always uses TTS fallback — `speak(entry.audioKey + '_word', prompt)` with a key that intentionally matches no `.wav` file. Same props, layout, and anti-guessing rules as PhonemeQuestion.

Question wording is position-aware via `getSegmentInfo(entry)`, which searches `ttsText` then `exampleWords` in order:
- Grapheme at start of word (s, a, ch …) → "What sound is at the beginning of sat?"
- Grapheme at end of word (ck, ng, x …) → "What sound is at the end of duck?"
- Grapheme in the middle (ai, oa, oo …) → "What sound do you hear in rain?"

## Screens

### `src/screens/HomeScreen.jsx`
Shows the Jimmy habitat (sprite, stat bars, coin counter) and a "Play with Jimmy" button. Calls `onPlay` prop on tap.

### `src/screens/GameScreen.jsx`
Main game loop. Uses `usePet` and `useProgress`. On each question:
- Calls `selectNextQuestion(progressMap)` inside a `useEffect([questionIndex])`. `progressMap` is intentionally absent from the dep array: `useProgress` re-evaluates on every render, so the render triggered by `setQuestionIndex` already carries the updated map (recordCorrect/recordWrong fire 1000–1500ms before the timer). Adding `progressMap` to deps would cause an infinite loop because `recordPresented` (called inside the effect) updates it.
- Correct answer: calls `pet.onCorrect()` and `progress.recordCorrect()`, waits 1000ms, increments `questionIndex`
- Wrong answer: calls `pet.onWrong()` and `progress.recordWrong()`, waits 1500ms, increments `questionIndex`
- `questionIndex` is also included in the question component's `key` to guarantee remounting even if the same grapheme appears consecutively
- **Question type mixing:** `questionIndex % 3 === 2` → `InitialSoundQuestion`; otherwise `PhonemeQuestion`. Same `selectNextQuestion` result feeds both types.

## Navigation
Simple React state in `App.jsx` (`screen`: `"home"` | `"game"`). No router library.

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
- **Session 3:** Refactored usePet to multi-stat model (energy, hunger, social, coins); replaced Jimmy emoji with habitat component (sprite, sky/grass, stat bars, coin counter); added InitialSoundQuestion; question type mixing (every 3rd question); updated HomeScreen to show habitat
