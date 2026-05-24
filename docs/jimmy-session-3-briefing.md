# Jimmy — Session 3 Briefing Prompt

Paste this entire prompt at the start of your third Claude Code session.

---

We are continuing work on Jimmy, a phonics learning PWA for 5–6 year olds. Read CLAUDE.md fully before touching anything. Then run `git status` and `git log --oneline -5` to reorient.

## Pre-session check
Before starting any new work, verify the progression bug is resolved: play through the game and confirm that a third grapheme appears after getting 3 correct answers on 'a'. If it does not, fix it first (the cause is likely `selectNextQuestion` receiving a stale `progressMap` — check the useEffect dependency array in GameScreen). Do not proceed until progression is working.

## Session 3 goals
This session has two parts: (1) restructure the pet system for a Tamagotchi-style virtual pet, and (2) add a second question type. Jimmy is growing beyond a simple energy bar into a persistent creature with needs. The architecture must support this properly — not all features are built yet, but nothing should need undoing.

## Image prep — do this before writing any code

The user has one sprite: a pixel art giraffe with transparent background. This file should be placed at:
```
public/images/jimmy-idle.png
```
Verify the file exists at this path before proceeding. All Jimmy rendering will reference this path. More poses will be added in future sessions (`jimmy-walk-1.png`, `jimmy-walk-2.png`, `jimmy-sleep.png` etc.) — design for this from the start.

## Step 1 — Refactor `usePet` for multiple stats

The existing `usePet` hook only tracks `energy`. Replace it entirely with a richer stat model. Persist everything under `jimmy:{userId}:petState`.

**New state shape:**
```js
{
  energy:  { value: 70, max: 100 },
  hunger:  { value: 80, max: 100 },
  social:  { value: 90, max: 100 },
  coins: 0,
  lastDecayTimestamp: <ISO string>
}
```

**Decay rules** (calculated from `lastDecayTimestamp` on load, same pattern as before):
- Energy: −1 per 5 minutes
- Hunger: −1 per 8 minutes (giraffes are always hungry)
- Social: −1 per 20 minutes
- All stats floor at 0, never go negative

**Reward/penalty rules:**
- Correct answer: +1 coin, +5 energy
- Wrong answer: −3 energy
- Coins never decrease from gameplay (only from the shop, which is not built yet)
- Hunger and social are not yet affected by gameplay — they decay passively only

**Mood** (derived from the average of energy, hunger, and social):
- `"happy"` if average > 60
- `"okay"` if average > 30
- `"sad"` otherwise

**Exposed interface:**
- `stats` — the full state object
- `mood` — derived string
- `onCorrect()` — awards coin + energy
- `onWrong()` — deducts energy

Update CLAUDE.md to reflect the new usePet shape. Commit and push.

## Step 2 — Build the Jimmy habitat

Replace `src/components/Jimmy.jsx` entirely. The habitat is the persistent home for Jimmy on both the home screen and game screen — it will eventually contain a wandering animated sprite.

**Structure:**
- A fixed-height rectangular zone (use `h-48` or similar — approximately 192px)
- A simple two-tone background: sky blue in the upper two-thirds, grass green strip along the bottom
- Jimmy's sprite (`jimmy-idle.png`) sitting on the grass line, horizontally centred for now
- Render Jimmy at a fixed display height of 96px (`h-24`), letting width scale naturally — the image is large so always scale down via CSS, never up
- The component accepts a `pose` prop (default: `"idle"`). For now all poses render `jimmy-idle.png`. When additional images are added later, the component maps pose names to image files here. Add a comment listing the expected future poses: `walking-1`, `walking-2`, `sleep`, `eating`, `happy`, `sad`
- A small coin counter in the top-right corner of the habitat: 🪙 followed by the coin count

**Stat bars** — displayed as a compact row below the habitat (not inside it):
- Three horizontal bars side by side: ⚡ Energy, 🍃 Hunger, 💬 Social
- Each bar fills proportionally to its value/max
- Colours: energy = green, hunger = orange, social = purple
- Keep bars slim (`h-2`) with small emoji labels above — this is secondary UI, not the focal point

Props: `stats`, `mood`, `pose` (default `"idle"`).

Commit and push.

