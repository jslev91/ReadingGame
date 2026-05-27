# Jimmy — Session 8 Briefing Prompt

Paste this entire prompt at the start of your eighth Claude Code session.

---

We are continuing work on Jimmy, a phonics learning PWA for 5–6 year olds. Read CLAUDE.md fully before touching anything. Then run `git status` and `git log --oneline -5` to reorient.

## Pre-session checks

**1. Verify session 7 is complete:**
- SpellingQuestion appears during gameplay
- Shovel shows remaining uses in habitat
- Stat bars show ▲ / ▼ / ► direction arrows
- Empty bar consequences active (sleep pose, sluggish movement, grubby filter)

**2. Background removal.** Run `ls -lh public/images/` and `ls -lh public/images/cosmetics/`. Remove backgrounds from any new sprites using the established PIL/Pillow approach. Commit cleaned files before any other work.

**3. Check hat sprite exists:** `public/images/cosmetics/hat.png`. If missing, stop and tell the user. The hat is required for this session. Scarf (`public/images/cosmetics/scarf.png`) may not exist yet — that is expected and handled gracefully.

---

## Session 8 goals

Two features: (1) cosmetic overlays — the hat sits on Jimmy's head as he wanders, flipping direction with him; (2) tricky words — a fifth question type for high-frequency irregular words that must be learned by sight. Both are self-contained additions.

---

## Step 1 — Add overlay metadata to `items.js`

Each cosmetic item needs an `overlayStyle` object that positions the overlay relative to Jimmy's sprite container. Add this to the hat and scarf entries:

```js
// Hat
overlayStyle: {
  top: '2%',
  left: '8%',
  width: '32%',
}

// Scarf
overlayStyle: {
  top: '52%',
  left: '10%',
  width: '44%',
}
```

**Important:** these are starting estimates. The exact values depend on the sprite proportions and will need tuning. See Step 3 for the debug tool that makes this easy.

Also update the hat entry: **remove `comingSoon: true`** — it is now purchasable. Leave `comingSoon: true` on scarf — it stays greyed out in the shop until the sprite arrives. When the scarf sprite is ready, removing that flag is the only change needed.

Commit and push.

## Step 2 — Cosmetic sprite mapping

Create `src/services/cosmeticSprites.js`. This maps cosmetic item ids to their sprite files:

```js
const COSMETIC_SPRITES = {
  hat:   '/images/cosmetics/hat.png',
  scarf: '/images/cosmetics/scarf.png',
}

export function getCosmeticSprite(itemId) {
  return COSMETIC_SPRITES[itemId] ?? null
}
```

Keeping this in a separate file means the sprite paths are easy to find and update without touching component logic.

Commit and push.

## Step 3 — Cosmetic overlay rendering in `Jimmy.jsx`

Cosmetics are stored in `stats.activeItems` with `type === 'cosmetic'` (they expire after 4 days like other active items). The habitat already receives `stats` — filter `stats.activeItems` for cosmetics to get the overlay list.

**Wrap Jimmy's sprite in a relative-positioned container:**

The sprite `<img>` is already inside the absolutely-positioned movement container. Wrap it in an additional `relative inline-block` div so cosmetic overlays can be positioned relative to the sprite itself (not the habitat):

```jsx
<div style={{ position: 'relative', display: 'inline-block' }}>
  <img
    src={spriteSrc}
    style={{ ...existingStyles }}
    onError={...}
  />
  {cosmeticOverlays}
</div>
```

**Render cosmetic overlays inside this wrapper:**

```jsx
const cosmeticItems = stats.activeItems.filter(i => getItem(i.itemId)?.type === 'cosmetic')

const cosmeticOverlays = cosmeticItems.map(item => {
  const def = getItem(item.itemId)
  const src = getCosmeticSprite(item.itemId)
  if (!def?.overlayStyle) return null
  return (
    <img
      key={item.instanceId}
      src={src}
      alt=""
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        ...def.overlayStyle,
      }}
      onError={e => { e.target.style.display = 'none' }}
    />
  )
})
```

