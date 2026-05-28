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
  data/        ← phonics curriculum (phonics.js, words.js)
  services/    ← tts.js, storage.js, questionSelector.js
  hooks/       ← usePet.js, useProgress.js, useJimmyAnimation.js
  components/  ← Jimmy.jsx, PhonemeQuestion.jsx, InitialSoundQuestion.jsx, BlendingQuestion.jsx, SpellingQuestion.jsx
  screens/     ← HomeScreen.jsx, GameScreen.jsx, SessionSummaryScreen.jsx, ShopScreen.jsx, ProgressScreen.jsx
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
5. Distractors prefer phonetically confusable graphemes (`CONFUSABLE_PAIRS` map) when introduced; fall back to random introduced graphemes, then Phase 2 fills remaining slots
6. Same-phoneme graphemes are never used as distractors for each other (`PHONEME_ALIASES`): c/k/ck share /k/, f/ff share /f/, l/ll share /l/, s/ss share /s/, z/zz share /z/

Returns `{ entry, distractors, isNew, optionCount }`. `optionCount` is 3 (introduced), 4 (practising), or 5 (mastered) — distractors array length is always `optionCount - 1`.

**Review weighting:** when both `introduced` and `practising` graphemes are available, `introduced` graphemes are selected 70% of the time (vs 30% for `practising`) so recently-seen sounds get more repetition before the child advances.

Also exports `PHONEME_ALIASES` (used by SpellingQuestion to exclude phoneme aliases from distractors).

## Data

### `src/data/phonics.js`
Phase 2 (23 graphemes) and Phase 3 (27 graphemes) from Letters and Sounds. Each entry: `grapheme`, `ttsText`, `phonemeDescription`, `exampleWords`, `phase`, `order`.

Each entry has two audio-related fields:
- `audioKey`: filename stem for `/public/audio/*.wav` (matches grapheme for most; `oo_long` and `oo_short` for the two `oo` entries)
- `ttsText`: fallback text for Web Speech API when the audio file is missing (example word that starts with or clearly features the phoneme)

Always call `speak(entry.audioKey, entry.ttsText)` — never speak the grapheme directly.

**Important:** `oo` appears twice in Phase 3 (orders 17 and 18) with different phonemes ("oo as in moon" vs "oo as in book"). Components accept a full entry object rather than a bare grapheme string to avoid ambiguity. Use `===` reference equality to identify the correct answer.

Per-user grapheme status (`"unseen" | "introduced" | "practising" | "mastered"`) is stored separately via the storage service, not in this file.

### `src/data/items.js`
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
| hat | Top Hat | 30 | ✓ (4-day timed cosmetic, renders as overlay on sprite) |
| scarf | Rainbow Scarf | 25 | session 9 (comingSoon — sprite not yet added) |

Exports `ITEMS` array and `getItem(id)`.

### `src/data/trickyWords.js`
26 high-frequency irregular words from Letters and Sounds, in phase order. Data shape:
```js
{ word: 'the', phase: 2, audioFallback: 'the' }
```
Phase 2 (5): the, to, no, go, I. Phase 3 (12): he, she, we, me, be, was, my, you, they, her, all, are. Phase 4 (9): said, so, do, some, come, were, there, little, one, out.

Exports `TRICKY_WORDS` array and `getTrickyWord(word)`.

### `src/data/words.js`
50 Phase 2 CVC words + 35 Phase 4 CCVC/CVCC words. Each entry:
```js
{ word: "sat", graphemes: ["s", "a", "t"], phase: 2, minIntroduced: 3 }
```
`minIntroduced` gates words behind progression — a word only appears when the child has introduced at least that many Phase 2 graphemes AND all its component graphemes. Phase 4 words additionally require 10+ Phase 2 graphemes at `practising` or `mastered`.

Exports `selectBlendingWord(progressMap)` which returns `{ wordEntry, distractors }` or `null` if fewer than 3 eligible words exist. Used by both `BlendingQuestion` and `SpellingQuestion`.

## Hooks

### `src/hooks/usePet.js`
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
- Energy: −1 per 5 minutes
- Hunger: −1 per 8 min (no food); +ratePerMinute while food active (food: 2/min, 30 min)
- Cleanliness: −1 per 20 min baseline × poop multiplier (×1.5 per poop, stackable); +ratePerMinute while bath active (0.6/min, 20 min)
- Expired `activeItems` pruned each tick

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

### `src/hooks/useProgress.js`
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

Exposes: `progressMap`, `getProgress(grapheme)`, `recordPresented(grapheme)`, `recordCorrect(grapheme)`, `recordWrong(grapheme)`, `trickyWordProgressMap`, `recordTrickyPresented(word)`, `recordTrickyCorrect(word)`, `recordTrickyWrong(word)`.

