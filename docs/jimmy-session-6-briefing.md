# Jimmy — Session 6 Briefing Prompt

Paste this entire prompt at the start of your sixth Claude Code session.

---

We are continuing work on Jimmy, a phonics learning PWA for 5–6 year olds. Read CLAUDE.md fully before touching anything. Then run `git status` and `git log --oneline -5` to reorient.

## Pre-session checks

**1. Verify session 5 is complete:**
- Shop is accessible from home screen
- Leaves can be purchased and appear in habitat
- Food expires and disappears after 30 minutes
- Hunger recovers while food is present
- Coins deduct correctly on purchase

If any of these are missing, fix them before proceeding.

**2. Background removal.** Run `ls -lh public/images/` and `ls -lh public/images/items/`. If any new sprite files have been added since session 5 with solid-colour backgrounds, run background removal on them now using the same PIL/Pillow approach as previous sessions. Commit cleaned files before any other work.

**3. Note on sprites.** Session 6 introduces poop and bath items. Sprite files for these may not exist yet:
```
public/images/items/poop.png    ← use 💩 emoji fallback if missing
public/images/items/bath.png    ← use 🛁 emoji fallback if missing
public/images/items/shovel.png  ← use 🪣 emoji fallback if missing (shop display only)
```
The emoji fallback system from session 5 handles all of these. Do not block on missing sprites.

---

## Session 6 goals

By the end of this session: Jimmy poops. The habitat gets grimier over time if poop is ignored. The child is motivated to buy a shovel to clean it up. A bath can also be purchased and placed, restoring cleanliness over time. The loop of neglect → consequence → remedy is now complete.

---

## Step 1 — Correct bath item type in `items.js`

The bath item was originally described as an instant cleanliness boost. Change it to a **placed consumable** — consistent with the food item. A bathtub appears in the habitat, cleanliness recovers over time while it's present, then it disappears.

Update the bath entry in `src/data/items.js`:
```js
{
  id: 'bath',
  name: 'Bath Time',
  description: 'A nice tub for Jimmy!',
  type: 'consumable',
  cost: 4,
  sprite: '/images/items/bath.png',
  emoji: '🛁',
  effect: {
    stat: 'cleanliness',
    ratePerMinute: 0.6,
    duration: 20,
  },
  maxActive: 1,
  consumedOnUse: true,
  comingSoon: false,   // ← activate it
}
```

Remove `comingSoon: true` from shovel too — it becomes purchasable this session.

Commit and push.

## Step 2 — Add poop to pet state

Update `usePet` to add poop generation and storage.

**New fields in pet state** (persisted under `jimmy:{userId}:petState`):
```js
poops: [],           // [{ id: uuid, x: number, placedAt: ISO }]
nextPoopAt: null,    // ISO timestamp — when the next poop will appear
```

**Poop generation rules:**
- On first load (if `nextPoopAt` is null): set `nextPoopAt` to a random time 45–90 minutes from now
- On each decay tick: check if `Date.now() >= nextPoopAt`. If so, and if `poops.length < 3`: add a new poop at a random `x` between 5 and 85, set a new `nextPoopAt` 45–90 minutes from now
- If `poops.length >= 3`: still advance `nextPoopAt` (poop is "ready" but waiting for space) — check again next tick
- Maximum 3 poops at any time

**Poop effect on cleanliness decay:**
Each poop present increases the cleanliness decay multiplier by ×1.5 (stackable). So:
- 0 poops: normal decay (−1 per 15 min)
- 1 poop: −1.5× (−1 per 10 min)
- 2 poops: −2.25× (−1 per ~6.7 min)
- 3 poops: −3.375× (−1 per ~4.5 min)

This creates real urgency. An ignored habitat becomes noticeably grubby.

**New function — `removePoop(poopId)`:**
- Removes the poop with matching id from `poops`
- Awards +5 cleanliness (capped at 100)
- Does NOT require any external check — caller is responsible for verifying shovel ownership before calling this

**Expose:** `poops`, `nextPoopAt`, `removePoop(id)`

Commit and push.

## Step 3 — Render poop in habitat

Update `src/components/Jimmy.jsx` to render poops.

**Rendering:**
- Each poop renders as an absolutely positioned element at `left: ${poop.x}%`, on the ground line, same z-index as active items (behind Jimmy)
- Use poop sprite if available, fall back to 💩 emoji at `text-xl`
- **Smell indicator:** add a small CSS-animated wavy element above each poop — two or three `~` characters in light grey, with a gentle float-up keyframe animation (opacity 0→1→0, translateY upward). This is purely CSS, no extra sprites needed. Adds life without complexity.
- **Tap target:** the tappable area must be at least 64px × 64px even if the visual is smaller — wrap in a div with `min-w-16 min-h-16 flex items-end justify-center`

