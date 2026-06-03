# Jimmy Phonics — Project Briefing

## Overview
A phonics learning PWA for children aged 5–6, guided by a parent or teacher. Teaches reading using systematic synthetic phonics following the Letters and Sounds / ELS methodology.

- **Core mechanic:** hear a phoneme, tap the correct grapheme (3–5 options scaling with mastery)
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
  core/
    components/   ← Jimmy.jsx, ProfileAvatar.jsx, TestModeSplash.jsx
    data/         ← items.js
    hooks/        ← usePet.js, useJimmyAnimation.js, useProfiles.js
    screens/      ← HomeScreen.jsx, ParentAreaScreen.jsx, SessionSummaryScreen.jsx,
                     ShopScreen.jsx, ProfileSelectScreen.jsx, CreateProfileScreen.jsx
    services/     ← tts.js, storage.js, sounds.js
  subjects/
    phonics/
      components/ ← PhonemeQuestion.jsx, InitialSoundQuestion.jsx, BlendingQuestion.jsx,
                     SpellingQuestion.jsx, TrickyWordQuestion.jsx, ReadingQuestion.jsx
      data/       ← phonics.js, words.js, trickyWords.js
      hooks/      ← useProgress.js
      screens/    ← GameScreen.jsx, ProgressScreen.jsx
      services/   ← questionSelector.js, cosmeticSprites.js
    maths/        ← separate subject (curriculum.js, TimesTableQuestion, DivisionQuestion,
                     GameScreen, ProgressScreen, questionSelector.js, useProgress.js)
  apps/
    phonics/      ← App.jsx + main.jsx (standalone phonics PWA entry)
    maths/        ← App.jsx + main.jsx (standalone maths PWA entry)
  App.jsx         ← root app (combined entry)
  main.jsx