### `src/services/cosmeticSprites.js`
Maps cosmetic item ids to their overlay sprite paths (`/images/cosmetics/*.png`). Export `getCosmeticSprite(itemId)` → path string or `null`. Add new entries here when new cosmetic sprites arrive.

### `src/hooks/useJimmyAnimation.js`
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

### `src/components/Jimmy.jsx`
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

### `src/components/PhonemeQuestion.jsx`
Props: `entry`, `distractors`, `onCorrect`, `onWrong`, `locked`.
Speaks the phoneme on mount. Shows 🔊 replay. Grapheme buttons in a `flex flex-wrap` row — 3, 4, or 5 buttons depending on `distractors.length`. At 5 options each button gets `flexBasis: calc(33% - 0.5rem)` so they wrap 3+2. One attempt only.

### `src/components/InitialSoundQuestion.jsx`
Props: same as PhonemeQuestion. Child hears a whole word and taps its target grapheme. TTS fallback intentional. Question wording is position-aware via `getSegmentInfo(entry)`:
- Grapheme at start → "What sound is at the beginning of sat?"
- Grapheme at end → "What sound is at the end of duck?"
- Grapheme in middle → "What sound do you hear in rain?"

### `src/components/BlendingQuestion.jsx`
Props: `wordEntry`, `distractors` (2 word objects), `onCorrect`, `onWrong`, `locked`.
Speaks each grapheme's phoneme in sequence (500ms gaps) then speaks the whole word (700ms after last phoneme). Child taps the correct written word from three options. Distractors share at least one grapheme with the target. Same anti-guessing rules.

### `src/components/SpellingQuestion.jsx`
Props: `wordEntry`, `onCorrect`, `onWrong`, `locked`.
Speaks the whole word on mount, then phonemes one by one (800ms gap before phonemes). 🔊 replay button. Picks its own 2 grapheme distractors from Phase 2 (graphemes not in the word).

UI: blank tiles (one per grapheme in `wordEntry.graphemes`) at the top; shuffled grapheme buttons below (word graphemes + 2 distractors, all as individual buttons — duplicates show multiple buttons).

Distractors exclude phoneme aliases of word graphemes (e.g. word has `f` → `ff` not offered as distractor) — imports `PHONEME_ALIASES` from `questionSelector.js`.

Tap handling (per-position, anti-guessing):
- Correct: fills blank green, moves to next position
- Wrong: tapped button flashes red, correct button flashes green for 800ms, correct grapheme auto-fills blank (grey), records error. The wrong button is only consumed (greyed) if its grapheme is NOT needed for a later position — preventing a child from being locked out by tapping a grapheme that appears later in the word.
- Once all positions filled: fires `onCorrect()` if no errors, `onWrong()` if any errors. GameScreen's `advance()` adds the inter-question delay.

### `src/components/TrickyWordQuestion.jsx`
Props: `targetWord` (tricky word object), `distractors` (array of 2 word objects), `onCorrect`, `onWrong`, `locked`.

Two-phase presentation:
- **Phase 1 (1500ms):** target word shown large (`text-6xl font-bold`), TTS speaks it immediately. No buttons.
- **Phase 2:** word shown smaller above 3 vertically-stacked buttons. "Which one did you see?" prompt (parent reads aloud). 🔊 replay button. Shuffled options (target + 2 distractors).

Tap handling: anti-guessing rules — one attempt, wrong reveals correct (green), tapped wrong button highlights red. `onWrong` fires 800ms after wrong tap (for animation). `onCorrect` fires immediately.

## Screens

### `src/screens/HomeScreen.jsx`
Shows Jimmy habitat, "Play with Jimmy" button, 🛍️ shop button (top-right, 64px), ⭐ progress button (top-left, 64px), and reset button (bottom-right, small/hidden).

### `src/screens/GameScreen.jsx`
Main game loop. 10 questions per session (`SESSION_LENGTH = 10`). Tracks `sessionCorrect` and `sessionCoins` via refs (reset on mount). Calls `onSessionComplete({ correct, total, coinsEarned })` after the 10th question.

Question type selection per question (weighted random, evaluated each time, ineligible types get weight 0 and others rescale):
- `PhonemeQuestion`: always eligible — 35%
- `InitialSoundQuestion`: eligible when 2+ graphemes introduced — 20%
- `BlendingQuestion`: eligible when `selectBlendingWord` returns non-null — 15%
- `SpellingQuestion`: eligible when `selectBlendingWord` returns non-null — 15%
- `TrickyWordQuestion`: eligible when `selectNextTrickyWord` returns non-null — 15%

