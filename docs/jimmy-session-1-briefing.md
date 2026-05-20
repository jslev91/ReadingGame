# Jimmy — Session 1 Briefing Prompt

Paste this entire prompt at the start of your first Claude Code session.

---

I'm building a phonics learning PWA for 5–6 year olds. It teaches reading using systematic synthetic phonics following the Letters and Sounds / ELS methodology. Here is everything you need to know before we write any code.

## Project overview
- Target users: children aged 5–6, guided by a parent or teacher
- Core mechanic: phonics questions (first type: hear a phoneme, tap the correct grapheme from three options)
- Gamification: a virtual pet giraffe called Jimmy whose energy rises with correct answers and decays slowly over time
- British English throughout — all text, all audio

## Stack
- React + Vite
- Tailwind CSS
- Web Speech API for TTS (abstracted into a service — see below)
- PWA with service worker for offline use
- localStorage for persistence (keyed by userId)

## TTS service
Create `src/services/tts.js` with a single exported `speak(text, options)` function. Internally it uses the Web Speech API with `lang: 'en-GB'`. Everything in the app that needs to produce audio calls this function — never call `speechSynthesis` directly in a component. This abstraction allows us to swap in recorded audio or a different TTS provider later without refactoring components.

## Data architecture — profile-ready from day one
All persisted state must be keyed by `userId`. For now the only user is `{ id: "guest", name: "Player" }`. When we add real user profiles later, the storage layer should require no restructuring. Create `src/services/storage.js` as a wrapper around localStorage that always namespaces reads and writes by userId.

## Phonics curriculum
Create `src/data/phonics.js` containing Phase 2 and Phase 3 data from the Letters and Sounds sequence. Each grapheme entry should include:
- `grapheme` (e.g. "sh")
- `phonemeDescription` (e.g. "sh as in ship")
- `exampleWords` (array of 2–3 simple CVC or short words)
- `phase` (2 or 3)
- `order` (sequence number within phase, for progression)

Per-user grapheme status (`"unseen" | "introduced" | "practising" | "mastered"`) will be stored separately in the storage service, not inside this data file.

## Jimmy the giraffe — pet state
Create `src/hooks/usePet.js`. It manages:
- `energy`: number 0–100, starts at 70, persisted in localStorage via the storage service (keyed by userId)
- Correct answer: +10 energy (capped at 100)
- Wrong answer: −5 energy (floored at 0)
- Passive decay: −1 every 5 minutes, calculated from a stored timestamp each time the hook loads
- `mood`: derived — `"happy"` if energy > 60, `"okay"` if > 30, `"sad"` otherwise
- Expose: `energy`, `mood`, `onCorrect()`, `onWrong()`

Jimmy is a giraffe. We are not building any visuals this session — just the hook. Log state changes to the console for now.

## Anti-guessing principle — critical design constraint
This app must never reward guessing. Implement strictly:
- Each question gets exactly one attempt
- A wrong answer immediately reveals the correct answer — no retry
- Energy is always deducted on a wrong answer
- Never show a "try again" prompt
- Question design should make random tapping a losing strategy over time

## Progression state shape
We are not building progression logic this session, but the storage layer must support it. Per-user, per-grapheme state should be storable with the status values above (unseen / introduced / practising / mastered). Create stub functions in the storage service for reading and writing this state. We will build the transition logic in a later session.

## UI constraints
- All interactive elements: minimum 64px touch target (young children have poor fine motor control)
- Simple, bold fonts — no decorative or serif fonts
- Navigation must not require reading — use icons or imagery
- Bright, friendly colour palette — use sensible defaults for now, we will refine later

## Folder structure — use exactly this
```
src/
  data/        ← phonics curriculum
  services/    ← tts.js, storage.js
  hooks/       ← usePet.js, useProgress.js (stub only for now)
  components/  ← reusable UI components
  screens/     ← top-level screen components
  context/     ← React contexts
```

## Git and GitHub — always on, every session

Every session must use version control. This is not optional and should never need to be requested.

**Rules Claude must follow in every session, without being asked:**
- After completing each numbered step below (and in all future sessions, after each meaningful unit of work), run `git add -A && git commit -m "<descriptive message>"` and `git push`
- Commit messages should be concise and specific: e.g. `add Phase 2 phonics data`, `wire usePet hook to PhonemeQuestion`, not `update files`
- Never batch unrelated changes into a single commit
- If a step fails or produces broken code, commit the broken state with a message starting `WIP:` before attempting a fix — this preserves the ability to roll back
- At the start of every new session, check `git status` and `git log --oneline -5` to reorient before touching anything

**First-time setup (step 0 below) — requires GitHub CLI**

GitHub CLI (`gh`) makes repo creation possible without leaving the terminal. If not installed: https://cli.github.com. Once installed, authenticate with `gh auth login` before starting.

## What to build this session — in this exact order

0. **Git setup:** Run `git init`, then `gh repo create jimmy-phonics --public --source=. --remote=origin --push` (adjust visibility to `--private` if preferred). Confirm the remote is set with `git remote -v` before proceeding.
1. Scaffold the project (React + Vite + Tailwind + PWA service worker). Confirm it runs. Commit and push.
2. Create `CLAUDE.md` summarising this entire briefing accurately, including the git rules above. **Stop here and wait for my review before continuing.** Commit and push the CLAUDE.md.
3. Create `src/services/tts.js` and `src/services/storage.js`. Commit and push.
4. Create `src/data/phonics.js` with Phase 2 and Phase 3 Letters and Sounds data. Commit and push.
5. Create `src/hooks/usePet.js`. Commit and push.
6. Create `src/components/PhonemeQuestion.jsx`. It receives a `grapheme` prop, speaks the phoneme on mount via the TTS service, displays three grapheme options (the correct one plus two distractors drawn from the same phase), and calls `onCorrect` or `onWrong` callbacks on tap. No animation yet. Commit and push.
7. Wire everything together in `App.jsx` with a single hardcoded grapheme for testing. Log pet state to the console. Commit and push.

**Do not proceed past step 2 until I have reviewed and approved the CLAUDE.md.**
