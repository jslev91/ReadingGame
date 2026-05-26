# Jimmy — Session 7 Briefing Prompt

Paste this entire prompt at the start of your seventh Claude Code session.

---

We are continuing work on Jimmy, a phonics learning PWA for 5–6 year olds. Read CLAUDE.md fully before touching anything. Then run `git status` and `git log --oneline -5` to reorient.

## Pre-session checks

**1. Verify session 6 is complete:**
- Poop appears in habitat, smell animation visible
- Shovel purchasable and removes poop
- Bath placed in habitat and restores cleanliness
- Cleanliness decays faster with multiple poops present

**2. Background removal.** Run `ls -lh public/images/` and `ls -lh public/images/items/`. Remove backgrounds from any new sprites using the established PIL/Pillow approach. Commit cleaned files before any other work.

**3. Sleep sprite.** Check if `public/images/jimmy-sleep.png` exists. If so, it will be used automatically. If not, the existing idle fallback remains — no action needed.

---

## Session 7 goals

Six improvements in this session: (1) shovel durability with visible use count, (2) stat bar direction indicators, (3) consequences for empty bars, (4) confusable distractors to make existing questions harder, (5) dynamic option counts based on mastery, (6) a new spelling/segmenting question type. Plus Phase 4 words if time allows.

---

## Step 1 — Shovel durability

**Update `inventory.tools` shape in `usePet.js`.** Change from an array of strings to an array of objects:
```js
tools: [{ id: 'shovel', usesRemaining: 10 }]
```

Add three helper functions (internal to the hook, not exposed):
- `hasTool(id)` — returns boolean
- `getToolUses(id)` — returns `usesRemaining` or `null` if not owned
- `useTool(id)` — decrements `usesRemaining`; if it reaches 0, removes the tool from the array entirely (child must repurchase)

Update `purchaseItem` for tools: instead of pushing the id string, push `{ id, usesRemaining: item.maxUses ?? 10 }`. Add `maxUses: 10` to the shovel entry in `items.js`.

Update `removePoop`: after removing the poop, call `useTool('shovel')` internally.

Update `canPurchase`: if a tool is already owned (`hasTool(id)` is true), return `{ canBuy: false, reason: 'already_owned' }` — unless `usesRemaining === 0`, in which case allow repurchase.

**Update the caller check in habitat poop tap handler.** Replace `inventory.tools.includes('shovel')` with `hasTool('shovel')`. Expose `hasTool` and `getToolUses` from the hook.

**Display remaining uses in habitat.** In `Jimmy.jsx`, when `hasTool('shovel')` is true, show a small indicator in the habitat — position it near the coin counter: `🪣 {getToolUses('shovel')}`. When the shovel has 3 or fewer uses remaining, show the count in amber. When 1 use remaining, show in red. When 0: the shovel is gone and the indicator disappears.

Commit and push.

## Step 2 — Stat bar direction indicators

Add a directional arrow to each stat bar label in `Jimmy.jsx`.

**Add a helper function `getStatDirection(statName, stats, activeItems)`** that returns `'up'`, `'down'`, or `'stable'`:
- `'up'` — a relevant active item is providing a net positive rate (food for hunger, bath for cleanliness). Energy never goes up passively so energy is never `'up'`.
- `'stable'` — net rate is approximately zero (item rate roughly cancels decay). Use ±0.1/min as the stable threshold.
- `'down'` — stat is decaying (default for all stats with no active item)

**Render in stat bars:**
- `'up'` → small green `▲` after the emoji label
- `'down'` → small red `▼` after the emoji label
- `'stable'` → small grey `►` after the emoji label

Keep the arrows small (`text-xs`) — they are informational, not focal. The bars themselves carry the main meaning.

Commit and push.

## Step 3 — Empty bar consequences

Three independent consequences, one per stat. None of these block the child from playing.

**Energy = 0 — Jimmy sleeps:**
- In `usePet`: expose `jimmySleeping` boolean (`energy.value === 0`)
- In `Jimmy.jsx`: if `jimmySleeping`, force pose to `'sleep'` (overrides animation), apply a subtle `animate-pulse` class to the sprite (slow CSS pulse to suggest breathing)
- Show a small `💤` badge in the top-left of the habitat
- In `GameScreen.jsx`: if `jimmySleeping`, halve the coin reward on correct answers (round down, minimum 0). Do not change energy rewards or penalties.
- Energy recovers normally from correct answers — the child can play their way out of this state

**Hunger = 0 — Jimmy is listless:**
- In `usePet`: `mood` calculation — if `hunger.value === 0`, force mood to `'sad'` regardless of other stats
- In `useJimmyAnimation`: accept a `sluggish` prop (boolean). When true, increase the resting probability from 1-in-25 to 1-in-5 per tick, and reduce movement speed (x change from ±2 to ±1). Jimmy barely wanders.
- Pass `sluggish={stats.hunger.value === 0}` from wherever the habitat is rendered

