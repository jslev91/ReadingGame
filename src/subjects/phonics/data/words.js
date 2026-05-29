// Decodable CVC/CCVC/CVCC words for blending and spelling question types.
// graphemes must exactly match grapheme strings in phonics.js.
// minIntroduced = minimum number of Phase 2 graphemes introduced before this word appears.
// Phase 4 words additionally require 10+ Phase 2 graphemes at practising or mastered.

import phonics from './phonics'

const phase2 = phonics.filter(p => p.phase === 2)

export const words = [
  // 3 graphemes introduced: s, a, t
  { word: 'sat', graphemes: ['s', 'a', 't'], phase: 2, minIntroduced: 3 },
  { word: 'tap', graphemes: ['t', 'a', 'p'], phase: 2, minIntroduced: 4 },
  { word: 'pat', graphemes: ['p', 'a', 't'], phase: 2, minIntroduced: 4 },
  // 5 graphemes: + p, i
  { word: 'sit', graphemes: ['s', 'i', 't'], phase: 2, minIntroduced: 5 },
  { word: 'tip', graphemes: ['t', 'i', 'p'], phase: 2, minIntroduced: 5 },
  { word: 'pit', graphemes: ['p', 'i', 't'], phase: 2, minIntroduced: 5 },
  { word: 'nip', graphemes: ['n', 'i', 'p'], phase: 2, minIntroduced: 6 },
  { word: 'tin', graphemes: ['t', 'i', 'n'], phase: 2, minIntroduced: 6 },
  { word: 'pin', graphemes: ['p', 'i', 'n'], phase: 2, minIntroduced: 6 },
  { word: 'sin', graphemes: ['s', 'i', 'n'], phase: 2, minIntroduced: 6 },
  // 7 graphemes: + m
  { word: 'map', graphemes: ['m', 'a', 'p'], phase: 2, minIntroduced: 7 },
  { word: 'mat', graphemes: ['m', 'a', 't'], phase: 2, minIntroduced: 7 },
  { word: 'man', graphemes: ['m', 'a', 'n'], phase: 2, minIntroduced: 7 },
  { word: 'mist', graphemes: ['m', 'i', 's', 't'], phase: 2, minIntroduced: 7 },
  // 8 graphemes: + d
  { word: 'dim', graphemes: ['d', 'i', 'm'], phase: 2, minIntroduced: 8 },
  { word: 'dip', graphemes: ['d', 'i', 'p'], phase: 2, minIntroduced: 8 },
  { word: 'dam', graphemes: ['d', 'a', 'm'], phase: 2, minIntroduced: 8 },
  { word: 'and', graphemes: ['a', 'n', 'd'], phase: 2, minIntroduced: 8 },
  // 9 graphemes: + g
  { word: 'gap', graphemes: ['g', 'a', 'p'], phase: 2, minIntroduced: 9 },
  { word: 'dig', graphemes: ['d', 'i', 'g'], phase: 2, minIntroduced: 9 },
  { word: 'gust', graphemes: ['g', 'u', 's', 't'], phase: 2, minIntroduced: 15 },
  // 10 graphemes: + o
  { word: 'got', graphemes: ['g', 'o', 't'], phase: 2, minIntroduced: 10 },
  { word: 'dog', graphemes: ['d', 'o', 'g'], phase: 2, minIntroduced: 10 },
  { word: 'top', graphemes: ['t', 'o', 'p'], phase: 2, minIntroduced: 10 },
  { word: 'mop', graphemes: ['m', 'o', 'p'], phase: 2, minIntroduced: 10 },
  { word: 'nod', graphemes: ['n', 'o', 'd'], phase: 2, minIntroduced: 10 },
  // 11 graphemes: + c
  { word: 'cop', graphemes: ['c', 'o', 'p'], phase: 2, minIntroduced: 11 },
  { word: 'cod', graphemes: ['c', 'o', 'd'], phase: 2, minIntroduced: 11 },
  { word: 'can', graphemes: ['c', 'a', 'n'], phase: 2, minIntroduced: 11 },
  { word: 'cat', graphemes: ['c', 'a', 't'], phase: 2, minIntroduced: 11 },
  // 12 graphemes: + k
  { word: 'kit', graphemes: ['k', 'i', 't'], phase: 2, minIntroduced: 12 },
  { word: 'kid', graphemes: ['k', 'i', 'd'], phase: 2, minIntroduced: 12 },
  // 14 graphemes: + e
  { word: 'net', graphemes: ['n', 'e', 't'], phase: 2, minIntroduced: 14 },
  { word: 'ten', graphemes: ['t', 'e', 'n'], phase: 2, minIntroduced: 14 },
  { word: 'hen', graphemes: ['h', 'e', 'n'], phase: 2, minIntroduced: 17 },
  { word: 'bed', graphemes: ['b', 'e', 'd'], phase: 2, minIntroduced: 18 },
  // 15 graphemes: + u
  { word: 'sun', graphemes: ['s', 'u', 'n'], phase: 2, minIntroduced: 15 },
  { word: 'cup', graphemes: ['c', 'u', 'p'], phase: 2, minIntroduced: 15 },
  { word: 'cut', graphemes: ['c', 'u', 't'], phase: 2, minIntroduced: 15 },
  { word: 'mud', graphemes: ['m', 'u', 'd'], phase: 2, minIntroduced: 15 },
  // 16 graphemes: + r
  { word: 'run', graphemes: ['r', 'u', 'n'], phase: 2, minIntroduced: 16 },
  { word: 'rat', graphemes: ['r', 'a', 't'], phase: 2, minIntroduced: 16 },
  { word: 'rot', graphemes: ['r', 'o', 't'], phase: 2, minIntroduced: 16 },
  // 17+ graphemes: + h, b, f, l
  { word: 'hot', graphemes: ['h', 'o', 't'], phase: 2, minIntroduced: 17 },
  { word: 'hip', graphemes: ['h', 'i', 'p'], phase: 2, minIntroduced: 17 },
  { word: 'bug', graphemes: ['b', 'u', 'g'], phase: 2, minIntroduced: 18 },
  { word: 'bit', graphemes: ['b', 'i', 't'], phase: 2, minIntroduced: 18 },
  { word: 'bat', graphemes: ['b', 'a', 't'], phase: 2, minIntroduced: 18 },
  { word: 'fan', graphemes: ['f', 'a', 'n'], phase: 2, minIntroduced: 19 },
  { word: 'fit', graphemes: ['f', 'i', 't'], phase: 2, minIntroduced: 19 },
  { word: 'log', graphemes: ['l', 'o', 'g'], phase: 2, minIntroduced: 21 },
  { word: 'lip', graphemes: ['l', 'i', 'p'], phase: 2, minIntroduced: 21 },
  { word: 'lot', graphemes: ['l', 'o', 't'], phase: 2, minIntroduced: 21 },

  // Phase 4 — CCVC (consonant cluster at start)
  { word: 'snap', graphemes: ['s', 'n', 'a', 'p'], phase: 4, minIntroduced: 6 },
  { word: 'snip', graphemes: ['s', 'n', 'i', 'p'], phase: 4, minIntroduced: 6 },
  { word: 'spin', graphemes: ['s', 'p', 'i', 'n'], phase: 4, minIntroduced: 6 },
  { word: 'stop', graphemes: ['s', 't', 'o', 'p'], phase: 4, minIntroduced: 10 },
  { word: 'skip', graphemes: ['s', 'k', 'i', 'p'], phase: 4, minIntroduced: 12 },
  { word: 'step', graphemes: ['s', 't', 'e', 'p'], phase: 4, minIntroduced: 14 },
  { word: 'stem', graphemes: ['s', 't', 'e', 'm'], phase: 4, minIntroduced: 14 },
  { word: 'grip', graphemes: ['g', 'r', 'i', 'p'], phase: 4, minIntroduced: 16 },
  { word: 'grin', graphemes: ['g', 'r', 'i', 'n'], phase: 4, minIntroduced: 16 },
  { word: 'drip', graphemes: ['d', 'r', 'i', 'p'], phase: 4, minIntroduced: 16 },
  { word: 'drop', graphemes: ['d', 'r', 'o', 'p'], phase: 4, minIntroduced: 16 },
  { word: 'drum', graphemes: ['d', 'r', 'u', 'm'], phase: 4, minIntroduced: 16 },
  { word: 'drag', graphemes: ['d', 'r', 'a', 'g'], phase: 4, minIntroduced: 16 },
  { word: 'trip', graphemes: ['t', 'r', 'i', 'p'], phase: 4, minIntroduced: 16 },
  { word: 'trot', graphemes: ['t', 'r', 'o', 't'], phase: 4, minIntroduced: 16 },
  { word: 'prop', graphemes: ['p', 'r', 'o', 'p'], phase: 4, minIntroduced: 16 },
  { word: 'crop', graphemes: ['c', 'r', 'o', 'p'], phase: 4, minIntroduced: 16 },
  { word: 'cram', graphemes: ['c', 'r', 'a', 'm'], phase: 4, minIntroduced: 16 },
  { word: 'slot', graphemes: ['s', 'l', 'o', 't'], phase: 4, minIntroduced: 21 },
  { word: 'slim', graphemes: ['s', 'l', 'i', 'm'], phase: 4, minIntroduced: 21 },
  { word: 'slug', graphemes: ['s', 'l', 'u', 'g'], phase: 4, minIntroduced: 21 },

  // Phase 4 — CVCC (consonant cluster at end)
  { word: 'damp', graphemes: ['d', 'a', 'm', 'p'], phase: 4, minIntroduced: 8 },
  { word: 'sand', graphemes: ['s', 'a', 'n', 'd'], phase: 4, minIntroduced: 8 },
  { word: 'pond', graphemes: ['p', 'o', 'n', 'd'], phase: 4, minIntroduced: 10 },
  { word: 'kept', graphemes: ['k', 'e', 'p', 't'], phase: 4, minIntroduced: 14 },
  { word: 'nest', graphemes: ['n', 'e', 's', 't'], phase: 4, minIntroduced: 14 },
  { word: 'sent', graphemes: ['s', 'e', 'n', 't'], phase: 4, minIntroduced: 14 },
  { word: 'tent', graphemes: ['t', 'e', 'n', 't'], phase: 4, minIntroduced: 14 },
  { word: 'rust', graphemes: ['r', 'u', 's', 't'], phase: 4, minIntroduced: 16 },
  { word: 'rest', graphemes: ['r', 'e', 's', 't'], phase: 4, minIntroduced: 16 },
  { word: 'hint', graphemes: ['h', 'i', 'n', 't'], phase: 4, minIntroduced: 17 },
  { word: 'bend', graphemes: ['b', 'e', 'n', 'd'], phase: 4, minIntroduced: 18 },
  { word: 'best', graphemes: ['b', 'e', 's', 't'], phase: 4, minIntroduced: 18 },
  { word: 'bump', graphemes: ['b', 'u', 'm', 'p'], phase: 4, minIntroduced: 18 },
  { word: 'fist', graphemes: ['f', 'i', 's', 't'], phase: 4, minIntroduced: 19 },
  { word: 'sink', graphemes: ['s', 'i', 'n', 'k'], phase: 4, minIntroduced: 12 },
  { word: 'tank', graphemes: ['t', 'a', 'n', 'k'], phase: 4, minIntroduced: 12 },
]

// Returns a word where all graphemes have been introduced, plus 2 distractors
// that share at least one grapheme with the target. Returns null if no eligible
// words or fewer than 3 eligible words exist (BlendingQuestion won't be shown).
export function selectBlendingWord(progressMap) {
  const introducedGraphemes = new Set(
    phase2
      .filter(p => ['introduced', 'practising', 'mastered'].includes(progressMap[p.grapheme]?.status))
      .map(p => p.grapheme)
  )
  const introCount = introducedGraphemes.size
  const practisingOrMasteredCount = phase2.filter(
    p => ['practising', 'mastered'].includes(progressMap[p.grapheme]?.status)
  ).length
  const phase4Unlocked = practisingOrMasteredCount >= 10

  const eligible = words.filter(w =>
    w.minIntroduced <= introCount &&
    w.graphemes.every(g => introducedGraphemes.has(g)) &&
    (w.phase !== 4 || phase4Unlocked)
  )

  if (eligible.length < 3) return null

  const target = eligible[Math.floor(Math.random() * eligible.length)]

  const distractors = eligible
    .filter(w => w.word !== target.word && w.graphemes.some(g => target.graphemes.includes(g)))
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)

  if (distractors.length < 2) return null

  return { wordEntry: target, distractors }
}