**Direction flipping:** the `scaleX(-1)` flip is applied to the outer movement container (which contains both the sprite and the overlays), so both flip together automatically. No extra handling needed.

**Debug positioning tool:** add a `?cosmeticDebug=1` URL parameter check. When active, render each cosmetic overlay's bounding box as a semi-transparent red rectangle instead of the actual image, and log the `overlayStyle` values to the console. This makes tuning the positions trivial — adjust values in `items.js`, reload, see where the box sits on Jimmy. Remove the debug mode check once positions are finalised. Commit the final tuned values.

Commit and push.

## Step 4 — Tricky word data

Create `src/data/trickyWords.js`.

Tricky words are high-frequency irregular words from the Letters and Sounds programme that cannot be reliably decoded using phonics rules alone. They must be learned by sight.

**Data shape:**
```js
{
  word: 'the',
  phase: 2,              // Letters and Sounds phase when introduced
  audioFallback: 'the',  // text to pass to TTS speak() fallback
}
```

**Include at minimum these 25 words**, in Letters and Sounds phase order:

Phase 2: the, to, no, go, I
Phase 3: he, she, we, me, be, was, my, you, they, her, all, are
Phase 4 (adjacent consonant tricky words): said, so, do, some, come, were, there, little, one, out

Export as `TRICKY_WORDS` array and a helper `getTrickyWord(word)`.

Commit and push.

## Step 5 — Tricky word progress tracking

Update `src/hooks/useProgress.js` to track tricky word progress alongside grapheme progress.

**Store under `jimmy:{userId}:trickyWordProgress`** — separate key from grapheme progress.

**State shape per word:**
```js
{ status: 'unseen' | 'seen' | 'familiar' | 'known', correctCount: 0, lastSeen: null }
```

**Transitions:**
- `unseen → seen`: on first presentation
- `seen → familiar`: at 3 correct recognitions
- `familiar → known`: at 7 correct recognitions

**Introduction pacing:** a new tricky word is introduced when the most recently introduced tricky word has reached `familiar` (3 correct). Start with Phase 2 words in order. Do not introduce Phase 3 tricky words until 3 Phase 2 tricky words are `familiar` or `known`.

**New exposed functions:**
- `trickyWordProgressMap` — full map of word → progress object
- `recordTrickyPresented(word)` — marks as seen
- `recordTrickyCorrect(word)` — increments count, updates status
- `recordTrickyWrong(word)` — updates lastSeen only

**Helper function `selectNextTrickyWord(trickyProgressMap)`** — export this from `useProgress.js`. Returns:
```js
{ targetWord, distractors: [word, word] }
```
- Target: a word that has been seen at least once (prioritise familiar/known for review, occasionally return known words for maintenance)
- If no seen words yet: return the first unseen Phase 2 tricky word (to introduce it)
- Distractors: 2 other words from the seen pool; if pool is small, use the next unseen words
- Returns `null` if not enough words exist yet to form a valid question (fewer than 1 word available)

`TrickyWordQuestion` is eligible when `selectNextTrickyWord` returns non-null.

Commit and push.

## Step 6 — `TrickyWordQuestion` component

Create `src/components/TrickyWordQuestion.jsx`.

**What it tests:** recognition of high-frequency irregular words by sight and sound. The child sees and hears a word, then must identify it from a group of three.

**How it works:**
- Props: `targetWord` (string), `distractors` (array of 2 strings), `onCorrect`, `onWrong`, `locked`
- Phase 1 (presentation, 1500ms):
  - Show the target word large and centred (`text-5xl font-bold`)
  - Immediately speak it via TTS: `speak('', targetWord.word)`
  - No buttons visible yet — child just sees and hears the word
