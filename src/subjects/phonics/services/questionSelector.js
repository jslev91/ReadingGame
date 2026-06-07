import phonics from '../data/phonics'

const phase2 = phonics.filter(p => p.phase === 2).sort((a, b) => a.order - b.order)
const phase3 = phonics.filter(p => p.phase === 3).sort((a, b) => a.order - b.order)
const phase5 = phonics.filter(p => p.phase === 5).sort((a, b) => a.order - b.order)

function getStatus(progressMap, grapheme) {
  return progressMap[grapheme]?.status ?? 'unseen'
}

function countByStatus(progressMap, statuses, phase) {
  const set = phonics.filter(p => !phase || p.phase === phase)
  return set.filter(p => statuses.includes(getStatus(progressMap, p.grapheme))).length
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Graphemes that make the same phoneme — never use as distractors for each other
export const PHONEME_ALIASES = {
  'c': ['k', 'ck'], 'k': ['c', 'ck'], 'ck': ['c', 'k'],
  'f': ['ff'], 'ff': ['f'],
  'l': ['ll'], 'll': ['l'],
  's': ['ss'], 'ss': ['s'],
  'z': ['zz'], 'zz': ['z'],
}

// Phonetically confusable pairs — preferred as distractors when introduced
const CONFUSABLE_PAIRS = {
  'b':        ['d', 'p'],
  'd':        ['b', 'g'],
  'p':        ['b', 't'],
  'm':        ['n'],
  'n':        ['m'],
  'f':        ['v', 'th'],
  'v':        ['f'],
  's':        ['z', 'c'],
  'z':        ['s'],
  'sh':       ['ch', 's'],
  'ch':       ['sh', 'j'],
  'th':       ['f', 'v', 's'],
  'j':        ['ch', 'g'],
  'ai':       ['ee', 'oa', 'ay', 'a-e'],
  'ee':       ['ai', 'ea', 'e-e'],
  'igh':      ['i', 'ie', 'i-e'],
  'oa':       ['ow', 'o', 'oe', 'o-e'],
  'oo_long':  ['oa', 'ue', 'ew', 'u-e'],
  'oo_short': ['u'],
  // Phase 5 — same-sound alternative spellings are the most important confusables
  'ay':  ['ai', 'a-e'],
  'ie':  ['igh', 'i-e'],
  'ea':  ['ee', 'e-e'],
  'oy':  ['oi'],
  'ir':  ['ur', 'er'],
  'ue':  ['oo_long', 'ew', 'u-e'],
  'aw':  ['or', 'au'],
  'oe':  ['oa', 'o-e', 'ow'],
  'ou':  ['ow'],
  'ew':  ['oo_long', 'ue', 'u-e'],
  'au':  ['or', 'aw'],
  'a-e': ['ai', 'ay'],
  'e-e': ['ee', 'ea'],
  'i-e': ['igh', 'ie'],
  'o-e': ['oa', 'oe'],
  'u-e': ['oo_long', 'ue', 'ew'],
  'ar':       ['or', 'er'],
  'or':       ['ar', 'aw'],
  'er':       ['ar', 'ir'],
  'ow':       ['oa', 'ou', 'oe', 'o-e'],
  'oi':       ['oy'],
  'ear':      ['air', 'er'],
  'air':      ['ear', 'ar'],
  'ur':       ['ar', 'ir', 'er'],
  'er':       ['ar', 'ir', 'ur'],
}

// Use audioKey as the lookup key for 'oo' since both entries share grapheme 'oo'
function entryKey(entry) {
  return entry.grapheme === 'oo' ? entry.audioKey : entry.grapheme
}

function isAmbiguous(grapheme, correct) {
  return (PHONEME_ALIASES[correct.grapheme] ?? []).includes(grapheme)
}

function pickDistractors(correct, progressMap, count = 2) {
  const correctKey = entryKey(correct)
  const confusableKeys = CONFUSABLE_PAIRS[correctKey] ?? []

  // Exclude same grapheme string — the two 'oo' entries look identical on screen
  const introduced = phonics.filter(p =>
    p !== correct &&
    p.grapheme !== correct.grapheme &&
    !isAmbiguous(p.grapheme, correct) &&
    ['introduced', 'practising', 'mastered'].includes(getStatus(progressMap, p.grapheme))
  )

  // Prefer confusable entries; fill remainder from non-confusable
  const confusable    = introduced.filter(p =>  confusableKeys.includes(entryKey(p))).sort(() => Math.random() - 0.5)
  const nonConfusable = introduced.filter(p => !confusableKeys.includes(entryKey(p))).sort(() => Math.random() - 0.5)

  const selected = [...confusable, ...nonConfusable].slice(0, count)

  // Fill remaining slots from Phase 2 in order if still not enough
  if (selected.length < count) {
    const fallbacks = phase2.filter(
      p => p !== correct &&
        p.grapheme !== correct.grapheme &&
        !isAmbiguous(p.grapheme, correct) &&
        !selected.includes(p)
    )
    while (selected.length < count && fallbacks.length > 0) {
      selected.push(fallbacks.shift())
    }
  }

  return selected
}

function getNextUnseen(progressMap, allowPhase3, allowPhase5) {
  const sequence = [
    ...phase2,
    ...(allowPhase3 ? phase3 : []),
    ...(allowPhase5 ? phase5 : []),
  ]
  return sequence.find(p => getStatus(progressMap, p.grapheme) === 'unseen') ?? null
}

// Dynamic question weight profiles based on mastered grapheme count
const WEIGHTS_BEGINNER     = { phoneme: 0.70, initial: 0.30, blending: 0,    spelling: 0,    tricky: 0,    reading: 0    }
const WEIGHTS_DEVELOPING   = { phoneme: 0.40, initial: 0.25, blending: 0.15, spelling: 0.10, tricky: 0.05, reading: 0.05 }
const WEIGHTS_INTERMEDIATE = { phoneme: 0.28, initial: 0.20, blending: 0.15, spelling: 0.15, tricky: 0.12, reading: 0.10 }
const WEIGHTS_ADVANCED     = { phoneme: 0.15, initial: 0.15, blending: 0.20, spelling: 0.22, tricky: 0.15, reading: 0.13 }

export function getQuestionWeights(progressMap) {
  const masteredCount = Object.values(progressMap).filter(p => p.status === 'mastered').length
  if (masteredCount >= 20) return WEIGHTS_ADVANCED
  if (masteredCount >= 10) return WEIGHTS_INTERMEDIATE
  if (masteredCount >= 3)  return WEIGHTS_DEVELOPING
  return WEIGHTS_BEGINNER
}

// A new grapheme is introduced only when no 'introduced' graphemes remain.
// pace adjusts how many correct answers are needed before the gate opens:
//   fast: 2 correct (one below normal), slow: 4 correct (one above), normal: 3 (practising threshold)
function canIntroduceNew(progressMap, pace = 'normal') {
  const threshold = pace === 'fast' ? 2 : pace === 'slow' ? 4 : 3
  const unready = phonics.filter(p => {
    const s = getStatus(progressMap, p.grapheme)
    if (s === 'unseen' || s === 'mastered') return false
    return (progressMap[p.grapheme]?.correctCount ?? 0) < threshold
  }).length
  if (unready > 0) return false
  const practisingCount = phonics.filter(p => getStatus(progressMap, p.grapheme) === 'practising').length
  return practisingCount < 12
}

// 3 options for introduced, 4 for practising, 5 for mastered
function getOptionCount(progressMap, entry) {
  const status = getStatus(progressMap, entry.grapheme)
  if (status === 'mastered') return 5
  if (status === 'practising') return 4
  return 3
}

export function selectNextQuestion(progressMap, pace = 'normal') {
  const phase2PractisingOrMastered = countByStatus(progressMap, ['practising', 'mastered'], 2)
  const phase3PractisingOrMastered = countByStatus(progressMap, ['practising', 'mastered'], 3)
  const allowPhase3 = phase2PractisingOrMastered >= 6
  const allowPhase5 = phase3PractisingOrMastered >= 15

  const reviewCandidates = phonics.filter(p => {
    if (p.phase === 5 && !allowPhase5) return false
    return ['introduced', 'practising'].includes(getStatus(progressMap, p.grapheme))
  })

  // Maintenance: mastered graphemes appear ~1 in 10 questions
  const masteredCandidates = phonics.filter(p => getStatus(progressMap, p.grapheme) === 'mastered')
  if (masteredCandidates.length > 0 && Math.random() < 0.1) {
    const entry = pickRandom(masteredCandidates)
    const optionCount = getOptionCount(progressMap, entry)
    return { entry, distractors: pickDistractors(entry, progressMap, optionCount - 1), isNew: false, optionCount }
  }

  // Prefer reviewing existing graphemes unless conditions allow a new introduction.
  // Weight introduced graphemes 70% vs practising 30% so recently-seen sounds
  // get more repetition before the child moves on.
  if (reviewCandidates.length > 0 && !canIntroduceNew(progressMap, pace)) {
    const introducedCandidates = reviewCandidates.filter(p => getStatus(progressMap, p.grapheme) === 'introduced')
    const practisingCandidates = reviewCandidates.filter(p => getStatus(progressMap, p.grapheme) === 'practising')
    let pool = reviewCandidates
    if (introducedCandidates.length > 0 && practisingCandidates.length > 0) {
      pool = Math.random() < 0.7 ? introducedCandidates : practisingCandidates
    } else if (introducedCandidates.length > 0) {
      pool = introducedCandidates
    }
    const entry = pickRandom(pool)
    const optionCount = getOptionCount(progressMap, entry)
    return { entry, distractors: pickDistractors(entry, progressMap, optionCount - 1), isNew: false, optionCount }
  }

  // Introduce next unseen grapheme
  const nextUnseen = getNextUnseen(progressMap, allowPhase3, allowPhase5)
  if (nextUnseen) {
    const optionCount = getOptionCount(progressMap, nextUnseen)
    return { entry: nextUnseen, distractors: pickDistractors(nextUnseen, progressMap, optionCount - 1), isNew: true, optionCount }
  }

  // All graphemes introduced — fall back to review
  const fallback = pickRandom(reviewCandidates.length > 0 ? reviewCandidates : masteredCandidates)
  const optionCount = getOptionCount(progressMap, fallback)
  return { entry: fallback, distractors: pickDistractors(fallback, progressMap, optionCount - 1), isNew: false, optionCount }
}