**Cleanliness = 0 — Jimmy is grubby:**
- In `Jimmy.jsx`: when `stats.cleanliness.value === 0`, apply `style={{ filter: 'sepia(0.4) brightness(0.85)' }}` to the sprite `<img>`. Jimmy looks visually grimy.
- In `usePet` poop generation: when `cleanliness.value === 0`, halve the `nextPoopAt` interval (22–45 min instead of 45–90 min). A filthy habitat attracts more mess.

Commit and push.

## Step 4 — Confusable distractor engine

Update `src/services/questionSelector.js` to prefer phonetically confusable distractors.

**Add a `CONFUSABLE_PAIRS` map:**
```js
const CONFUSABLE_PAIRS = {
  'b':  ['d', 'p'],
  'd':  ['b', 'g'],
  'p':  ['b', 't'],
  'm':  ['n'],
  'n':  ['m'],
  'f':  ['v', 'th'],
  'v':  ['f'],
  's':  ['z', 'c'],
  'z':  ['s'],
  'sh': ['ch', 's'],
  'ch': ['sh', 'j'],
  'th': ['f', 'v', 's'],
  'j':  ['ch', 'g'],
  'ai': ['ee', 'oa'],
  'ee': ['ai', 'ea'],
  'igh':['i', 'ie'],
  'oa': ['ow', 'o'],
  'oo_long': ['oo_short', 'oa'],
  'oo_short': ['oo_long', 'u'],
  'ar': ['or', 'er'],
  'or': ['ar', 'aw'],
  'er': ['ar', 'ir'],
  'ow': ['oa', 'ou'],
  'oi': ['oy', 'ow'],
  'ear':['air', 'er'],
  'air':['ear', 'ar'],
}
```

**Update distractor selection logic:** when choosing distractors, first check if any of the correct grapheme's confusable pairs have been `introduced` or above. If yes, prefer these as distractors. If not enough confusable pairs are available, fall back to the existing logic (random introduced graphemes). Never use same-phoneme aliases as distractors (existing `PHONEME_ALIASES` rule still applies).

This change makes existing questions harder automatically as the child progresses, without any UI changes.

Commit and push.

## Step 5 — Dynamic option count

Scale the number of answer options based on the correct grapheme's mastery status.

**Add an `optionCount` field to the question selection result** from `selectNextQuestion`:
```js
return {
  entry,
  distractors,
  optionCount: getOptionCount(progressMap, entry)
}
```

`getOptionCount` returns:
- `3` — grapheme is `introduced`
- `4` — grapheme is `practising`
- `5` — grapheme is `mastered`

When `optionCount` is 4 or 5, `selectNextQuestion` must return the appropriate number of distractors. Update distractor selection to support up to 4 distractors (5 total options).

**Update `PhonemeQuestion.jsx` and `InitialSoundQuestion.jsx`** to accept an `optionCount` prop and render the correct number of buttons. The buttons should remain `flex-1` and wrap gracefully at 5 options — use a `flex-wrap` layout so they don't become too small on mobile. Minimum 64px touch target still applies.

`BlendingQuestion` stays at 3 word options regardless — reading three words is already cognitively demanding.

Commit and push.

## Step 6 — Phase 4 words

Add Phase 4 (CCVC and CVCC) words to `src/data/words.js`.

Phase 4 uses only Phase 2 and Phase 3 graphemes in adjacent consonant clusters. Add at least 30 entries with `phase: 4` and appropriate `minIntroduced` values. Only include words where all component graphemes exist in `phonics.js`.

Examples of CCVC words (blend at start): stop, frog, slip, drip, flag, grip, plug, snap, spin, trip, crab, drum, flat, glad, plan, slim, slug, slab, skip, step.

Examples of CVCC words (blend at end): belt, bend, best, bump, damp, felt, fist, gust, held, hint, jump, kept, lamp, left, lend, lift, list, lost, lump, mend, mist, mint, nest, past, pond, rest, rust, sand, sent, silk, sink, tank, tent, test, tilt, told, tuck, vest, wind, wink.

Add `phase: 4` as a filter option in `selectBlendingWord` and `SpellingQuestion` — Phase 4 words should only appear once the child has at least 10 graphemes at `practising` or `mastered`.

Commit and push.

## Step 7 — Spelling/segmenting question type

Create `src/components/SpellingQuestion.jsx`.

**What it tests:** the child hears a word spoken and must tap the graphemes in the correct order to spell it. This is the productive inverse of `BlendingQuestion` — instead of recognising a word from sounds, they must recall and sequence individual graphemes.

**How it works:**
- Props: `wordEntry`, `onCorrect`, `onWrong`, `locked`
- On mount: speak the whole word via TTS (`speak('', wordEntry.word)`), then after 800ms speak it again phoneme by phoneme (same pattern as `BlendingQuestion`)
- Show a `🔊` replay button
- Display the word as blank tiles at the top: `[ _ ] [ _ ] [ _ ]` — one blank per grapheme in `wordEntry.graphemes`
- Display shuffled grapheme buttons below: the correct graphemes plus 2 distractors from introduced graphemes
- The child taps graphemes one at a time to fill the blanks left-to-right