The habitat component now receives a `poops` prop (array) and an `onPoopTap(poopId)` callback prop.

Commit and push.

## Step 4 — Poop tap handling in GameScreen and HomeScreen

Both screens use the habitat. Wire up `onPoopTap` in both:

```js
const handlePoopTap = (poopId) => {
  if (pet.inventory.tools.includes('shovel')) {
    pet.removePoop(poopId)
    // brief visual: show "✨ Clean!" near where the poop was
  } else {
    // brief visual: show "You need a shovel! 🪣" near the tapped poop
    // auto-dismisses after 1500ms
  }
}
```

The "clean" and "need shovel" messages should appear as absolutely positioned, auto-dismissing toasts near the tapped poop position — not as modal dialogs. Use the poop's `x` value to position them roughly correctly.

Commit and push.

## Step 5 — Test the full loop

Test this sequence in order. Fix any issues found before the next step.

**Poop test:**
1. Temporarily set `nextPoopAt` to `Date.now()` in the browser console (or temporarily override in code) to trigger immediate poop generation
2. Confirm poop appears in habitat with smell animation
3. Tap poop without shovel — confirm "need a shovel" message appears
4. Buy shovel from shop (8 coins — you may need to answer some questions first)
5. Tap poop — confirm it disappears and cleanliness increases
6. Restore any temporary overrides, commit

**Bath test:**
1. Buy Bath Time from shop
2. Confirm bathtub appears in habitat
3. Confirm cleanliness is recovering while tub is present
4. Temporarily set bath duration to 1 minute, confirm it expires and disappears
5. Restore duration to 20 minutes, commit

**Cleanliness decay test:**
1. Trigger 2–3 poops (via console/temp override)
2. Confirm cleanliness is decaying noticeably faster with multiple poops
3. Remove poops with shovel, confirm decay returns to normal rate

Commit and push all fixes.

## Step 6 — Update CLAUDE.md

CLAUDE.md must reflect:
- Updated pet state shape: `poops`, `nextPoopAt`
- Poop generation logic and frequency
- Cleanliness decay multiplier formula (per poop count)
- `removePoop(id)` function
- Habitat now receives `poops` and `onPoopTap` props
- Smell indicator: CSS-only animation, no sprite needed
- Bath changed to placed consumable (not instant)
- Shovel and bath both activated in items.js (no longer `comingSoon`)
- Toast message pattern for poop tap feedback
- Session 6 added to build history
- Notes for session 7: cosmetic rendering (hat/scarf overlays on Jimmy sprite)

Commit and push.

## Definition of done

- [ ] Poop appears in habitat after `nextPoopAt` is reached
- [ ] Maximum 3 poops accumulate, no more
- [ ] Smell animation visible above each poop (CSS only, no sprite needed)
- [ ] Poop tap target is at least 64×64px
- [ ] Tapping poop without shovel shows "need a shovel" toast
- [ ] Shovel available in shop for 8 coins, permanent once bought
- [ ] Tapping poop with shovel removes it and boosts cleanliness by 5
- [ ] Cleanliness decays faster with poop present (verify in DevTools: check decay rate with 0 vs 2 poops)
- [ ] Bath Time available in shop for 4 coins
- [ ] Bathtub appears in habitat after purchase
- [ ] Cleanliness recovers while bathtub is present
- [ ] Bathtub expires and disappears after 20 minutes
- [ ] All stat effects (food, bath, poop) work simultaneously without interfering
- [ ] CLAUDE.md updated and accurate
- [ ] All committed and pushed to GitHub

## What we are NOT building this session
- Cosmetic items (hat, scarf) rendering on Jimmy — session 7
- User profiles — later session
- Any further question types — later session
- Tricky words / sight words — later session
- Any backend

## Notes for session 7

Cosmetic items in `inventory.cosmetics` need to render as absolutely-positioned overlay images on top of Jimmy's sprite. Each cosmetic has a defined anchor point (hat: top of head, scarf: around neck). As Jimmy moves and flips direction, the overlay must move with him and also flip. The cleanest approach is to nest the cosmetic `<img>` inside the same container div as Jimmy's sprite, positioned relative to it. Each cosmetic item in `items.js` will need `overlayStyle` metadata defining its position offset from the sprite's bounding box.

Session 7 also introduces tricky words as a fourth question type — high-frequency irregular words (the, said, was, are, they) presented as flashcard-style recognition exercises.
