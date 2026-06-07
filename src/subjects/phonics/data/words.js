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

  // ─── Phase 5 — split digraphs and alternative spellings ───────────────────
  // minIntroduced refers to Phase 2 count (always ≥ 1 by Phase 5); real gate is
  // the grapheme check in selectBlendingWord (all component graphemes introduced).
  // a-e words
  { word: 'cake',  graphemes: ['c', 'a-e', 'k'],       phase: 5, minIntroduced: 1 },
  { word: 'name',  graphemes: ['n', 'a-e', 'm'],       phase: 5, minIntroduced: 1 },
  { word: 'face',  graphemes: ['f', 'a-e', 'c'],       phase: 5, minIntroduced: 1 },
  { word: 'gate',  graphemes: ['g', 'a-e', 't'],       phase: 5, minIntroduced: 1 },
  { word: 'lake',  graphemes: ['l', 'a-e', 'k'],       phase: 5, minIntroduced: 1 },
  { word: 'same',  graphemes: ['s', 'a-e', 'm'],       phase: 5, minIntroduced: 1 },
  { word: 'late',  graphemes: ['l', 'a-e', 't'],       phase: 5, minIntroduced: 1 },
  { word: 'wave',  graphemes: ['w', 'a-e', 'v'],       phase: 5, minIntroduced: 1 },
  // i-e words
  { word: 'time',  graphemes: ['t', 'i-e', 'm'],       phase: 5, minIntroduced: 1 },
  { word: 'like',  graphemes: ['l', 'i-e', 'k'],       phase: 5, minIntroduced: 1 },
  { word: 'bike',  graphemes: ['b', 'i-e', 'k'],       phase: 5, minIntroduced: 1 },
  { word: 'kite',  graphemes: ['k', 'i-e', 't'],       phase: 5, minIntroduced: 1 },
  { word: 'five',  graphemes: ['f', 'i-e', 'v'],       phase: 5, minIntroduced: 1 },
  { word: 'hive',  graphemes: ['h', 'i-e', 'v'],       phase: 5, minIntroduced: 1 },
  { word: 'mine',  graphemes: ['m', 'i-e', 'n'],       phase: 5, minIntroduced: 1 },
  { word: 'fine',  graphemes: ['f', 'i-e', 'n'],       phase: 5, minIntroduced: 1 },
  { word: 'mile',  graphemes: ['m', 'i-e', 'l'],       phase: 5, minIntroduced: 1 },
  // o-e words
  { word: 'bone',  graphemes: ['b', 'o-e', 'n'],       phase: 5, minIntroduced: 1 },
  { word: 'home',  graphemes: ['h', 'o-e', 'm'],       phase: 5, minIntroduced: 1 },
  { word: 'note',  graphemes: ['n', 'o-e', 't'],       phase: 5, minIntroduced: 1 },
  { word: 'rose',  graphemes: ['r', 'o-e', 'z'],       phase: 5, minIntroduced: 1 },
  { word: 'nose',  graphemes: ['n', 'o-e', 'z'],       phase: 5, minIntroduced: 1 },
  { word: 'hope',  graphemes: ['h', 'o-e', 'p'],       phase: 5, minIntroduced: 1 },
  { word: 'mole',  graphemes: ['m', 'o-e', 'l'],       phase: 5, minIntroduced: 1 },
  { word: 'stone', graphemes: ['s', 't', 'o-e', 'n'],  phase: 5, minIntroduced: 1 },
  { word: 'those', graphemes: ['th', 'o-e', 'z'],      phase: 5, minIntroduced: 1 },
  // u-e words
  { word: 'tune',  graphemes: ['t', 'u-e', 'n'],       phase: 5, minIntroduced: 1 },
  { word: 'cube',  graphemes: ['c', 'u-e', 'b'],       phase: 5, minIntroduced: 1 },
  { word: 'cute',  graphemes: ['c', 'u-e', 't'],       phase: 5, minIntroduced: 1 },
  { word: 'mule',  graphemes: ['m', 'u-e', 'l'],       phase: 5, minIntroduced: 1 },
  { word: 'rule',  graphemes: ['r', 'u-e', 'l'],       phase: 5, minIntroduced: 1 },
  // e-e words
  { word: 'these', graphemes: ['th', 'e-e', 's'],      phase: 5, minIntroduced: 1 },
  { word: 'theme', graphemes: ['th', 'e-e', 'm'],      phase: 5, minIntroduced: 1 },
  // ay words
  { word: 'day',   graphemes: ['d', 'ay'],              phase: 5, minIntroduced: 1 },
  { word: 'play',  graphemes: ['p', 'l', 'ay'],         phase: 5, minIntroduced: 1 },
  { word: 'say',   graphemes: ['s', 'ay'],              phase: 5, minIntroduced: 1 },
  { word: 'stay',  graphemes: ['s', 't', 'ay'],         phase: 5, minIntroduced: 1 },
  { word: 'tray',  graphemes: ['t', 'r', 'ay'],         phase: 5, minIntroduced: 1 },
  { word: 'clay',  graphemes: ['c', 'l', 'ay'],         phase: 5, minIntroduced: 1 },
  // ea words
  { word: 'eat',   graphemes: ['ea', 't'],              phase: 5, minIntroduced: 1 },
  { word: 'sea',   graphemes: ['s', 'ea'],              phase: 5, minIntroduced: 1 },
  { word: 'meat',  graphemes: ['m', 'ea', 't'],         phase: 5, minIntroduced: 1 },
  { word: 'heat',  graphemes: ['h', 'ea', 't'],         phase: 5, minIntroduced: 1 },
  { word: 'team',  graphemes: ['t', 'ea', 'm'],         phase: 5, minIntroduced: 1 },
  { word: 'bean',  graphemes: ['b', 'ea', 'n'],         phase: 5, minIntroduced: 1 },
  { word: 'read',  graphemes: ['r', 'ea', 'd'],         phase: 5, minIntroduced: 1 },
  { word: 'clean', graphemes: ['c', 'l', 'ea', 'n'],   phase: 5, minIntroduced: 1 },
  // ou words
  { word: 'out',   graphemes: ['ou', 't'],              phase: 5, minIntroduced: 1 },
  { word: 'shout', graphemes: ['sh', 'ou', 't'],        phase: 5, minIntroduced: 1 },
  { word: 'cloud', graphemes: ['c', 'l', 'ou', 'd'],   phase: 5, minIntroduced: 1 },
  { word: 'found', graphemes: ['f', 'ou', 'n', 'd'],   phase: 5, minIntroduced: 1 },
  { word: 'round', graphemes: ['r', 'ou', 'n', 'd'],   phase: 5, minIntroduced: 1 },
  { word: 'loud',  graphemes: ['l', 'ou', 'd'],         phase: 5, minIntroduced: 1 },
  // oy / ie / ir / ue / aw / ew / oe words
  { word: 'boy',   graphemes: ['b', 'oy'],              phase: 5, minIntroduced: 1 },
  { word: 'toy',   graphemes: ['t', 'oy'],              phase: 5, minIntroduced: 1 },
  { word: 'joy',   graphemes: ['j', 'oy'],              phase: 5, minIntroduced: 1 },
  { word: 'tie',   graphemes: ['t', 'ie'],              phase: 5, minIntroduced: 1 },
  { word: 'pie',   graphemes: ['p', 'ie'],              phase: 5, minIntroduced: 1 },
  { word: 'lie',   graphemes: ['l', 'ie'],              phase: 5, minIntroduced: 1 },
  { word: 'bird',  graphemes: ['b', 'ir', 'd'],         phase: 5, minIntroduced: 1 },
  { word: 'girl',  graphemes: ['g', 'ir', 'l'],         phase: 5, minIntroduced: 1 },
  { word: 'shirt', graphemes: ['sh', 'ir', 't'],        phase: 5, minIntroduced: 1 },
  { word: 'stir',  graphemes: ['s', 't', 'ir'],         phase: 5, minIntroduced: 1 },
  { word: 'blue',  graphemes: ['b', 'l', 'ue'],         phase: 5, minIntroduced: 1 },
  { word: 'clue',  graphemes: ['c', 'l', 'ue'],         phase: 5, minIntroduced: 1 },
  { word: 'glue',  graphemes: ['g', 'l', 'ue'],         phase: 5, minIntroduced: 1 },
  { word: 'true',  graphemes: ['t', 'r', 'ue'],         phase: 5, minIntroduced: 1 },
  { word: 'saw',   graphemes: ['s', 'aw'],              phase: 5, minIntroduced: 1 },
  { word: 'claw',  graphemes: ['c', 'l', 'aw'],         phase: 5, minIntroduced: 1 },
  { word: 'draw',  graphemes: ['d', 'r', 'aw'],         phase: 5, minIntroduced: 1 },
  { word: 'jaw',   graphemes: ['j', 'aw'],              phase: 5, minIntroduced: 1 },
  { word: 'paw',   graphemes: ['p', 'aw'],              phase: 5, minIntroduced: 1 },
  { word: 'when',  graphemes: ['wh', 'e', 'n'],         phase: 5, minIntroduced: 1 },
  { word: 'whip',  graphemes: ['wh', 'i', 'p'],         phase: 5, minIntroduced: 1 },
  { word: 'new',   graphemes: ['n', 'ew'],              phase: 5, minIntroduced: 1 },
  { word: 'flew',  graphemes: ['f', 'l', 'ew'],         phase: 5, minIntroduced: 1 },
  { word: 'grew',  graphemes: ['g', 'r', 'ew'],         phase: 5, minIntroduced: 1 },
  { word: 'chew',  graphemes: ['ch', 'ew'],             phase: 5, minIntroduced: 1 },
  { word: 'few',   graphemes: ['f', 'ew'],              phase: 5, minIntroduced: 1 },
  { word: 'toe',   graphemes: ['t', 'oe'],              phase: 5, minIntroduced: 1 },
  { word: 'foe',   graphemes: ['f', 'oe'],              phase: 5, minIntroduced: 1 },
  { word: 'phone', graphemes: ['ph', 'o-e', 'n'],       phase: 5, minIntroduced: 1 },
]

