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
  services/    ← tts.js, storage.js
  hooks/       ← usePet.js, useProgress.js (stub)
  components/  ← reusable UI components
  screens/     ← top-level screen components
  context/     ← React contexts
docs/          ← session briefings and reference material
```

## Services

### `src/services/tts.js`
Single exported `speak(text, options)` function using the Web Speech API with `lang: 'en-GB'`. **Never call `speechSynthesis` directly in a component.** This abstraction allows swapping in recorded audio or a different TTS provider later without touching components.

### `src/services/storage.js`
Wrapper around localStorage that always namespaces reads and writes by `userId`. All persisted state must be keyed by `userId`. Current user: `{ id: "guest", name: "Player" }`. The storage layer must require no restructuring when real user profiles are added.

## Data — `src/data/phonics.js`
Phase 2 and Phase 3 data from the Letters and Sounds sequence. Each grapheme entry:
- `grapheme` — e.g. `"sh"`
- `phonemeDescription` — e.g. `"sh as in ship"`
- `exampleWords` — array of 2–3 simple CVC or short words
- `phase` — `2` or `3`
- `order` — sequence number within phase

Per-user grapheme status (`"unseen" | "introduced" | "practising" | "mastered"`) is stored separately via the storage service, not in this file.

## Jimmy the giraffe — `src/hooks/usePet.js`
- `energy`: number 0–100, starts at 70, persisted via storage service (keyed by `userId`)
- Correct answer: +10 energy (capped at 100)
- Wrong answer: −5 energy (floored at 0)
- Passive decay: −1 every 5 minutes, calculated from a stored timestamp on load
- `mood`: derived — `"happy"` if energy > 60, `"okay"` if > 30, `"sad"` otherwise
- Exposes: `energy`, `mood`, `onCorrect()`, `onWrong()`

## Anti-guessing principle — critical design constraint
This app must **never** reward guessing:
- Each question gets exactly **one attempt**
- A wrong answer immediately reveals the correct answer — no retry
- Energy is always deducted on a wrong answer
- **Never** show a "try again" prompt
- Question design should make random tapping a losing strategy over time

## UI constraints
- All interactive elements: minimum **64px** touch target (young children have poor fine motor control)
- Simple, bold fonts — no decorative or serif fonts
- Navigation must not require reading — use icons or imagery
- Bright, friendly colour palette

## Git rules — mandatory every session, without being asked
- After each meaningful unit of work: `git add -A && git commit -m "<descriptive message>"` and `git push`
- Commit messages must be concise and specific (e.g. `add Phase 2 phonics data`, not `update files`)
- Never batch unrelated changes into a single commit
- If a step fails or produces broken code, commit the broken state with a message starting `WIP:` before attempting a fix
- At the start of every new session: run `git status` and `git log --oneline -5` before touching anything

## Session build order
1. ~~Scaffold project (React + Vite + Tailwind + PWA)~~ ✓
2. ~~Create `CLAUDE.md`~~ ✓ — **pause for review before continuing**
3. Create `src/services/tts.js` and `src/services/storage.js`
4. Create `src/data/phonics.js` with Phase 2 and Phase 3 data
5. Create `src/hooks/usePet.js`
6. Create `src/components/PhonemeQuestion.jsx`
7. Wire everything together in `App.jsx` with a hardcoded grapheme for testing
