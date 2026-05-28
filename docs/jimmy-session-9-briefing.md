# Jimmy — Session 9 Briefing Prompt

Paste this entire prompt at the start of your ninth Claude Code session.

---

We are continuing work on Jimmy, a phonics learning PWA for 5–6 year olds. Read CLAUDE.md fully before touching anything. Then run `git status` and `git log --oneline -5` to reorient.

## Pre-session checks

**1. Verify session 8 is complete:**
- Hat appears on Jimmy's head as he wanders and flips with direction
- Scarf is listed in the shop as "Coming Soon"
- TrickyWordQuestion appears during gameplay
- Word shown large for 1500ms before buttons appear
- Tricky word progress saved to localStorage separately from grapheme progress
- Question weights are 35 / 20 / 15 / 15 / 15

**2. Background removal.** Run `ls -lh public/images/` and `ls -lh public/images/cosmetics/`. Remove backgrounds from any new sprites using the established PIL/Pillow approach. Commit cleaned files before any other work.

---

## Session 9 goals

Two features: (1) user profiles — multiple children can each have their own Jimmy, with separate progress and pet state; (2) a parent area — a lightly hidden screen where a parent can reset individual grapheme progress, manage profiles, and toggle test mode on mobile. The data layer already supports multiple users (all state is keyed by `userId`), so the work is almost entirely UI and navigation.

---

## Architecture overview

Two new **global** localStorage keys (not userId-namespaced — they live outside any profile):

```
jimmy:profiles       — JSON array of profile objects
jimmy:activeProfileId — string, the id of the currently active profile
```

Profile shape:
```js
{
  id: string,        // UUID (or 'guest' for migrated legacy data)
  name: string,      // e.g. "Ella"
  colour: string,    // hex colour for avatar background, e.g. '#4EA8DE'
  createdAt: ISO,
}
```

Everything else stays exactly as it is. `usePet(userId)`, `useProgress(userId)`, and `storage.js` already namespace by `userId` — no changes needed to any of those hooks.

---

## Step 1 — `useProfiles` hook

Create `src/hooks/useProfiles.js`.

```js
const PROFILES_KEY     = 'jimmy:profiles'
const ACTIVE_KEY       = 'jimmy:activeProfileId'
const AVATAR_COLOURS   = ['#FF6B6B','#FFA554','#FFD93D','#6BCF7F','#4EA8DE','#B388FF']
```

State: `profiles` (array), `activeProfile` (object or null).

On mount:
- Read `jimmy:profiles` from localStorage (parse, default to `[]`)
- Read `jimmy:activeProfileId` (default to `null`)
- Set state; if `activeProfileId` references a profile that no longer exists, clear it

Exposed functions:
- `createProfile({ name, colour })` — generates a UUID id, pushes to `jimmy:profiles`, persists, returns the new profile object
- `createGuestProfile({ name, colour })` — same as `createProfile` but forces `id: 'guest'`. Used only during migration (see Step 3).
- `setActiveProfile(id)` — writes `jimmy:activeProfileId`, updates state
- `deleteProfile(id)` — removes from array, persists; if it was active, clears `jimmy:activeProfileId`

Export `AVATAR_COLOURS` for use in the colour picker UI.

Commit and push.

## Step 2 — `ProfileAvatar` component

Create `src/components/ProfileAvatar.jsx`.

A small reusable component used in several places. Renders a filled circle with the first letter of the profile name centred in white bold text.

Props: `profile` (object), `size` (number, default 48), `onPress` (optional).

```jsx
<div
  style={{
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundColor: profile.colour,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: onPress ? 'pointer' : 'default',
  }}
  onClick={onPress}
>
  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: size * 0.4 }}>
    {profile.name[0].toUpperCase()}
  </span>
</div>
```

Commit and push.

## Step 3 — `ProfileSelectScreen` and `CreateProfileScreen`

### `ProfileSelectScreen`

Create `src/screens/ProfileSelectScreen.jsx`.

Shown when `jimmy:activeProfileId` is null or missing on app load. It is **not** accessible during normal play — it only appears at launch.