## Step 3 — Second question type: initial sound segmenting

Create `src/components/InitialSoundQuestion.jsx`.

**What it tests:** the child hears a spoken word and must tap the grapheme that represents its first sound. This is the reverse of `PhonemeQuestion` — instead of hearing a phoneme and finding its grapheme, the child hears a whole word and segments its initial phoneme.

**How it works:**
- Receives props: `entry` (the correct phonics entry), `distractors` (2 entry objects), `onCorrect`, `onWrong`, `locked`
- On mount, speaks the example word using TTS: `speak(entry.audioKey + '_word', entry.exampleWords[0])` — this uses TTS fallback to speak the example word naturally (full words sound fine via Web Speech API; this does not need a recorded file)
- Shows a 🔊 button to replay the word
- Displays three grapheme buttons — same layout and behaviour as `PhonemeQuestion`
- Same anti-guessing rules: one attempt, wrong answer reveals correct, no retry

**Note on audio:** the word audio uses `speak(key, fallbackText)` with a key that won't match any `.wav` file, so it will always use TTS fallback to speak the example word. This is intentional and correct — full words via TTS are clear and natural.

Add a short comment at the top of the file explaining the distinction between this question type and `PhonemeQuestion`.

Commit and push.

## Step 4 — Question type mixing in GameScreen

Update `GameScreen.jsx` to alternate between question types.

**Mixing rule:** every 3rd question is an `InitialSoundQuestion`; the rest are `PhonemeQuestion`. This ratio keeps the new type introduced gradually without disrupting the core learning flow. Use `questionIndex % 3 === 2` to determine type.

Both question types use the same `selectNextQuestion` result — the grapheme selection logic does not change. Only the *presentation* of the question changes.

Commit and push.

## Step 5 — Update home screen

Update `HomeScreen.jsx` to use the new `Jimmy` habitat component instead of the plain emoji. The home screen should show:
- The full habitat with Jimmy's idle sprite
- The stat bars below it
- The coin count visible in the habitat
- "Play with Jimmy" button below the stat bars

This means the home screen now gives the child a reason to check in even when not actively playing — they can see Jimmy's stats declining and feel motivated to play.

Commit and push.

## Step 6 — Update CLAUDE.md

By the end of this session CLAUDE.md must reflect:
- The new `usePet` state shape and all stat/decay/reward rules
- The `Jimmy` habitat component and its `pose` prop system
- `InitialSoundQuestion` component and how audio works for it
- The question type mixing rule in GameScreen
- The future pose filenames as a reference for whoever adds the walking animation
- Session 3 added to the build history

Commit and push.

## Definition of done

- [ ] `jimmy-idle.png` is in `public/images/` and renders in the habitat
- [ ] The habitat has a sky/grass background and Jimmy sits on the ground line
- [ ] Three stat bars (energy, hunger, social) are visible and reflect live values
- [ ] Coin counter is visible and increments on correct answers
- [ ] Correct answer: energy goes up, coin count goes up
- [ ] Wrong answer: energy goes down, coins unchanged
- [ ] Stats decay correctly over time (verify by temporarily setting decay interval to 10 seconds, checking values update, then restoring)
- [ ] `InitialSoundQuestion` appears every 3rd question
- [ ] Speaking the word (not the phoneme) plays via TTS when `InitialSoundQuestion` mounts
- [ ] Both question types follow the same anti-guessing rules
- [ ] Home screen shows the habitat, not a plain emoji
- [ ] CLAUDE.md is accurate and updated
- [ ] All changes committed and pushed to GitHub

## What we are NOT building this session

- Walking or sleeping animation (no frames yet)
- Shop or item purchasing
- Hunger/social restoration mechanics
- Session summary screen
- User profiles
- Third question type
- Any backend

## Notes for future sessions

The `pose` prop on `Jimmy.jsx` is the hook for animation. When walk frames are ready, session 4 will add a `useJimmyAnimation` hook that cycles through poses on a timer and passes the current pose down. The habitat container does not need to change — only the image rendered inside it.

The coin/shop economy is intentionally one-way for now (earn only). When the shop is built, it will read `stats.coins` from `usePet` and call a `spendCoins(amount)` function that will be added to the hook at that point.
