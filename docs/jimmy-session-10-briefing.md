# Jimmy — Session 10 Briefing Prompt

Paste this entire prompt at the start of your tenth Claude Code session.

---

We are continuing work on Jimmy, a phonics learning PWA for 5–6 year olds. Read CLAUDE.md fully before touching anything. Then run `git status` and `git log --oneline -5` to reorient.

## Pre-session checks

**1. Verify session 9 is complete:**
- ProfileSelectScreen shown on first launch
- Profile switching works from HomeScreen
- Parent area accessible via long-press ⚙️
- Grapheme editor (tap-to-cycle status) working in parent area
- Scarf cosmetic visible in shop

**2. No background removal needed this session — skip the PIL step.**

---

## Session 10 goal

Restructure the repo so phonics and maths are separate subjects sharing a common core. The output is two independently deployable apps — one for phonics (unchanged for users), one for maths (a working stub, ready for content in session 11) — both building from the same GitHub repository and deploying to separate Vercel projects.

No new features. No new question types. This session is entirely structural.

---

## Critical rule for this session

**Move files one group at a time. After every group of moves, run `npm run dev` and verify the phonics app still works before proceeding.** Do not move everything at once and then fix a cascade of broken imports. If a step breaks the build, fix it before moving on. Commit after each step passes.

---

## Target folder structure

```
/
  index.html                  ← phonics entry HTML (updated entry point ref)
  maths.html                  ← new maths entry HTML
  vite.config.js              ← phonics build (updated)
  vite.maths.config.js        ← new maths build config
  package.json                ← adds build:maths script
  public/                     ← unchanged (shared assets, audio, images)
  src/
    core/
      data/
        items.js              ← moved from src/data/
      services/
        tts.js                ← moved from src/services/
        storage.js            ← moved from src/services/
      hooks/
        usePet.js             ← moved from src/hooks/
        useJimmyAnimation.js  ← moved from src/hooks/
        useProfiles.js        ← moved from src/hooks/
      components/
        Jimmy.jsx             ← moved from src/components/
        ProfileAvatar.jsx     ← moved from src/components/
      screens/
        HomeScreen.jsx        ← moved from src/screens/
        ShopScreen.jsx        ← moved
        SessionSummaryScreen.jsx ← moved
        ProfileSelectScreen.jsx  ← moved
        CreateProfileScreen.jsx  ← moved
        ParentAreaScreen.jsx     ← moved
    subjects/
      phonics/
        data/
          phonics.js          ← moved from src/data/
          words.js            ← moved
          trickyWords.js      ← moved
        services/
          questionSelector.js ← moved from src/services/
          cosmeticSprites.js  ← moved from src/services/ (or wherever it lives)
        hooks/
          useProgress.js      ← moved from src/hooks/
        components/
          PhonemeQuestion.jsx       ← moved from src/components/
          InitialSoundQuestion.jsx  ← moved
          BlendingQuestion.jsx      ← moved
          SpellingQuestion.jsx      ← moved
          TrickyWordQuestion.jsx    ← moved
        screens/
          GameScreen.jsx      ← moved from src/screens/
          ProgressScreen.jsx  ← moved
      maths/
        data/
          curriculum.js       ← new stub
        hooks/
          useProgress.js      ← new stub
        components/
          MathsQuestion.jsx   ← new stub
        screens/
          GameScreen.jsx      ← new stub
          ProgressScreen.jsx  ← new stub
    apps/
      phonics/
        App.jsx               ← adapted from current src/App.jsx
        main.jsx              ← new entry point (adapted from src/main.jsx)
      maths/
        App.jsx               ← new stub
        main.jsx              ← new stub
```

---

## Profile shape change

Each profile now belongs to one subject. Before any file moves, update the profile shape in `useProfiles.js`:

```js
{
  id: string,
  name: string,
  colour: string,
  subject: 'phonics' | 'maths',   // NEW — which app this profile belongs to
  createdAt: ISO,
}
```