Layout:
- Friendly heading: "Who's playing today?"
- Grid of existing profiles, each shown as a large `ProfileAvatar` (size 80) with the name below. Minimum 64px touch target.
- Tapping a profile calls `setActiveProfile(id)` — App.jsx then transitions to `"home"`
- A large "+ Add player" card in the same grid style (dashed border, `+` symbol)
- Tapping "+ Add player" transitions App.jsx to `"createProfile"`

### Guest data migration

`ProfileSelectScreen` should check on mount: is `jimmy:profiles` empty AND does any key matching `jimmy:guest:` exist in localStorage? If so, show a migration banner above the grid:

> "Welcome back! Jimmy remembers your progress. Give this player a name to keep it."

With a "Set up" button that goes to `CreateProfileScreen` in migration mode (see below).

If profiles exist already, never show the migration banner.

### `CreateProfileScreen`

Create `src/screens/CreateProfileScreen.jsx`.

Props: `migrating` (boolean, default false), `onCreated(profile)`, `onCancel`.

Layout:
- Heading: "Create a player" (or "Keep your progress" if `migrating`)
- Name input (large, `text-2xl`), placeholder "Player's name"
- Colour picker: 6 coloured circles (`AVATAR_COLOURS`), tapping selects that colour (selected gets a white ring)
- Live preview: `ProfileAvatar` updates as name/colour change
- "Create" button (disabled until name is non-empty)
- Back/Cancel button

On "Create":
- If `migrating`: call `createGuestProfile({ name, colour })` so the new profile id is `'guest'` and all existing localStorage data under `jimmy:guest:*` is automatically picked up
- Otherwise: call `createProfile({ name, colour })`
- Call `setActiveProfile(newProfile.id)`
- Call `onCreated(newProfile)` — App.jsx transitions to `"home"`

Commit and push.

## Step 4 — Wire App.jsx

`App.jsx` is the source of truth for navigation and the active profile.

**Changes needed:**

1. Call `useProfiles()` at the top of `App.jsx`. 

2. On mount (or whenever `activeProfile` changes to null): if `activeProfile` is null, set screen to `"profileSelect"`. Otherwise default to `"home"`.

3. Pass `userId={activeProfile?.id ?? 'guest'}` to `usePet` and `useProgress` (and anywhere else `userId` is currently hardcoded as `"guest"`).

4. Add new screen states: `"profileSelect"`, `"createProfile"`, `"parentArea"`.

5. Render the correct screen component based on `screen` state.

The profile-aware `userId` is the **only** data-layer change — all hooks continue to work unchanged.

**Updated navigation map:**
```
"profileSelect"  → ProfileSelectScreen
"createProfile"  → CreateProfileScreen
"home"           → HomeScreen
"game"           → GameScreen
"summary"        → SessionSummaryScreen
"shop"           → ShopScreen
"progress"       → ProgressScreen
"parentArea"     → ParentAreaScreen
```

Commit and push.

## Step 5 — Profile switcher on HomeScreen

Add a `ProfileAvatar` (size 44) to the top-centre of `HomeScreen`, showing the active profile.

Tapping it opens a compact **profile switcher modal** (inline, not a full screen). The modal shows:
- All existing profiles as a horizontal row of `ProfileAvatar` components (size 64), each tappable
- Tapping a different profile: `setActiveProfile(id)`, close modal
- A small `+` button at the end of the row to go to `"createProfile"`
- Tapping the currently active profile: close modal (no-op)

The modal should be a simple centred overlay with a semi-transparent backdrop. Keep it lightweight — this is not the primary flow.

Commit and push.

## Step 6 — Parent area access

Add a small ⚙️ settings button to `HomeScreen`. Position it in the **bottom-left corner**, small (`text-sm`, approximately 36×36px touch target — intentionally below the 64px minimum for child-facing elements). Use muted grey colour so it does not catch a child's eye.

Tapping it navigates to `"parentArea"`.

**Do not** hide it behind a tap count or long-press — the user has said "easy but not in the front of the app." A small, visually quiet but always-present button in the corner is the right balance. A parent who has been told it exists will find it immediately; a child absorbed in play will not seek it out.

