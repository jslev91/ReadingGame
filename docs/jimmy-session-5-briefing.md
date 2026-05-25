# Jimmy — Session 5 Briefing Prompt

Paste this entire prompt at the start of your fifth Claude Code session.

---

We are continuing work on Jimmy, a phonics learning PWA for 5–6 year olds. Read CLAUDE.md fully before touching anything. Then run `git status` and `git log --oneline -5` to reorient.

## Pre-session checks

**1. Verify session 4 is complete:**
- Jimmy moves across the habitat and flips direction
- Correct/wrong answers trigger happy/sad reactions
- BlendingQuestion appears during gameplay
- Session summary screen appears after 10 questions

If any of these are missing, fix them before proceeding.

**2. Check available sprites:** run `ls -lh public/images/` and note which files exist. Expected at this point:
```
jimmy-idle.png      ✓
jimmy-walk-1.png    ✓  (through walk-6 ideally)
jimmy-happy.png     ✓
jimmy-sad.png       ✓
jimmy-sleep.png     ? (fall back to idle if missing)
```

**3. Remove backgrounds from any new sprites.** If any sprite files have a black or solid-colour background, remove it now using the same PIL/Pillow approach used in session 4. Run the background removal script on all files in `public/images/` that don't already have transparency. Commit the cleaned files before doing any other work.

---

## Session 5 goals

By the end of this session: the shop exists, coins can be spent, food can be purchased and placed in Jimmy's habitat where it visibly sits on the ground and slowly restores his hunger until it expires and disappears. This completes the core motivational loop — learn → earn coins → buy things for Jimmy → Jimmy is happier.

---

## Step 1 — Item catalogue data

Create `src/data/items.js`. This is the single source of truth for everything the shop sells, now and in future sessions.

**Data shape per item:**
```js
{
  id: 'food',
  name: 'Leaves',
  description: 'Jimmy loves leaves!',
  type: 'consumable',      // 'consumable' | 'tool' | 'cosmetic'
  cost: 3,                 // coins
  sprite: '/images/items/food.png',  // falls back to emoji if missing
  emoji: '🍃',             // always available fallback for shop UI
  effect: {
    stat: 'hunger',        // which stat is affected
    ratePerMinute: 0.5,    // hunger +0.5/min while active (net gain vs normal decay)
    duration: 30,          // minutes until item expires
  },
  maxActive: 1,            // max of this item in habitat at once
  consumedOnUse: true,     // disappears after duration (vs permanent tools)
}
```

**Include these items** — only `food` is fully active this session; the rest are stubs for future sessions (present in catalogue, marked `comingSoon: true` so shop shows them greyed out):

| id | name | type | cost | emoji | notes |
|---|---|---|---|---|---|
| food | Leaves | consumable | 3 | 🍃 | Active this session |
| bath | Bath time | consumable | 4 | 🛁 | Session 6 — instant cleanliness boost |
| shovel | Shovel | tool | 8 | 🪣 | Session 6 — permanent poop removal tool |
| hat | Top Hat | cosmetic | 15 | 🎩 | Session 7 — cosmetic overlay |
| scarf | Rainbow Scarf | cosmetic | 12 | 🌈 | Session 7 — cosmetic overlay |

Export the array as `ITEMS` and a helper `getItem(id)`.

Commit and push.

## Step 2 — Update `usePet` for placed items and spending

Add to the pet state (persisted under `jimmy:{userId}:petState`):

```js
activeItems: []   // array of placed item instances
// Each instance:
// { instanceId: uuid, itemId: 'food', x: 45, placedAt: ISO, expiresAt: ISO }

inventory: {
  tools: [],        // array of tool item ids owned permanently e.g. ['shovel']
  cosmetics: [],    // array of cosmetic item ids owned permanently
}
```

**New functions to expose:**

`spendCoins(amount)` — deducts coins, floors at 0, throws if insufficient (caller must check first).

`purchaseItem(itemId)` — validates: enough coins, item not already at maxActive limit, item not already owned (for tools/cosmetics). Deducts coins. For consumables: adds an instance to `activeItems` with a random `x` between 10 and 80, sets `expiresAt` based on `duration`. For tools/cosmetics: adds id to `inventory.tools` or `inventory.cosmetics`. Returns `{ success: boolean, reason?: string }`.

`canAfford(itemId)` — returns boolean.

`canPurchase(itemId)` — returns `{ canBuy: boolean, reason?: string }`. Reasons: `'insufficient_coins'`, `'already_active'`, `'already_owned'`, `'coming_soon'`.

**Update the decay tick** to also: remove any `activeItems` where `expiresAt` has passed; apply active item effects to stats (food present: `hunger` gains `ratePerMinute` per tick interval instead of decaying). Multiple active items of the same type stack effects.

Commit and push.

## Step 3 — Habitat item rendering