**`useProfiles` changes:**
- `createProfile({ name, colour, subject })` — `subject` is now required
- `createGuestProfile({ name, colour })` — sets `subject: 'phonics'` (guest migration is always phonics)
- Add `getProfilesForSubject(subject)` — returns `profiles.filter(p => p.subject === subject)`
- `activeProfile` already works as-is (the active profile id is global, but each app only sets it from its own subject's profiles)

**`ProfileSelectScreen` change:**
- Receives a `subject` prop (`'phonics'` or `'maths'`) from `App.jsx`
- Shows only `getProfilesForSubject(subject)` — profiles from the other subject are never visible
- The "+ Add player" flow passes `subject` through to `CreateProfileScreen`

**`CreateProfileScreen` change:**
- Receives `subject` prop
- No subject picker shown — it is set silently by whichever app the user is in
- Passes `subject` to `createProfile()`

**`ParentAreaScreen` change:**
- Profiles list shows only profiles for the current subject (same `getProfilesForSubject` filter)
- "Delete" only acts on profiles the app can see

Each profile has its own pet state, coins, and progress — there is no shared state between a phonics profile and a maths profile. The two apps are fully independent from a data perspective.

Commit this change before any file moves. Verify the phonics app still works (existing guest profile will be missing the `subject` field — add a migration on load in `useProfiles`: if `p.subject` is undefined, default it to `'phonics'`).

---

## Step 1 — Create the target directories (no file moves)

Create the empty folder structure above using `mkdir -p`. Do not move or edit any files yet. Verify `npm run dev` still works. Commit the empty folders (add a `.gitkeep` to each if needed).

---

## Step 2 — Move services to core

Move:
- `src/services/tts.js` → `src/core/services/tts.js`
- `src/services/storage.js` → `src/core/services/storage.js`

Update every import across the codebase that references these files. Run `npm run dev`. Fix any broken imports. Commit: `refactor: move tts and storage to core/services`.

---

## Step 3 — Move shared hooks to core

Move:
- `src/hooks/usePet.js` → `src/core/hooks/usePet.js`
- `src/hooks/useJimmyAnimation.js` → `src/core/hooks/useJimmyAnimation.js`
- `src/hooks/useProfiles.js` → `src/core/hooks/useProfiles.js`

Move phonics-specific hook:
- `src/hooks/useProgress.js` → `src/subjects/phonics/hooks/useProgress.js`

Update all imports. Run `npm run dev`. Commit: `refactor: move hooks to core and phonics subject`.

---

## Step 4 — Move shared components to core

Move:
- `src/components/Jimmy.jsx` → `src/core/components/Jimmy.jsx`
- `src/components/ProfileAvatar.jsx` → `src/core/components/ProfileAvatar.jsx`

Move phonics question components:
- `src/components/PhonemeQuestion.jsx` → `src/subjects/phonics/components/PhonemeQuestion.jsx`
- `src/components/InitialSoundQuestion.jsx` → `src/subjects/phonics/components/InitialSoundQuestion.jsx`
- `src/components/BlendingQuestion.jsx` → `src/subjects/phonics/components/BlendingQuestion.jsx`
- `src/components/SpellingQuestion.jsx` → `src/subjects/phonics/components/SpellingQuestion.jsx`
- `src/components/TrickyWordQuestion.jsx` → `src/subjects/phonics/components/TrickyWordQuestion.jsx`

Update all imports. Run `npm run dev`. Commit: `refactor: move components to core and phonics subject`.

---

## Step 5 — Move screens

Move to `src/core/screens/`:
- `HomeScreen.jsx`, `ShopScreen.jsx`, `SessionSummaryScreen.jsx`
- `ProfileSelectScreen.jsx`, `CreateProfileScreen.jsx`, `ParentAreaScreen.jsx`

Move to `src/subjects/phonics/screens/`:
- `GameScreen.jsx`, `ProgressScreen.jsx`

Update all imports. Run `npm run dev`. Commit: `refactor: move screens to core and phonics subject`.

---

## Step 6 — Move data files

Move to `src/core/data/`:
- `items.js`

Move to `src/subjects/phonics/data/`:
- `phonics.js`, `words.js`, `trickyWords.js`

Move to `src/subjects/phonics/services/`:
- `questionSelector.js`
- `cosmeticSprites.js`

Update all imports. Run `npm run dev`. Commit: `refactor: move data and services to core and phonics subject`.

At this point the `src/` folder should contain only `src/core/`, `src/subjects/`, and any remaining entry point files. Confirm `npm run dev` and the full phonics app works end-to-end: play a session, visit the shop, check the parent area. This is the stability checkpoint.

---

## Step 7 — Create the phonics app entry point

Create `src/apps/phonics/App.jsx` — this is essentially the current `src/App.jsx` with import paths updated to the new locations. It should be identical in behaviour.

Create `src/apps/phonics/main.jsx` — adapted from the current `src/main.jsx`, importing from the new App.jsx path.

Update `index.html` to reference `src/apps/phonics/main.jsx` as its entry point.

Update `vite.config.js` if the entry point reference needs changing.

Run `npm run dev`. Verify phonics works exactly as before. Run `npm run build`. Verify it builds cleanly. Commit: `refactor: extract phonics app entry point`.

---

## Step 8 — Create the maths subject stub

Create the following new files:

**`src/subjects/maths/data/curriculum.js`**
```js
// KS2 maths curriculum topics — to be built out in session 11.
// Topics will cover: number bonds, addition, subtraction, multiplication tables,
// division, fractions, place value (Years 3–6 / ages 7–11).

export const MATHS_TOPICS = []

export function getTopic(id) {
  return MATHS_TOPICS.find(t => t.id === id) ?? null
}
```

**`src/subjects/maths/hooks/useProgress.js`**
```js
// Stub — to be implemented in session 11.
export function useMathsProgress(userId) {
  return {
    progressMap: {},
    recordCorrect: () => {},
    recordWrong: () => {},
    recordPresented: () => {},
  }
}
```

**`src/subjects/maths/components/MathsQuestion.jsx`**
```jsx
// Stub — to be replaced with real question types in session 11.
export default function MathsQuestion({ onCorrect }) {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <p style={{ fontSize: 24, fontWeight: 'bold' }}>Maths questions coming soon!</p>
      <button
        style={{ marginTop: 24, padding: '16px 32px', fontSize: 20, borderRadius: 12 }}
        onClick={onCorrect}
      >
        Continue
      </button>
    </div>
  )
}
```

**`src/subjects/maths/screens/GameScreen.jsx`**

A minimal game screen that renders `MathsQuestion`, calls `pet.onCorrect()` on continue, and fires `onSessionComplete({ correct: 1, total: 1, coinsEarned: 1 })` immediately after. Just enough to prove the flow works end to end.

**`src/subjects/maths/screens/ProgressScreen.jsx`**
```jsx
export default function ProgressScreen({ onBack }) {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <button onClick={onBack} style={{ fontSize: 24 }}>← Back</button>
      <p style={{ marginTop: 32, fontSize: 20 }}>Maths progress coming in session 11.</p>
    </div>
  )
}
```

Commit: `add maths subject stub`.

---

## Step 9 — Create the maths app entry point

**`src/apps/maths/App.jsx`**

A minimal App using the shared core screens (HomeScreen, ShopScreen, SessionSummaryScreen, ProfileSelectScreen, CreateProfileScreen, ParentAreaScreen) wired together exactly like the phonics App.jsx, but with maths GameScreen and ProgressScreen substituted in.

Pass `subject='maths'` to `ProfileSelectScreen` and `CreateProfileScreen` so only maths profiles are shown and created. Pass `userId` from `activeProfile.id` to `usePet` and `useMathsProgress` as normal.

**`src/apps/maths/main.jsx`**

Standard Vite React entry point, imports `src/apps/maths/App.jsx`.

**`maths.html`** (root level, sibling of `index.html`)

Copy of `index.html` with:
- `<title>Jimmy Maths</title>`
- Script src pointing to `src/apps/maths/main.jsx`

Commit: `add maths app entry point`.

---

## Step 10 — Maths Vite config

Create `vite.maths.config.js` at the root. Key differences from `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Jimmy Maths',
        short_name: 'Jimmy Maths',
        description: 'Maths learning with Jimmy the giraffe',
        theme_color: '#4EA8DE',   // blue, distinct from phonics green
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          // reuse the same Jimmy icons for now — swap in session 11 if desired
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist-maths',
  },
  // Tell Vite to use maths.html as the entry HTML
  root: '.',
  // rollupOptions input must point to maths.html
  // See: https://vitejs.dev/guide/build#multi-page-app
})
```

**Important:** the `input` for the maths build must be `maths.html`, not `index.html`. Configure this in `rollupOptions.input` inside the `build` block:

```js
build: {
  outDir: 'dist-maths',
  rollupOptions: {
    input: { app: 'maths.html' },
  },
},
```

Add script to `package.json`:
```json
"build:maths": "vite build --config vite.maths.config.js",
"preview:maths": "vite preview --config vite.maths.config.js --outDir dist-maths"
```

Run `npm run build:maths`. Fix any errors. Run `npm run preview:maths` and open the preview URL — confirm the maths stub renders and the flow works (stub question → summary screen). Commit: `add maths vite config and build script`.

---

## Step 11 — Vercel deployments

### Phonics (existing project)
In the Vercel dashboard, go to the phonics project settings. Verify:
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `/` (repo root)

Trigger a deploy. Confirm it succeeds and the live app works.

### Maths (new project)
In Vercel, click "Add New Project". Import the same GitHub repository. When prompted for settings:
- **Project name:** `jimmy-maths` (or similar)
- **Root directory:** `/` (repo root — not a subdirectory)
- **Build command:** `npm run build:maths`
- **Output directory:** `dist-maths`

Deploy. Navigate to the new URL. Confirm the maths stub renders correctly.

Note both URLs in CLAUDE.md.

---

## Step 12 — Update CLAUDE.md

CLAUDE.md must reflect:

- New folder structure: `src/core/`, `src/subjects/phonics/`, `src/subjects/maths/`, `src/apps/phonics/`, `src/apps/maths/`
- Profile shape now includes `subject: 'phonics' | 'maths'`
- `getProfilesForSubject(subject)` filters profiles by subject — each app only sees its own profiles
- Legacy migration: profiles without a `subject` field default to `'phonics'` on load
- Each profile has its own fully independent pet state, coins, and progress — no sharing between subjects
- Build commands: `npm run build` (phonics → `dist/`), `npm run build:maths` (maths → `dist-maths/`)
- Two Vercel project URLs
- Maths stub structure: what exists, what is deliberately placeholder
- Session 10 in build history
- Notes for session 11: KS2 maths curriculum topics, first question type(s), maths progress tracking, maths ProgressScreen

Commit and push.

---

## Definition of done

- [ ] All phonics files in `src/core/` or `src/subjects/phonics/` — nothing remaining in old flat locations
- [ ] `npm run dev` loads the phonics app correctly
- [ ] Full phonics flow works: profiles, play session, shop, parent area, progress screen
- [ ] `npm run build` produces `dist/` — phonics build clean
- [ ] `npm run build:maths` produces `dist-maths/` — maths build clean
- [ ] Maths stub renders in browser: home screen, stub game session, summary screen
- [ ] Maths profiles are separate from phonics profiles — each app only shows its own
- [ ] Phonics deployed to Vercel and working live
- [ ] Maths deployed to separate Vercel project and working live
- [ ] CLAUDE.md updated with new structure and both URLs
- [ ] All commits pushed

---

## What we are NOT building this session
- Any maths questions or curriculum content — session 11
- New phonics features
- Phase 3 audio recordings
- Animated rewards or streak tracking

---

## Notes for session 11

**Maths subject content** is the main event. Start by defining the curriculum structure in `curriculum.js`. KS2 maths spans Years 3–6 (ages 7–11); a sensible starting point is number bonds and addition/subtraction facts to 20 (Year 3 entry level), gated by mastery before advancing.

The `useMathsProgress` hook should follow the same status pattern as phonics (`unseen → introduced → practising → mastered`) with a parallel `selectNextTopic` function.

The first question type to build is likely a simple arithmetic question: a sum is shown (e.g. `7 + 5 = ?`), the child taps the correct answer from three options. The phonics anti-guessing principle applies unchanged — one attempt, wrong reveals correct.

Consider whether TTS is useful here. Reading "seven plus five equals" aloud could help younger KS2 children. The existing `speak()` infrastructure handles this without needing recorded files — TTS fallback is fine for maths.