`questionIndex` dep array pattern — see comment in code. `progressMap` intentionally absent; adding it would cause an infinite loop via `recordPresented`.

Holds a `jimmyRef` and calls `jimmyRef.current.react('happy'/'sad')` on answer.
Progress recorded only for phoneme/initial questions — blending and spelling don't map to a single grapheme.
Coin reward is 0 (not 1) when `pet.jimmySleeping`.

### `src/screens/SessionSummaryScreen.jsx`
Shown after 10 questions. Displays Jimmy habitat (static pose based on score), coins earned, a score message, and "Play again" / "Home" buttons.
- ≥ 7 correct → `happy` pose, "Amazing! Jimmy is so happy! 🌟"
- ≥ 4 correct → `idle` pose, "Well done! Keep going! 😊"
- < 4 correct → `sad` pose, "Good try! Practice makes perfect! 💪"

### `src/screens/ShopScreen.jsx`
2-column item grid. Each card shows emoji, name, cost. States: available (tappable), can't afford (cost in red), already active/owned (greyed, labelled), coming soon (greyed, no price). Tapping an available card shows a confirmation modal (emoji, name, cost, Buy/Cancel). On confirm calls `pet.purchaseItem(itemId)`. Flash message on success/failure. Calls `usePet` internally (same as HomeScreen).

### `src/screens/ProgressScreen.jsx`
Shows all Phase 2 and Phase 3 graphemes in Letters and Sounds order, colour-coded by status: grey = unseen, yellow = learning (introduced), orange = practising, green = mastered. Summary count chips at the top (Learning / Practising / Mastered). Graphemes laid out in a 6-column grid per phase. Uses `useProgress(GUEST.id)` directly — read-only, no game logic. Accessible via ⭐ button on HomeScreen.

## Navigation
React state in `App.jsx` (`screen`: `"home"` | `"game"` | `"summary"` | `"shop"` | `"progress"`). No router library.

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
- **Session 5:** New sprites (happy, sad, 6-frame walk cycle); items.js catalogue; usePet extended with activeItems/inventory/purchaseItem; habitat renders placed items with expiry fade; ShopScreen; shop button on HomeScreen; fixed summary screen showing stale stats (stats/mood now passed through onSessionComplete)
- **Session 6:** Poop generation (45–90 min intervals, max 3, random x); cleanliness decay multiplier per poop (×1.5 stackable); PoopItem with CSS smell animation; poop tap with shovel ownership check + toast; bath activated as placed consumable (0.6/min, 20 min); shovel activated (permanent tool); cosmetics changed to 4-day timed items (not permanent); coin economy rebalanced (cosmetic prices increased)
- **Session 7:** Shovel durability (10 uses, use count display, legacy migration); stat bar direction arrows (▲▼►); empty-bar consequences (sleep pose, sluggish wander, grubby filter, faster poops, halved coins); confusable distractor engine (CONFUSABLE_PAIRS); dynamic option count (3/4/5 by mastery, flex-wrap buttons); 35 Phase 4 CCVC/CVCC words; SpellingQuestion component; question weights updated to 40/20/20/20; sleep/dirty/hat sprites processed
- **Session 8:** Cosmetic overlays (hat renders on Jimmy's head, flips with direction, sprite wrapper pattern); `cosmeticSprites.js` service; `overlayStyle` in items.js; hat unlocked, scarf still comingSoon; cosmetics excluded from habitat floor rendering and hidden when sleeping; 26 tricky words in `trickyWords.js`; tricky word progress tracking in `useProgress.js` (separate storage key, unseen→seen→familiar→known); `TrickyWordQuestion` component (1500ms presentation phase); question weights 35/20/15/15/15; `selectNextTrickyWord` exported from useProgress; decay system rebuilt with `pendingDecay` fractional accumulation (all stats now work correctly in real time); food rate 2/min; `introduced` graphemes weighted 70% in question selection; `ProgressScreen` showing all grapheme statuses; spelling bug fixes (alias exclusion from distractors, grapheme-needed-later not consumed on wrong tap); stat bar numeric values; `saveReward` preserves decay timestamp

## Coming in session 9
- **User profiles:** profile selection screen on launch, create profile flow (name + colour picker), per-profile storage (already keyed by userId). Guest profile stays as migration fallback — on first launch after this session, if guest data exists offer it as a profile to keep. Consider a parent/settings area accessible via long-press on home screen (view progress, reset profile, manage profiles).
- **Scarf cosmetic:** remove `comingSoon` from scarf in `items.js` once `public/images/cosmetics/scarf.png` is added. Tune `overlayStyle` position with `?cosmeticDebug=1`.