- Phase 2 (question):
  - Word display shrinks to a smaller prompt above the buttons
  - Show instruction: small text "Which one did you see?" (text only, child does not need to read this — parent reads it aloud if needed)
  - Show three large word buttons: target + 2 distractors, shuffled
  - 🔊 button to replay the spoken word
- Tap handling: same anti-guessing rules as all other question types — one attempt, wrong reveals correct, no retry
- Font: the same large bold font used elsewhere. Do not use a special "handwriting" or "teaching" font — keep it consistent with the rest of the app.

Commit and push.

## Step 7 — Wire into `GameScreen`

Update question type selection and weighting.

**Updated weights (5 types):**
- `PhonemeQuestion`: 35%
- `InitialSoundQuestion`: 20%
- `BlendingQuestion`: 15%
- `SpellingQuestion`: 15%
- `TrickyWordQuestion`: 15%

TrickyWordQuestion eligibility: `selectNextTrickyWord(trickyWordProgressMap)` returns non-null.

When `TrickyWordQuestion` fires, call `recordTrickyPresented` on mount and `recordTrickyCorrect`/`recordTrickyWrong` on answer — do not call the grapheme progress functions (tricky words are tracked separately).

Coin reward and energy penalty apply normally to tricky word questions.

Commit and push.

## Step 8 — Update CLAUDE.md

CLAUDE.md must reflect:
- `overlayStyle` field added to cosmetic items in `items.js`
- `comingSoon` removed from hat, retained on scarf
- `getCosmeticSprite` service in `src/services/cosmeticSprites.js`
- How cosmetic overlays render (relative container, direction flip, onError hide)
- Debug positioning tool (`?cosmeticDebug=1`)
- `src/data/trickyWords.js`: data shape, 25 words, phase order
- Updated `useProgress.js`: tricky word progress, new functions, `selectNextTrickyWord`
- `TrickyWordQuestion`: two-phase presentation, tap handling
- Updated question weights (35/20/15/15/15)
- Session 8 in build history
- Notes for session 9: user profiles

Commit and push.

## Definition of done

- [ ] Hat appears on Jimmy's head as he wanders the habitat
- [ ] Hat flips correctly when Jimmy changes direction
- [ ] Hat purchased from shop costs 30 coins and lasts 4 days
- [ ] Hat disappears from habitat when expired
- [ ] Scarf remains "Coming soon" in shop (no sprite yet)
- [ ] `?cosmeticDebug=1` shows red bounding box for overlay positioning (remove once tuned)
- [ ] Hat position looks correct on Jimmy's head (not floating, not covering face)
- [ ] TrickyWordQuestion appears during gameplay once tricky words are introduced
- [ ] Word is shown large for 1500ms before buttons appear
- [ ] TTS speaks the word on mount
- [ ] Three word buttons appear clearly readable
- [ ] Anti-guessing rules apply: one attempt, wrong reveals correct
- [ ] Tricky word progress saves to localStorage (separate key from grapheme progress)
- [ ] New tricky word introduced once current one reaches `familiar`
- [ ] CLAUDE.md updated and accurate
- [ ] All committed and pushed

## What we are NOT building this session
- User profiles — session 9
- Sentence reading — later
- Any backend or authentication
- Scarf overlay (no sprite yet — just needs `comingSoon` removed and sprite added when ready)

## Notes for session 9

**User profiles** is the main event. Required screens: a profile selector shown on first launch (and accessible from home screen), a "create profile" flow (name input + colour picker for the profile badge), and a "switch profile" mechanism. The guest profile (`id: "guest"`) becomes the migration fallback — on first launch after this session, if guest data exists it should be offered as a profile to keep rather than silently discarded.

Storage is already keyed by `userId` throughout, so the data layer requires no changes. The work is entirely in navigation and UI.

Consider also a parent/settings area (accessible via a long-press or hidden button on the home screen) where a parent can view progress, reset a profile, or manage profiles without the child accidentally accessing it.