**Tap handling (one attempt per position, anti-guessing preserved):**
- Correct tap: grapheme fills the current blank with a green highlight, move to next blank
- Wrong tap: tapped button flashes red, correct button for this position flashes green for 800ms, the correct grapheme auto-fills the blank, move to next blank. Track that an error occurred.
- Once all blanks are filled: if zero errors → `onCorrect()`. If any errors → `onWrong()`. Either way, wait 1000ms then callback fires.

**Layout notes:**
- Blank tiles should be large and clearly spaced — use `min-w-12 h-12` or similar
- Filled blanks show the grapheme text in the same bold font as the question buttons
- The grapheme buttons below should remain large (64px) and be greyed out once tapped (to show they've been used)

Commit and push.

## Step 8 — Wire SpellingQuestion into GameScreen

Update `GameScreen.jsx` question type selection.

`SpellingQuestion` is eligible when `selectBlendingWord` returns non-null (same condition as `BlendingQuestion`) — they draw from the same word pool.

**Updated weights (4 types now):**
- `PhonemeQuestion`: 40%
- `InitialSoundQuestion`: 20%
- `BlendingQuestion`: 20%
- `SpellingQuestion`: 20%

Redistribute weights proportionally if a type is not eligible (same logic as before).

`SpellingQuestion` does not call `recordCorrect`/`recordWrong` on a grapheme (same as `BlendingQuestion` — it tests the whole word, not a single grapheme).

Commit and push.

## Step 9 — Update CLAUDE.md

CLAUDE.md must reflect:
- `inventory.tools` new shape: array of `{ id, usesRemaining }`
- `hasTool`, `getToolUses`, `useTool` helpers
- `maxUses: 10` in shovel item entry
- Shovel use count display in habitat
- `getStatDirection` helper and bar arrow rendering
- Three empty-bar consequences (energy/hunger/cleanliness)
- `CONFUSABLE_PAIRS` map in questionSelector
- `optionCount` in question selection result, dynamic 3/4/5 options
- Phase 4 words added to words.js
- `SpellingQuestion` component: blank tile UI, per-position tap handling, error tracking
- Updated question type weights (40/20/20/20)
- Session 7 added to build history
- Notes for session 8: cosmetic overlays, user profiles, tricky words

Commit and push.

## Definition of done

- [ ] Shovel shows remaining uses (🪣 7) in habitat
- [ ] Use count turns amber at 3, red at 1
- [ ] Shovel disappears from inventory at 0 uses, can be repurchased
- [ ] Stat bars show ▲ / ▼ / ► based on net rate
- [ ] Energy = 0: Jimmy enters sleep pose, coin rewards halved
- [ ] Hunger = 0: mood forced to sad, Jimmy barely moves
- [ ] Cleanliness = 0: sprite has sepia filter, poop spawns faster
- [ ] Confusable distractors appear when available (verify: 'b' question should sometimes show 'd' or 'p')
- [ ] PhonemeQuestion shows 4 options for a practising grapheme, 5 for mastered
- [ ] Phase 4 words appear once 10+ graphemes are practising/mastered
- [ ] SpellingQuestion appears during gameplay (~20% of questions)
- [ ] Spelling word plays phonemes then whole word on mount
- [ ] Correct tap fills blank with green highlight
- [ ] Wrong tap: red flash, correct grapheme revealed, auto-fills blank
- [ ] onCorrect fires only if all positions were tapped correctly
- [ ] CLAUDE.md updated and accurate
- [ ] All changes committed and pushed

## What we are NOT building this session
- Cosmetic overlays on Jimmy (session 8)
- User profiles (session 8)
- Tricky words (session 8)
- Any backend or authentication

## Notes for session 8

**Cosmetic overlays:** items in `inventory.cosmetics` render as absolutely positioned `<img>` elements nested inside the same container as Jimmy's sprite. Each cosmetic in `items.js` needs an `overlayStyle` object: `{ top: '5%', left: '20%', width: '40%' }` defining position relative to the sprite bounding box. The overlay must also flip with `scaleX(-1)` when Jimmy faces right. Hat sits on head; scarf sits at neck.

**User profiles:** profile selection screen on launch, create profile flow (name input + colour picker), per-profile storage already works since everything is keyed by `userId`. The guest profile becomes the fallback for existing data.

**Tricky words:** a fifth question type — `TrickyWordQuestion`. Show a high-frequency irregular word ("the", "said", "was", "are", "they", "were", "you", "your", "come", "some"). TTS speaks it. Then show it among three similar-length tricky words. Child taps the one just shown. No phonics rules — pure visual memory. Add `src/data/trickyWords.js` with at least 20 entries.

## If time runs short
Drop Phase 4 words (Step 6) — carry to session 8. The other steps are all more impactful.
