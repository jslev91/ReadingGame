# Jimmy — Session 2 Briefing Prompt

Paste this entire prompt at the start of your second Claude Code session.

---

We are continuing work on Jimmy, a phonics learning PWA for 5–6 year olds. Read CLAUDE.md fully before touching anything. Then run `git status` and `git log --oneline -5` to reorient.

## Session 2 goals

By the end of this session the app should feel like a real (if basic) game: Jimmy the giraffe is visible on screen, a proper question loop runs, and the app tracks which graphemes the child has been introduced to and is practising.

## Step 1 — Fix TTS (do this first, it's a small change)

In `src/services/tts.js`, make these changes to the `speak()` function:
- Set `utterance.rate = 0.75` (down from the default 1.0)
- Before assigning the voice, query available voices with `speechSynthesis.getVoices()` and prefer any voice whose name contains `"Google"` and `lang` is `"en-GB"`. Fall back to the first available `en-GB` voice. Fall back to default if none found.
- Add a small `setTimeout` of 100ms before calling `speak()` — iOS requires a brief pause after user interaction before synthesis will trigger reliably.

Test it: the phoneme sound should now be slower and clearer. Commit and push.

## Step 2 — Jimmy component

Create `src/components/Jimmy.jsx`. This is the visual pet display.

- Show the giraffe as the 🦒 emoji at a large size (around 80px via Tailwind `text-7xl`)
- Below the emoji, show an energy bar: a rounded bar that fills proportionally to `energy` (0–100). Colour should reflect mood: green for `"happy"`, amber for `"okay"`, red for `"sad"`
- The component receives `energy` and `mood` as props
- No animation yet — static display only

Commit and push.

## Step 3 — Progress tracking hook

Create `src/hooks/useProgress.js` (replacing the stub). This hook manages per-user, per-grapheme progress via the storage service.

**State shape per grapheme** (keyed by `grapheme` string, stored via storage service under userId):
```js
{
  status: "unseen" | "introduced" | "practising" | "mastered",
  correctCount: 0,
  lastSeen: null  // ISO timestamp
}
```

**Status transition rules:**
- `unseen` → `introduced`: when the grapheme is first presented as a question
- `introduced` → `practising`: after 3 correct answers
- `practising` → `mastered`: after 7 correct answers total
- Wrong answers do not regress status — they simply don't advance the count

**Exposed functions:**
- `getProgress(grapheme)` — returns the state object for a grapheme (defaults to unseen if not found)
- `recordPresented(grapheme)` — marks as introduced if currently unseen, updates lastSeen
- `recordCorrect(grapheme)` — increments correctCount, updates status if threshold reached
- `recordWrong(grapheme)` — updates lastSeen only

Commit and push.

## Step 4 — Question selection logic

Create `src/services/questionSelector.js`. This determines which grapheme to ask about next.

**Rules (in priority order):**
1. Never introduce more than one new (`unseen`) grapheme per session
2. The first grapheme presented is always Phase 2, order 1 — work through Phase 2 in order
3. Do not introduce a new grapheme until the current one has at least 1 correct answer
4. After introducing a new grapheme, interleave it with review of previously `introduced` and `practising` graphemes
5. `mastered` graphemes appear rarely (roughly 1 in 10 questions) as maintenance review
6. Do not introduce Phase 3 graphemes until at least 6 Phase 2 graphemes are `practising` or `mastered`

**Distractor selection:**
- Distractors must only come from graphemes the child has already been introduced to (status is `introduced`, `practising`, or `mastered`)
- If fewer than 2 such graphemes exist, fill remaining slots from Phase 2 graphemes in order — the child will encounter them soon anyway
- Never use the correct grapheme as a distractor

Export a single function: `selectNextQuestion(allGraphemes, progressMap)` that returns `{ grapheme, distractors: [grapheme, grapheme] }`.

Commit and push.

## Step 5 — Game screen

Create `src/screens/GameScreen.jsx`. This is the main game view.

**Layout (top to bottom):**
- Jimmy component at the top, receiving live `energy` and `mood` from `usePet`
- Current question in the middle: the `PhonemeQuestion` component
- No score display yet — keep it clean

**Game loop behaviour:**
- On mount, call `selectNextQuestion` to get the first question and call `recordPresented`
- When the child answers correctly:
  - Call `pet.onCorrect()` and `progress.recordCorrect(grapheme)`
  - Show brief visual feedback on the correct button (green highlight) for 1000ms
  - Then automatically advance to the next question (call `selectNextQuestion` again)
- When the child answers incorrectly:
  - Call `pet.onWrong()` and `progress.recordWrong(grapheme)`
  - Show red highlight on the tapped button, green on the correct button for 1500ms
  - Then automatically advance — no retry, no prompt
- During the feedback pause, disable all buttons to prevent double-tapping

Commit and push.

## Step 6 — Home screen

Create `src/screens/HomeScreen.jsx`. Keep it minimal.

- Large 🦒 emoji centred on screen
- "Play with Jimmy" as the only button (large, minimum 64px, friendly font)
- Jimmy's current mood emoji shown small beneath the giraffe (😊 / 😐 / 😢 based on mood)
- Tapping Play navigates to GameScreen

For navigation between screens, use simple React state in `App.jsx` (`currentScreen`) — no router library needed yet.

Commit and push.

## Step 7 — Wire everything together

Update `App.jsx` to:
- Show `HomeScreen` by default
- Switch to `GameScreen` when Play is tapped
- Pass a back/home function to GameScreen (a small home icon button, top-left, 64px tap target)
- Remove the hardcoded test grapheme from session 1

Run the app. Test the full flow: home screen → tap Play → questions appear → answer correctly and incorrectly → verify Jimmy's energy changes → verify the game advances automatically after each answer.

Commit and push.

## Definition of done for this session

- Jimmy is visible on screen with a working energy bar
- TTS is slower and clearer than session 1
- The game loop runs: questions auto-advance, no retries, energy updates
- Progress is being saved to localStorage (verify in browser DevTools → Application → Local Storage)
- Home screen exists and navigation works both ways
- All changes committed and pushed to GitHub

## What we are NOT building this session
- Animations or sound effects
- A second question type
- Score or streak display
- Settings or profile screens
- Any backend

If any of the above come up naturally and are trivial to add, note them in a comment but do not implement them. Stay focused on the goals above.