// Returns a word where all graphemes have been introduced, plus 2 distractors
// that share at least one grapheme with the target. Returns null if no eligible
// words or fewer than 3 eligible words exist (BlendingQuestion won't be shown).
export function selectBlendingWord(progressMap) {
  // Phase 2 tracking (for Phase 2/4 word gating)
  const phase2Introduced = new Set(
    phase2
      .filter(p => ['introduced', 'practising', 'mastered'].includes(progressMap[p.grapheme]?.status))
      .map(p => p.grapheme)
  )
  const introCount = phase2Introduced.size
  const practisingOrMasteredCount = phase2.filter(
    p => ['practising', 'mastered'].includes(progressMap[p.grapheme]?.status)
  ).length
  const phase4Unlocked = practisingOrMasteredCount >= 10

  // All-phase tracking (for Phase 5 word gating)
  const allIntroduced = new Set()
  phonics.forEach(p => {
    if (['introduced', 'practising', 'mastered'].includes(progressMap[p.grapheme]?.status)) {
      allIntroduced.add(p.grapheme)
    }
  })

  const eligible = words.filter(w => {
    if (w.phase === 4 && !phase4Unlocked) return false
    if (w.phase === 5) return w.graphemes.every(g => allIntroduced.has(g))
    return w.minIntroduced <= introCount && w.graphemes.every(g => phase2Introduced.has(g))
  })

  if (eligible.length < 3) return null

  const target = eligible[Math.floor(Math.random() * eligible.length)]

  const distractors = eligible
    .filter(w => w.word !== target.word && w.graphemes.some(g => target.graphemes.includes(g)))
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)

  if (distractors.length < 2) return null

  return { wordEntry: target, distractors }
}