Update `src/components/Jimmy.jsx` (the habitat component) to render active items.

**Rendering rules:**
- Each item in `activeItems` renders as an absolutely positioned element within the habitat at `left: ${item.x}%`, sitting on the ground line (bottom-aligned to match Jimmy)
- Show the item sprite (`item.sprite`) if available; fall back to the emoji rendered as text at `text-2xl`
- Items render behind Jimmy (lower z-index)
- **Expiry visual:** calculate `progress = (now - placedAt) / (expiresAt - placedAt)`. When `progress > 0.7` (last 30% of life), apply `opacity-50` to indicate the item is nearly gone
- Do not show expired items (they will have been removed from `activeItems` by the decay tick)

The habitat now receives `activeItems` as a prop alongside `stats`, `mood`, `pose`.

Commit and push.

## Step 4 — Shop screen

Create `src/screens/ShopScreen.jsx`.

**Layout:**
- Header: "🪙 {coins}" prominently displayed top-right, "Shop" title top-left, back arrow top-left corner
- Grid of item cards (2 columns): each card shows emoji (large), name, cost in coins `🪙 {cost}`
- Card states:
  - **Available:** normal, tappable
  - **Can't afford:** greyed out, cost shown in red
  - **Already active/owned:** greyed out, small label "Already have it" or "Active"
  - **Coming soon:** greyed out, small "Coming soon" label — do not show price
- Tapping an available card triggers a confirmation: a simple modal or bottom sheet showing the item emoji large, name, "🪙 {cost} coins", and two buttons: "Buy" and "Cancel"
- On confirm: call `pet.purchaseItem(itemId)`. On success: briefly animate the coin count decreasing and show a small "✓ Added to Jimmy's home!" message. On failure: show the reason.

**The shop must be usable without reading.** Emoji and coin icons carry the meaning. Names are supplementary.

Add a shop button to `HomeScreen.jsx`: a small 🛍️ icon button in the top-right corner of the home screen (64px tap target). Update `App.jsx` navigation to include `"shop"` as a screen state.

Commit and push.

## Step 5 — Wire it together and test the full loop

Manually test this exact sequence:
1. Answer questions until you have at least 3 coins
2. Tap the shop button from the home screen
3. Buy Leaves
4. Return to home screen — the food item should be visible in the habitat
5. Open DevTools → Local Storage — verify `activeItems` contains the food entry with a future `expiresAt`
6. Verify Jimmy's hunger stat is increasing (or decaying slower) while the food is present
7. Temporarily set food duration to 1 minute in items.js, wait for it to expire — item should disappear from habitat and `activeItems` should be empty

Fix any issues found, then restore the duration to 30 minutes. Commit and push.

## Step 6 — Update CLAUDE.md

CLAUDE.md must reflect:
- `src/data/items.js`: full data shape, item catalogue, `comingSoon` convention
- Updated `usePet` state shape: `activeItems`, `inventory`, new functions
- Habitat now receives and renders `activeItems`
- `ShopScreen`: layout, card states, confirmation flow, navigation
- Session 5 added to build history
- Note what's coming in session 6: poop, shovel activation, bath item

Commit and push.

## Definition of done

- [ ] Shop is accessible from the home screen via a 🛍️ button
- [ ] Shop shows Leaves (available), other items greyed out as "Coming soon"
- [ ] Coin count displayed in shop header updates correctly
- [ ] Buying Leaves deducts 3 coins
- [ ] Cannot buy if insufficient coins (card greyed out, red cost)
- [ ] Food item appears in habitat after purchase, sitting on the ground
- [ ] Food fades to 50% opacity in its last 30% of life
- [ ] Food disappears from habitat when expired
- [ ] Hunger stat recovers while food is active
- [ ] `activeItems` persists in localStorage — food survives a browser refresh
- [ ] Full loop tested: earn coins → buy food → food appears → hunger recovers → food expires
- [ ] CLAUDE.md updated and accurate
- [ ] All committed and pushed to GitHub

## What we are NOT building this session
- Poop (session 6)
- Shovel activation (session 6)
- Bath item activation (session 6)
- Cosmetic rendering on Jimmy (session 7)
- User profiles
- Any backend

## Notes for future sessions

**Session 6** activates poop (random timed appearance, faster cleanliness decay while present, tap to remove with shovel), activates the bath item (instant cleanliness boost, no habitat placement needed), and activates shovel purchase.

**Session 7** adds cosmetic rendering: items in `inventory.cosmetics` appear as absolutely-positioned overlay images on top of Jimmy's sprite as he wanders. Each cosmetic needs a sprite sized and positioned to sit correctly on the giraffe (hat on head, scarf around neck).

The `comingSoon` flag in items.js is the toggle — when an item is ready, remove `comingSoon: true` and it becomes purchasable automatically.