```

## Services

### `src/core/services/tts.js`
Exported `speak(audioKey, fallbackText)` function. Plays `/audio/${audioKey}.wav` first; falls back to Web Speech API speaking `fallbackText` if the file is missing or fails. Web Speech API: prefers Google `en-GB` voice, rate 0.82, 100ms iOS delay. **Never call `speechSynthesis` or `new Audio()` directly in a component.**

Recorded `.wav` files live in `public/audio/`. All 50 graphemes have recordings — TTS fallback is used for whole words (blending/spelling) and all tricky words.

Voices are cached at module load via `voiceschanged` event so `getBestVoice()` never sees an empty list. Voice preference order: Google en-GB → any en-GB → any en-* → first available. This fixes TTS silence on devices where `getVoices()` returns empty on first call.

The cancel function returned by `speak()` clears both the Audio element and any pending TTS timer (100ms delay). Always use it as a `useEffect` cleanup. `speakBlending` in `BlendingQuestion` tracks cancel functions from all started `speak()` calls so `cancelAll` stops active audio, not just pending timeouts.

### `src/core/services/sounds.js`
Non-speech audio feedback. Exports `playCorrectSound()` — plays a short ascending two-note chime (C5 → G5, ~600ms total) via Web Audio API. Reuses a single `AudioContext` instance across calls. Called from `GameScreen.handleCorrect()` on every correct answer. Errors are silently swallowed — audio is non-critical.

### `src/core/services/storage.js`
Wrapper around localStorage that always namespaces reads and writes by `userId` using the key pattern `jimmy:{userId}:{suffix}`. All persisted state must be keyed by `userId`.

### `src/subjects/phonics/services/questionSelector.js`
Exports `selectNextQuestion(progressMap)`. Determines which grapheme to ask next using these rules (in priority order):
1. Work through Phase 2 graphemes in Letters and Sounds order; don't start Phase 3 until 6 Phase 2 graphemes are `practising` or `mastered`
2. A new grapheme is introduced only when **zero** `introduced` graphemes remain — every seen grapheme must have consolidated to `practising` or `mastered` first. This prevents the child from accumulating an overwhelming backlog of new sounds.
3. After introducing a new grapheme, interleave it with review of `introduced` and `practising` graphemes
4. `mastered` graphemes appear ~1 in 10 questions as maintenance review
5. Distractors prefer phonetically confusable graphemes (`CONFUSABLE_PAIRS` map) when introduced; fall back to random introduced graphemes, then Phase 2 fills remaining slots
6. Same-phoneme graphemes are never used as distractors for each other (`PHONEME_ALIASES`): c/k/ck share /k/, f/ff share /f/, l/ll share /l/, s/ss share /s/, z/zz share /z/

Returns `{ entry, distractors, isNew, optionCount }`. `optionCount` is 3 (introduced), 4 (practising), or 5 (mastered) — distractors array length is always `optionCount - 1`.

**Review weighting:** when both `introduced` and `practising` graphemes are available, `introduced` graphemes are selected 70% of the time (vs 30% for `practising`) so recently-seen sounds get more repetition before the child advances.

Also exports `PHONEME_ALIASES` (used by SpellingQuestion to exclude phoneme aliases from distractors).

## Data

### `src/subjects/phonics/data/phonics.js`
Phase 2 (23 graphemes) and Phase 3 (27 graphemes) from Letters and Sounds. Each entry: `grapheme`, `ttsText`, `phonemeDescription`, `exampleWords`, `phase`, `order`.

Each entry has two audio-related fields:
- `audioKey`: filename stem for `/public/audio/*.wav` (matches grapheme for most; `oo_long` and `oo_short` for the two `oo` entries)
- `ttsText`: fallback text for Web Speech API when the audio file is missing (example word that starts with or clearly features the phoneme)

Always call `speak(entry.audioKey, entry.ttsText)` — never speak the grapheme directly.

**Important:** `oo` appears twice in Phase 3 (orders 17 and 18) with different phonemes ("oo as in moon" vs "oo as in book"). Components accept a full entry object rather than a bare grapheme string to avoid ambiguity. Use `===` reference equality to identify the correct answer.

Per-user grapheme status (`"unseen" | "introduced" | "practising" | "mastered"`) is stored separately via the storage service, not in this file.

### `src/core/data/items.js`
Shop catalogue. Single source of truth for all purchasable items.

Data shape per item:
```js
{
  id: 'food',
  name: 'Leaves',
  description: 'Jimmy loves leaves!',
  type: 'consumable',      // 'consumable' | 'tool' | 'cosmetic'
  cost: 3,
  sprite: '/images/items/food.png',
  emoji: '🍃',
  effect: { stat: 'hunger', ratePerMinute: 2, duration: 30 },
  maxActive: 1,
  consumedOnUse: true,
  comingSoon: true,        // present only on stub items — remove to unlock
  overlayStyle: { top: '2%', left: '8%', width: '32%' }, // cosmetics only
}
```

`overlayStyle` positions the cosmetic overlay `<img>` relative to the Jimmy sprite container (percentage values). Only present on cosmetic items. Scarf has `overlayStyle` defined but remains `comingSoon: true` until its sprite arrives.

Current catalogue:
| id | name | cost | active |
|---|---|---|---|
| food | Leaves | 8 | ✓ (placed consumable, 2/min hunger, 30 min) |
| bath | Bath Time | 10 | ✓ (placed consumable, 0.6/min cleanliness, 20 min) |
| shovel | Shovel | 20 | ✓ (tool, 10 uses, enables poop removal; `maxUses: 10`) |
| tree | Acacia Tree | 20 | ✓ (decoration, 4 days, `spriteHeightPx: 240, bottomPx: -20`) |
| sign | Signpost | 15 | ✓ (decoration, 4 days, `spriteHeightPx: 160`) |
| wateringhole | Watering Hole | 20 | ✓ (decoration, 4 days, `bottomPx: 8`) |
| sun | Sunshine | 15 | ✓ (sky decoration, 4 days, `layer: 'sky'`, static) |
| cloud | Fluffy Cloud | 12 | ✓ (sky decoration, 4 days, `layer: 'sky', animated: 'drift'`, max 2, drifts R→L) |
| ball | Bouncy Ball | 10 | ✓ (ground decoration, 4 days, `interactive: 'bounce'`, bounces when Jimmy near) |
| hat | Top Hat | 30 | ✓ (4-day timed cosmetic, renders as overlay on sprite) |
| scarf | Rainbow Scarf | 25 | ✓ (4-day timed cosmetic, overlay on sprite) |

**Decoration type:** habitat floor items with duration but no stat effect. Rendered by `HabitatItem` like consumables. Item definition supports `spriteHeightPx` (default 32) and `bottomPx` (default 32) to control size and ground position.

**Item rendering routing in Jimmy.jsx** — based on item definition properties:
- `layer: 'sky'` + `animated: 'drift'` → `CloudItem` (CSS `cloudDrift` keyframe, unique speed/height per instance via instanceId seed)
- `layer: 'sky'` (no animated) → `SkyItem` (static, positioned at `top: 6%`)
- `interactive: 'bounce'` → `BallItem` (receives `jimmyX` from `anim.x`; `ballBounce` keyframe plays when `|jimmyX − ball.x| < 14`)
- Everything else → `HabitatItem` (ground, existing behaviour)

Exports `ITEMS` array and `getItem(id)`.

### `src/subjects/phonics/data/trickyWords.js`
26 high-frequency irregular words from Letters and Sounds, in phase order. Data shape:
```js
{ word: 'the', phase: 2, audioFallback: 'the' }
```
Phase 2 (5): the, to, no, go, I. Phase 3 (12): he, she, we, me, be, was, my, you, they, her, all, are. Phase 4 (9): said, so, do, some, come, were, there, little, one, out.

Exports `TRICKY_WORDS` array and `getTrickyWord(word)`.

### `src/subjects/phonics/data/words.js`
50 Phase 2 CVC words + 35 Phase 4 CCVC/CVCC words. Each entry:
```js
{ word: "sat", graphemes: ["s", "a", "t"], phase: 2, minIntroduced: 3 }
```
`minIntroduced` gates words behind progression — a word only appears when the child has introduced at least that many Phase 2 graphemes AND all its component graphemes. Phase 4 words additionally require 10+ Phase 2 graphemes at `practising` or `mastered`.

Exports `selectBlendingWord(progressMap)` which returns `{ wordEntry, distractors }` or `null` if fewer than 3 eligible words exist. Used by both `BlendingQuestion` and `SpellingQuestion`.

## Hooks

### `src/core/hooks/usePet.js`
Persisted under `jimmy:{userId}:petState`. State shape:
```js
{
  energy:      { value: 70, max: 100 },
  hunger:      { value: 80, max: 100 },
  cleanliness: { value: 90, max: 100 },
  coins: 0,
  lastDecayTimestamp: <ISO string>,
  pendingDecay: { energy: 0, hunger: 0, cleanliness: 0 }, // fractional remainders
  activeItems: [
    // { instanceId, itemId, x: 10–80, placedAt: ISO, expiresAt: ISO }
  ],
  inventory: {
    tools: [{ id: 'shovel', usesRemaining: 10 }],  // objects, not strings
    cosmetics: [],
  },
  poops: [],         // [{ id, x: 5–85, placedAt: ISO }]
  nextPoopAt: null,  // ISO — when next poop will appear
}
```
Decay and effects (applied on mount and via 10s live tick):
- Energy: −70 pts per 24 h (≈ −1 per 20.6 min)
- Hunger: −50 pts per 24 h (≈ −1 per 28.8 min, no food); +ratePerMinute while food active (food: 2/min, 30 min)
- Cleanliness: −20 pts per 24 h baseline (≈ −1 per 72 min) × poop multiplier (×1.5 per poop, stackable); +ratePerMinute while bath active (0.6/min, 20 min)
- Expired `activeItems` pruned each tick

Implemented as `DAY_MS / pts_per_day / T` interval per point, where `T` is the time-compression factor (1 in production, higher in test mode).

**Fractional accumulation:** `pendingDecay` carries sub-integer remainders forward across ticks so slow stats (cleanliness, hunger) accumulate correctly even when faster stats (energy) reset the timestamp. `applyDecay` always updates `lastDecayTimestamp`. The tick always persists state but only re-renders when visible values change.

**`saveReward`** (internal): used by `onCorrect`/`onWrong` — persists without changing `lastDecayTimestamp` or `pendingDecay`, so game answers don't disrupt the accumulation clock.

Poop generation:
- `nextPoopAt` initialised to 45–90 min from first load (22–45 min when `cleanliness.value === 0`)
- Each tick: if `Date.now() >= nextPoopAt` and `poops.length < 3`, add poop at random x (5–85); always advance `nextPoopAt`

Cleanliness decay multiplier: 0 poops = ×1.0, 1 = ×1.5, 2 = ×2.25, 3 = ×3.375

Reward/penalty:
- Correct: +1 coin (0 when `jimmySleeping`), +3 energy
- Wrong: −3 energy

`mood` derived from average of energy/hunger/cleanliness: `"happy"` > 60, `"okay"` > 30, `"sad"` otherwise. If `hunger.value === 0`, mood is forced to `"sad"`.

**Empty-bar consequences:**
- Energy ≤ 25 (`jimmySleeping`): Jimmy shows `sleep` pose with `animate-pulse`, 💤 badge in habitat top-left, coin reward → 0
- Hunger ≤ 25 (sluggish): Jimmy barely wanders (1-in-2 rest chance, ±1 step); at 0 mood forced `"sad"`
- Cleanliness = 0: green-tinted sepia CSS filter on sprite, poop interval halved (22–45 min)

**Tool shape:** `inventory.tools` is an array of `{ id, usesRemaining }`. Legacy string arrays are migrated on load.

Tool helpers (internal to hook, also exposed):
- `hasTool(id)` → boolean
- `getToolUses(id)` → number | null

`removePoop(id)` removes the poop, awards +5 cleanliness, and decrements the shovel's `usesRemaining` (removing it when 0). Caller must check `hasTool('shovel')` before calling.

Exposes: `stats`, `mood`, `jimmySleeping`, `onCorrect(coinReward?)`, `onWrong()`, `canAfford(itemId)`, `canPurchase(itemId)`, `purchaseItem(itemId)`, `removePoop(id)`, `hasTool(id)`, `getToolUses(id)`

`canPurchase` returns `{ canBuy, reason }`. Reasons: `insufficient_coins`, `already_active`, `already_owned` (tool with uses > 0), `coming_soon`. Tools with `usesRemaining === 0` can be repurchased.
`purchaseItem` for tools pushes `{ id, usesRemaining: def.maxUses ?? 10 }`.

### `src/subjects/phonics/hooks/useProgress.js`
Per-user, per-grapheme progress stored under `jimmy:{userId}:graphemeProgress`. Tricky word progress stored separately under `jimmy:{userId}:trickyWordProgress`.

**Grapheme state shape:**
```js
{ status: "unseen"|"introduced"|"practising"|"mastered", correctCount: 0, lastSeen: null }
```
Transitions: `unseen → introduced` on first presentation; `introduced → practising` at 3 correct; `practising → mastered` at 7 correct. Wrong answers don't regress status.

**Tricky word state shape (per word):**
```js
{ status: "unseen"|"seen"|"familiar"|"known", correctCount: 0, lastSeen: null }
```
Transitions: `unseen → seen` on first presentation; `seen → familiar` at 3 correct; `familiar → known` at 7 correct.

**Phase gating for tricky words:** Phase 3 words unlock when 3 Phase 2 words are `familiar`/`known`. Phase 4 words unlock when 3 Phase 3 words are `familiar`/`known`.

**`selectNextTrickyWord(trickyProgressMap)`** — exported standalone function (not a hook method). Returns `{ targetWord, distractors: [word, word] }` or `null` if no eligible words. Prefers words not yet `familiar`; 70% chance of targeting the current unfamiliar word, 30% review of seen pool. Distractors come from seen words first, then upcoming unseen words.

Exposes: `progressMap`, `getProgress(grapheme)`, `recordPresented(grapheme)`, `recordCorrect(grapheme)`, `recordWrong(grapheme)`, `setGraphemeStatus(grapheme, status)`, `trickyWordProgressMap`, `recordTrickyPresented(word)`, `recordTrickyCorrect(word)`, `recordTrickyWrong(word)`, `setTrickyWordStatus(word, status)`.

`setGraphemeStatus` / `setTrickyWordStatus` are admin helpers used by the editable ProgressScreen. They set both `status` and a representative `correctCount` (mastered→7, practising/familiar→3, introduced/seen→1, unseen→0).

### `src/subjects/phonics/services/cosmeticSprites.js`
Maps cosmetic item ids to their overlay sprite paths (`/images/cosmetics/*.png`). Export `getCosmeticSprite(itemId)` → path string or `null`. Add new entries here when new cosmetic sprites arrive.

### `src/core/hooks/useJimmyAnimation.js`
Drives Jimmy's movement and pose independently of game logic. Internal state:
```js
{ pose, direction: 'left'|'right', x: 5–90, mode: 'wandering'|'resting'|'reacting' }
```
- Accepts optional `sluggish` boolean parameter (pass `stats.hunger.value <= 25` from Jimmy)
- Ticks every 400ms: cycles `walk-1` through `walk-6`, moves x ±2 (±1 when sluggish), bounces at 5 and 90
- 1-in-25 chance per tick of switching to `resting` (1-in-2 when sluggish); pose: `idle`, 1.5–3s pause
- `react(pose)`: sets mode to `reacting`, holds pose for 1200ms, then resumes `wandering`
- Exposes: `{ pose, direction, x, react }`

## Components

### `src/core/components/Jimmy.jsx`
The Jimmy habitat. Uses `useJimmyAnimation` internally. Exposed via `forwardRef` + `useImperativeHandle` so callers can call `ref.current.react(pose)` to trigger reactions without managing animation state.

A fixed-height (`h-48`) rectangular zone with sky-blue background and green grass strip. Jimmy's sprite is absolutely positioned at `left: ${x}%` with `transition: left 0.4s linear`. Direction flipping uses `transform: scaleX(-1)` — no separate right-facing sprites needed.

Sprite mapping (all fall back to `jimmy-idle.png` via `onError`):
```
idle     → jimmy-idle.png      (required — must exist)
walk-1…6 → jimmy-walk-1…6.png
happy    → jimmy-happy.png
sad      → jimmy-sad.png
sleep    → jimmy-sleep.png
```
Drop new sprites into `public/images/` and they appear automatically with no code changes.

Optional `pose` prop overrides animation (used by SessionSummaryScreen for a static pose). `jimmySleeping` (`energy <= 25`) overrides all animation to `sleep` pose with `animate-pulse` class. Sleep sprite is 95×140px at `bottom: 0` (portrait sprite — taller than wide).

Coin counter (🪙) in top-right corner, with shovel use count (🪣 N) beside it — amber at ≤3 uses, red at ≤1, hidden when not owned. Three slim stat bars below: ⚡ Energy (green), 🍃 Hunger (orange), 🛁 Cleanliness (purple), each with a small direction arrow (▲ green = rising, ▼ red = falling, ► grey = stable) computed by `getStatDirection(statName, stats, poops)`. Numeric value shown beside each bar emoji.

💤 badge shown top-left when `energy <= 25`. Sprite receives `filter: 'sepia(0.9) hue-rotate(60deg) brightness(0.7) saturate(1.8)'` (green-tinted sepia) when `cleanliness === 0`.

**Cosmetic overlays:** active cosmetic items (`type === 'cosmetic'` in `stats.activeItems`) are rendered as `<img>` overlays inside a `position: relative; display: inline-block` wrapper around the sprite. The wrapper carries all movement/flip/animation styles (previously on the `<img>` directly), so `scaleX(-1)` direction flip applies to both sprite and overlays automatically. Overlay position comes from `def.overlayStyle` (percentage-based `top/left/width`). `onError` hides missing overlay sprites gracefully. `?cosmeticDebug=1` URL param renders red bounding boxes instead of images for position tuning. Cosmetics are **not rendered when `jimmySleeping`**. Cosmetic `activeItems` are also excluded from the habitat floor `HabitatItem` loop (they render on the sprite, not the ground).

Active items from `stats.activeItems` are rendered as absolutely positioned elements on the grass at their stored `x` position, behind Jimmy (lower z-index). Items fade to `opacity-50` when >70% through their lifetime. Item sprite tried first, falls back to emoji.

Props: `stats`, `mood`, `pose` (optional override), `poops` (array of poop objects), `onPoopTap` (callback called with poop id).

Poop rendering: `PoopItem` component — a 64px min-size button at `poop.x%` on the grass. Shows three animated `~` smell chars (CSS keyframe `smell`, staggered 0.4s delays, float upward and fade) above the 💩 emoji. Smell keyframes injected via `<style>` tag once in the habitat. No sprite needed — pure CSS + emoji.

Toast pattern (HomeScreen and GameScreen): `{ message, x }` state, absolutely positioned above habitat at `left: ${x}%`, auto-dismissed after 1500ms via `setTimeout`.

### `src/subjects/phonics/components/PhonemeQuestion.jsx`
Props: `entry`, `distractors`, `onCorrect`, `onWrong`, `locked`.
Speaks the phoneme on mount. Shows 🔊 replay. Grapheme buttons in a `flex flex-wrap` row — 3, 4, or 5 buttons depending on `distractors.length`. At 5 options each button gets `flexBasis: calc(33% - 0.5rem)` so they wrap 3+2. One attempt only.

### `src/subjects/phonics/components/InitialSoundQuestion.jsx`
Props: same as PhonemeQuestion. Child hears a whole word and taps its target grapheme. TTS fallback intentional. Question wording is position-aware via `getSegmentInfo(entry)`:
- Grapheme at start → "What sound is at the beginning of sat?"
- Grapheme at end → "What sound is at the end of duck?"
- Grapheme in middle → "What sound do you hear in rain?"

### `src/subjects/phonics/components/BlendingQuestion.jsx`
Props: `wordEntry`, `distractors` (2 word objects), `onCorrect`, `onWrong`, `locked`.
Speaks each grapheme's phoneme in sequence (500ms gaps) then speaks the whole word (700ms after last phoneme). Child taps the correct written word from three options. Distractors share at least one grapheme with the target. Same anti-guessing rules.

### `src/subjects/phonics/components/SpellingQuestion.jsx`
Props: `wordEntry`, `onCorrect`, `onWrong`, `locked`.
Speaks the whole word on mount, then phonemes one by one (800ms gap before phonemes). 🔊 replay button. Picks its own 2 grapheme distractors from Phase 2 (graphemes not in the word).

UI: blank tiles (one per grapheme in `wordEntry.graphemes`) at the top; shuffled grapheme buttons below (word graphemes + 2 distractors, all as individual buttons — duplicates show multiple buttons).

Distractors exclude phoneme aliases of word graphemes (e.g. word has `f` → `ff` not offered as distractor) — imports `PHONEME_ALIASES` from `questionSelector.js`.

Tap handling (per-position, anti-guessing):
- Correct: fills blank green, moves to next position
- Wrong: tapped button flashes red, correct button flashes green for 800ms, correct grapheme auto-fills blank (grey), records error. The wrong button is only consumed (greyed) if its grapheme is NOT needed for a later position — preventing a child from being locked out by tapping a grapheme that appears later in the word.
- Once all positions filled: fires `onCorrect()` if no errors, `onWrong()` if any errors. GameScreen's `advance()` adds the inter-question delay.

### `src/subjects/phonics/components/TrickyWordQuestion.jsx`
Props: `targetWord` (tricky word object), `distractors` (array of 2 word objects), `status` (`"seen"|"familiar"|"known"`, default `"seen"`), `onCorrect`, `onWrong`, `locked`.

Two-phase presentation:
- **Phase 1 (1500ms):** target word shown large (`text-6xl font-bold`), TTS speaks it immediately. No buttons.
- **Phase 2:** 3 vertically-stacked word buttons. `showWord` (`status === 'seen'`) displays the target word above the buttons — hidden when familiar/known to test recall. 🔊 replay button. Shuffled options (target + 2 distractors).

Options computed via `useMemo([targetWord.word])` (not `useRef`) so they recompute if `targetWord` changes after mount — prevents a StrictMode double-effect-run from showing a stale word in the presentation that is absent from the options.

Tap handling: anti-guessing rules — one attempt, wrong reveals correct (green), tapped wrong button highlights red. `onWrong` fires 800ms after wrong tap (for animation). `onCorrect` fires immediately.

## Screens

### `src/core/screens/HomeScreen.jsx`
Shows Jimmy habitat, "Play with Jimmy" button, 🛍️ shop button (top-right, 64px), ⭐ progress button (top-left, 64px), and reset button (bottom-right, small/hidden). Long-press ⚙️ bottom-left (800ms) opens `ParentAreaScreen`.

### `src/subjects/phonics/components/ReadingQuestion.jsx`
Props: `wordEntry`, `distractors` (2 word objects), `onCorrect`, `onWrong`, `locked`.

Two-phase interaction. The only question type where the child **reads** rather than listens — tests decoding.

**Phase 1 — auto-play sequence:** On mount, shuffles [target, distractor1, distractor2] into a random order. Plays all three via TTS (`speak('', word)`) in sequence with 1200ms between each. A numbered indicator (1/2/3) pulses on the currently-playing slot. Phase 2 begins after all three have played (~3600ms total).

**Phase 2 — answer columns:** Shows the target word large (`text-5xl font-bold`) above three side-by-side columns. Each column has:
1. **🔊 speaker button** (top) — replays that slot's word, no commitment, can tap freely
2. **↑ select button** (bottom, min-h-16) — submits the answer; locks all buttons

Wrong: correct column highlights green, tapped column red; `onWrong` fires 800ms later. Correct: `onCorrect` fires immediately. "Hear all again" button replays the full sequence from the top.

No grapheme progress is recorded — like BlendingQuestion, this tests whole words.

### `src/subjects/phonics/screens/GameScreen.jsx`
Main game loop. 10 questions per session (`SESSION_LENGTH = 10`). Tracks `sessionCorrect` and `sessionCoins` via refs (reset on mount). Calls `onSessionComplete({ correct, total, coinsEarned, stats, mood })` after the 10th question.

Question type selection per question (weighted random, evaluated each time, ineligible types get weight 0 and others rescale):
- `PhonemeQuestion`: always eligible — 30%
- `InitialSoundQuestion`: eligible when 2+ graphemes introduced — 20%
- `BlendingQuestion`: eligible when `selectBlendingWord` returns non-null — 15%
- `SpellingQuestion`: eligible when `selectBlendingWord` returns non-null — 15%
- `TrickyWordQuestion`: eligible when `selectNextTrickyWord` returns non-null — 10%
- `ReadingQuestion`: eligible when `selectBlendingWord` returns non-null — 10%

`questionIndex` dep array pattern — see comment in code. `progressMap` intentionally absent; adding it would cause an infinite loop via `recordPresented`.

Holds a `jimmyRef` and calls `jimmyRef.current.react('happy'/'sad')` on answer. Calls `playCorrectSound()` immediately on correct answer.
Progress recorded only for phoneme/initial questions — blending, spelling, and reading don't map to a single grapheme.
Coin reward is 0 (not 1) when `pet.jimmySleeping`.

### `src/core/screens/SessionSummaryScreen.jsx`
Shown after 10 questions. Displays Jimmy habitat (static pose based on score), coins earned, a score message, and "Play again" / "Home" buttons.
- ≥ 7 correct → `happy` pose, "Amazing! Jimmy is so happy! 🌟"
- ≥ 4 correct → `idle` pose, "Well done! Keep going! 😊"
- < 4 correct → `sad` pose, "Good try! Practice makes perfect! 💪"

### `src/core/screens/ShopScreen.jsx`
2-column item grid. Each card shows emoji, name, cost. States: available (tappable), can't afford (cost in red), already active/owned (greyed, labelled), coming soon (greyed, no price). Tapping an available card shows a confirmation modal (emoji, name, cost, Buy/Cancel). On confirm calls `pet.purchaseItem(itemId)`. Flash message on success/failure. Calls `usePet` internally (same as HomeScreen).

### `src/subjects/phonics/screens/ProgressScreen.jsx`
Read-only (⭐ button from HomeScreen) and editable (parent admin "Edit Progress") views.

**Graphemes section:** Phase 2 and Phase 3 graphemes in curriculum order, 6-column grid, colour-coded — grey=unseen, yellow=introduced, orange=practising, green=mastered. Summary chip row above (Learning / Practising / Mastered counts).

**Tricky words section:** Phase 2, 3, and 4 tricky words, 4-column grid, same colour scheme — grey=unseen, yellow=seen, orange=familiar, green=known. Separate summary chip row (Seen / Familiar / Known counts).

In editable mode (`editable` prop): tapping any grapheme tile cycles `unseen→introduced→practising→mastered`; tapping any tricky word tile cycles `unseen→seen→familiar→known`. Title becomes "Edit Progress", hint "Tap any tile to cycle its status".

### `src/core/screens/ParentAreaScreen.jsx`
Bottom-sheet modal. Opened from HomeScreen via long-press ⚙️ (800ms). Buttons: Switch Profile, Edit Progress (→ editable ProgressScreen), Reset Progress (confirm), Delete Profile (confirm). Profile colour dot + name shown at top.

## Maths subject

### `src/subjects/maths/data/curriculum.js`
11 times table topics in UK National Curriculum teaching order. Each topic:
```js
{ id: 'times_3', label: '3 times table', phase: 2, order: 4, type: 'times_table', b: 3, minFactor: 1, maxFactor: 12 }
```
Phase ordering: Phase 1 (×2, ×5, ×10), Phase 2 (×3, ×4), Phase 3 (×6, ×7, ×8), Phase 4 (×9, ×11, ×12).

### `src/subjects/maths/hooks/useProgress.js`
Exports `useMathsProgress(userId)`. Storage key: `mathsProgress`. Same `unseen → introduced → practising → mastered` model as phonics (thresholds: 3 correct → practising, 7 → mastered). Exposes: `progressMap`, `recordPresented(topicId)`, `recordCorrect(topicId)`, `recordWrong(topicId)`, `setTopicStatus(topicId, status)`.

### `src/subjects/maths/services/questionSelector.js`
**`selectNextTopic(progressMap)`** — returns the next times table topic using the same introduced-first, no-new-while-introduced pacing as phonics. Mastered maintenance at 1 in 10.

**`generateQuestion(topic, status, kind, format)`** — returns a question object.
- `kind: 'times_table'` → options are **products** (correct: `fact.answer`; distractors: products from adjacent factors in the same table)
- `kind: 'division'` → options are **factors** (correct: `fact.a`; distractors: adjacent factors clamped to `minFactor`–`maxFactor`)
- `optionCount` = 3 when introduced, 4 when practising/mastered
- `format` (division only): `'division'` | `'missing-factor'` — chosen randomly in GameScreen

Fact shape: `{ a, b, answer }` where `a × b = answer`. `b` is always the table being practised (`topic.b`). `a` is the randomly chosen factor.

### `src/subjects/maths/components/TimesTableQuestion.jsx`
Props: `fact`, `options`, `onCorrect`, `onWrong`, `locked`.
Displays `b × a = ?` or `a × b = ?` (randomly) in `text-5xl font-bold`. TTS on mount via `factToSpeech(fact)`: `"b times a, equals"`. Answer options are products; 4-option layout wraps 2+2. Exports `factToSpeech` for use in `DivisionQuestion`.

### `src/subjects/maths/components/DivisionQuestion.jsx`
Props: `fact`, `format`, `options`, `onCorrect`, `onWrong`, `locked`.
- Format `'division'`: displays `answer ÷ b = ?`, TTS `"answer divided by b, equals"`
- Format `'missing-factor'`: displays `b × ? = answer` (? in amber), TTS `"b times what, equals answer"`
Both formats test the same value — `fact.a` (the factor). Options are factors, not products.

### `src/subjects/maths/screens/GameScreen.jsx`
Mirrors phonics GameScreen. `usePet` + `useMathsProgress`. Jimmy reactions. Poop handling. 10-question sessions. `onSessionComplete({ correct, total, coinsEarned, stats, mood })`.

Question selection per question:
- `selectNextTopic` chooses the topic
- If topic status is `practising` or `mastered`: 60% `TimesTableQuestion`, 40% `DivisionQuestion`
- If topic status is `introduced`: 100% `TimesTableQuestion` (division not eligible yet)
- Division format chosen randomly 50/50 each time

Progress recorded via `recordCorrect(topicId)` / `recordWrong(topicId)` regardless of question kind — multiplication and division practice both count towards the same topic.

### `src/subjects/maths/screens/ProgressScreen.jsx`
Times table list grouped by phase. Each topic shown as a full-width button colour-coded by status (grey/yellow/orange/green). Summary chip row (Learning / Practising / Mastered). Editable mode (parent area) taps cycle the status. Correct count shown alongside each practising/mastered topic.

## Navigation
React state in `App.jsx` (`screen`: `"home"` | `"game"` | `"summary"` | `"shop"` | `"progress"` | `"editProgress"` | `"profiles"` | `"createProfile"`). No router library.

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

## Branch strategy
- **`dev`** — active development branch. All code changes go here.
- **`test`** — stable branch for phone/device testing. Promote from `dev` when a feature is ready to test: `git checkout test && git merge dev && git push && git checkout dev`
- **`main`** — future production/release branch (not yet in active use)
- Never commit directly to `test` or `main`

## Test mode
Append `?testMode=1` to the app URL to compress all pet timings by 300× (minutes become seconds). Works on any build including the deployed PWA — no code change or rebuild required. Implemented in `usePet.js` via `URLSearchParams`. Remove the param to return to normal speed.

## Session build history
- **Session 1:** Scaffold, CLAUDE.md, tts + storage services, phonics data, usePet, PhonemeQuestion, basic App wiring
- **Session 2:** TTS voice selection + iOS fix, Jimmy component, useProgress (full), questionSelector, GameScreen, HomeScreen, App navigation; fixed stale-closure question auto-advance bug; fixed progression gate (removed per-session cap, replaced with practising-status check); added ttsText to all phonics entries + word-by-word TTS pacing; recorded .wav files for all 50 graphemes; fixed StrictMode double-audio (AbortError guard + fallbackCalled flag)
- **Session 3:** Refactored usePet to multi-stat model (energy, hunger, cleanliness, coins); replaced Jimmy emoji with habitat component (sprite, sky/grass, stat bars, coin counter); added InitialSoundQuestion; question type mixing (every 3rd question); updated HomeScreen to show habitat
- **Session 4:** useJimmyAnimation hook (wandering/resting/reacting); animated Jimmy with forwardRef reactions; words.js with 50 Phase 2 CVC words; BlendingQuestion (phoneme-by-phoneme audio); weighted question type mixing (50/25/25); 10-question session tracking; SessionSummaryScreen
- **Session 5:** New sprites (happy, sad, 6-frame walk cycle); items.js catalogue; usePet extended with activeItems/inventory/purchaseItem; habitat renders placed items with expiry fade; ShopScreen; shop button on HomeScreen; fixed summary screen showing stale stats (stats/mood now passed through onSessionComplete)
- **Session 6:** Poop generation (45–90 min intervals, max 3, random x); cleanliness decay multiplier per poop (×1.5 stackable); PoopItem with CSS smell animation; poop tap with shovel ownership check + toast; bath activated as placed consumable (0.6/min, 20 min); shovel activated (permanent tool); cosmetics changed to 4-day timed items (not permanent); coin economy rebalanced (cosmetic prices increased)
- **Session 7:** Shovel durability (10 uses, use count display, legacy migration); stat bar direction arrows (▲▼►); empty-bar consequences (sleep pose, sluggish wander, grubby filter, faster poops, halved coins); confusable distractor engine (CONFUSABLE_PAIRS); dynamic option count (3/4/5 by mastery, flex-wrap buttons); 35 Phase 4 CCVC/CVCC words; SpellingQuestion component; question weights updated to 40/20/20/20; sleep/dirty/hat sprites processed
- **Session 8:** Cosmetic overlays (hat renders on Jimmy's head, flips with direction, sprite wrapper pattern); `cosmeticSprites.js` service; `overlayStyle` in items.js; hat unlocked, scarf still comingSoon; cosmetics excluded from habitat floor rendering and hidden when sleeping; 26 tricky words in `trickyWords.js`; tricky word progress tracking in `useProgress.js` (separate storage key, unseen→seen→familiar→known); `TrickyWordQuestion` component (1500ms presentation phase); question weights 35/20/15/15/15; `selectNextTrickyWord` exported from useProgress; decay system rebuilt with `pendingDecay` fractional accumulation (all stats now work correctly in real time); food rate 2/min; `introduced` graphemes weighted 70% in question selection; `ProgressScreen` showing all grapheme statuses; spelling bug fixes (alias exclusion from distractors, grapheme-needed-later not consumed on wrong tap); stat bar numeric values; `saveReward` preserves decay timestamp; decay rates rebalanced (energy −70/day, hunger −50/day, cleanliness −20/day); introduction pacing tightened (`canIntroduceNew` now requires zero `introduced` graphemes before unlocking next sound)
- **Session 9:** Dev/test branch strategy (`dev` → `test` → `main`); `?testMode=1` URL param replaces hardcoded flag; test mode splash screen (prominent normal-mode escape, small continue link); user profiles (`ProfileSelectScreen`, create with colour picker, guest data auto-migration, profile indicator on HomeScreen); parent settings panel (long-press ⚙️ bottom-left 800ms — switch profile, reset progress, delete profile, edit graphemes); grapheme editor (`setGraphemeStatus` in `useProgress`, editable `ProgressScreen` — tap tiles to cycle unseen→introduced→practising→mastered); scarf cosmetic unlocked (flood-fill background removal, `overlayStyle` tuned); full folder restructure into `src/core/` / `src/subjects/phonics/` / `src/apps/`
- **Session 10:** Notification hooks (Stop + Notification events → Windows balloon tips); fixed TrickyWordQuestion bug where presented word was absent from options (StrictMode double-effect-run: switched `useRef` to `useMemo([targetWord.word])`); `sounds.js` service with `playCorrectSound()` (C5→G5 Web Audio chime, called on every correct answer); tricky words added to ProgressScreen (Phase 2/3/4 grids, own summary counts, editable); `setTrickyWordStatus` added to `useProgress`; ParentAreaScreen "Edit Graphemes" → "Edit Progress"

## Maths Vercel deployment
The maths app builds with `npm run build:maths` → `dist-maths/index.html`. To deploy it, create a separate Vercel project pointing to the same repo with these settings:
- **Framework preset:** Vite
- **Build command:** `npm run build:maths`
- **Output directory:** `dist-maths`
- **Root directory:** (repo root)

The main phonics deployment uses the default `npm run build` → `dist/`.

- **Session 11:** Flowers/rainbow/balloon habitat items (PNG background removal, `RainbowItem` at horizon, `BalloonItem` state-machine shuttle 90s cross + 45s wait, sky-before-ground render order); item placement collision avoidance (`pickX`); test-mode "Remove All Items" button in shop; profile subject routing — `src/App.jsx` shows all profiles and routes to phonics or maths screens based on `profile.subject`; `CreateProfileScreen` shows subject picker (📚/🔢) when no `defaultSubject` given; `useProfiles` supports null subject (returns all profiles); maths Vercel deployment documented
- **Session 12:** Maths subject fully implemented — 11 times table topics (×2–×12, UK curriculum order), `TimesTableQuestion` (products as options, TTS, 3/4 options by mastery), `DivisionQuestion` (two formats: `answer ÷ b = ?` and `b × ? = answer`, factor-based options, 60/40 weighting with TimesTable once practising/mastered), `useMathsProgress` + `questionSelector` mirroring phonics pacing; phonics `ReadingQuestion` added (auto-play sequence then 🔊/↑ column layout, no grapheme progress recorded); phonics question weights updated to 30/20/15/15/10/10; `SessionSummaryScreen` made safe when `stats` absent (maths summary shows score without Jimmy habitat)

## Notes for session 13
- **Addition and subtraction** — next maths question type. Track progress by difficulty band (Band 1: sums to 10, Band 2: sums to 20, Band 3: two-digit without carrying, Band 4: two-digit with carrying). Generate facts programmatically; same mastery model per band.
- **Difficulty calibration** — rolling 20-question window per subject per profile. If correct rate > 85%, accelerate new topic introduction. If < 55%, pause and consolidate. Show rolling rate in parent area.