Commit and push.

## Step 7 — `ParentAreaScreen`

Create `src/screens/ParentAreaScreen.jsx`.

This screen receives `activeProfile`, `profiles`, `setActiveProfile`, and `userId` as props (or can call `useProfiles()` directly).

### Layout (single scrollable screen, no tabs)

**Header:** "Parent settings" (plain text, not styled as a game element). Back arrow (←) returns to `"home"`.

---

### Section 1: Profiles

A list of all profiles. Each row: `ProfileAvatar` (size 40) + name + (if it's the active profile) a "✓ Active" badge.

Each row has a **"Delete"** button (small, muted red). Deleting a profile shows a confirmation: "Delete [name]? This will permanently remove all their progress." On confirm, call `deleteProfile(id)`. If the deleted profile was active, App.jsx will fall through to `"profileSelect"`.

A **"+ Add player"** button at the bottom of the list → navigate to `"createProfile"`.

---

### Section 2: Reset progress for [active profile name]

**Sub-section A — Reset individual graphemes:**

Show all Phase 2 and Phase 3 graphemes in a grid (same layout as `ProgressScreen` — colour-coded by status). 

Tapping a grapheme that is not `"unseen"` opens a small confirmation prompt (inline, not a modal): 
> "Reset '[grapheme]' to unseen for [name]?"
> [Reset] [Cancel]

On confirm: call a new exposed function `resetGrapheme(grapheme)` on `useProgress` (see below). The grid updates immediately.

Graphemes that are already `"unseen"` show as greyed out and are not tappable (no point resetting something unseen).

**Sub-section B — Reset all grapheme progress:**

A button: "Reset all phonics progress for [name]". Requires a two-step confirm:
1. First tap: button turns red, label changes to "Tap again to confirm — this cannot be undone"
2. Second tap (within 3s): calls `resetAllGraphemes()`
3. If 3s elapses without second tap: button reverts

**Sub-section C — Reset tricky word progress:**

Same pattern: "Reset tricky word progress for [name]" — two-step confirm, calls `resetTrickyWords()`.

**Sub-section D — Full profile reset:**

"Reset everything for [name]" — same two-step confirm, calls both `resetAllGraphemes()` and `resetTrickyWords()`, then also resets pet state by calling a new `resetPetState()` on `usePet`.

---

### Section 3: Test mode

Show current state: "Test mode: ON" (green) or "Test mode: OFF" (grey).

Explanation (small text): "Test mode compresses time by 300×. Decay and poop happen in seconds. Scoped to this profile only."

A button: "Turn test mode ON" / "Turn test mode OFF". 

Implementation: test mode is read from `?testMode=1` in the URL. On button press, rebuild the URL with or without the param and call `window.location.href = newUrl` (a page reload is acceptable here — parents are not mid-session). The app reloads on the correct screen (home) with the new test mode state.

A **TEST badge** should also be added to `HomeScreen` and `GameScreen` — a small fixed pill in the top-centre reading "TEST MODE" in amber, visible only when `?testMode=1` is present. This makes it obvious to a parent that test mode is active.

Commit and push.

## Step 8 — New `useProgress` functions

Add three new exported functions to `useProgress.js`:

**`resetGrapheme(grapheme)`** — resets the specific grapheme entry back to `{ status: 'unseen', correctCount: 0, lastSeen: null }` for the current user. Persists immediately.

**`resetAllGraphemes()`** — clears the entire `jimmy:{userId}:graphemeProgress` key from localStorage, resetting all graphemes to unseen. Resets internal state.

**`resetTrickyWords()`** — clears `jimmy:{userId}:trickyWordProgress`.

Add one new function to `usePet.js`:

**`resetPetState()`** — clears `jimmy:{userId}:petState`, resetting the pet to factory defaults (same initial state as a brand new user). Jimmy gets full stats again, empty inventory, no poops.

These are destructive operations — hence the two-step confirm in the UI — but there is no soft undo. Keep the implementations simple.

Commit and push.

## Step 9 — Update CLAUDE.md

CLAUDE.md must reflect:

- Global storage keys: `jimmy:profiles` (array) and `jimmy:activeProfileId`
- Profile shape: `{ id, name, colour, createdAt }`
- `AVATAR_COLOURS` constant (6 hex values) in `useProfiles.js`
- `useProfiles` hook: `profiles`, `activeProfile`, `createProfile`, `createGuestProfile`, `setActiveProfile`, `deleteProfile`
- `ProfileAvatar` component (size prop, colour circle, first letter)
- `ProfileSelectScreen`: shown on launch when no active profile; guest migration banner
- `CreateProfileScreen`: name + colour picker; migration mode creates profile with `id: 'guest'`
- `App.jsx`: `userId` now comes from `activeProfile.id` (not hardcoded `'guest'`); new screen states
- Profile switcher: `ProfileAvatar` in HomeScreen header → inline modal
- Parent area: ⚙️ bottom-left of HomeScreen; small but always visible
- `ParentAreaScreen`: profiles list, grapheme reset grid, two-step full resets, test mode toggle
- `resetGrapheme`, `resetAllGraphemes`, `resetTrickyWords` on `useProgress`
- `resetPetState` on `usePet`
- TEST MODE badge on HomeScreen/GameScreen when `?testMode=1`
- Test mode note: already scoped per profile (userId-keyed state); parent area toggle reloads page with/without param
- Session 9 in build history
- Notes for session 10: sentence reading (display a short CVC sentence, child taps words in order); scarf cosmetic (remove comingSoon when sprite arrives)

Commit and push.

---

## Definition of done

- [ ] App shows ProfileSelectScreen on first launch (no active profile)
- [ ] "Who's playing today?" shows existing profile avatars, each tappable to activate
- [ ] Guest migration banner appears when profiles is empty but guest data exists
- [ ] CreateProfileScreen: name input, 6-colour picker, live avatar preview
- [ ] Guest migration: creates profile with id 'guest', picks up all existing data automatically
- [ ] Profile avatar (size 44) visible on HomeScreen
- [ ] Tapping avatar opens profile switcher modal with all profiles
- [ ] Switching profiles changes the active userId passed to all hooks
- [ ] ⚙️ button bottom-left of HomeScreen, small and visually quiet
- [ ] ParentAreaScreen accessible via ⚙️ button
- [ ] Profiles list in parent area: shows all profiles, delete with confirmation
- [ ] Grapheme grid in parent area: colour-coded status, tap to reset individual grapheme (with confirmation)
- [ ] "Reset all phonics" two-step confirm works and clears all grapheme progress
- [ ] "Reset tricky words" two-step confirm works
- [ ] "Reset everything" clears grapheme progress, tricky words, AND pet state
- [ ] Test mode toggle in parent area shows current state
- [ ] Toggling test mode reloads page with/without ?testMode=1
- [ ] TEST MODE amber badge visible on HomeScreen and GameScreen when test mode active
- [ ] Each profile's game data is fully independent (playing as Profile A does not affect Profile B)
- [ ] CLAUDE.md updated and accurate
- [ ] All committed and pushed

---

## What we are NOT building this session
- Sentence reading — session 10
- Scarf cosmetic (no sprite yet)
- Parent PIN protection (keep it simple for now)
- Any backend or authentication

---

## Notes for session 10

**Sentence reading** is the next new question type. Display a short 3–4 word sentence using Phase 2 CVC words the child has mastered (e.g. "the cat sat"). TTS reads it aloud. Child taps each word in the sentence in left-to-right order. One tap per word, wrong tap reveals correct. Add a small `src/data/sentences.js` with 20–30 sentences gated by `minMastered` count. Consider a `SentenceQuestion` component following the same per-position anti-guessing pattern as `SpellingQuestion`.

**Scarf cosmetic:** when `public/images/cosmetics/scarf.png` arrives, remove `comingSoon: true` from the scarf entry in `items.js`. The `overlayStyle` is already defined. Tune position using `?cosmeticDebug=1` if needed.
