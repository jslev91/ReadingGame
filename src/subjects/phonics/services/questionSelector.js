import phonics from '../data/phonics'

const phase2 = phonics.filter(p => p.phase === 2).sort((a, b) => a.order - b.order)
const phase3 = phonics.filter(p => p.phase === 3).sort((a, b) => a.order - b.order)

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
  'ai':       ['ee', 'oa'],
  'ee':       ['ai', 'ea'],
  'igh':      ['i', 'ie'],
  'oa':       ['ow', 'o'],
  'oo_long':  ['oo_short', 'oa'],
  'oo_short': ['oo_long', 'u'],
  'ar':       ['or', 'er'],
  'or':       ['ar', 'aw'],
  'er':       ['ar', 'ir'],
  'ow':       ['oa', 'ou'],
  'oi':       ['oy', 'ow'],
  'ear':      ['air', 'er'],
  'air':      ['ear', 'ar'],
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

  // All introduced candidates (use reference equality so oo variants can distract each other)
  const introduced = phonics.filter(p =>
    p !== correct &&
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
        !isAmbiguous(p.grapheme, correct) &&
        !selected.includes(p)
    )
    while (selected.length < count && fallbacks.length > 0) {
      selected.push(fallbacks.shift())
    }
  }

  return selected
}

function getNextUnseen(progressMap, allowPhase3) {
  const sequence = allowPhase3 ? [...phase2, ...phase3] : phase2
  return sequence.find(p => getStatus(progressMap, p.grapheme) === 'unseen') ?? null
}

// A new grapheme is introduced only when:
//   1. No 'introduced' graphemes remain (all have consolidated to practising/mastered)
//   2. Fewer than 12 graphemes are currently 'practising' (cap active workload)
function canIntroduceNew(progressMap) {
  const introducedCount = phonics.filter(
    p => getStatus(progressMap, p.grapheme) === 'introduced'
  ).length
  if (introducedCount > 0) return false
  const practisingCount = phonics.filter(
    p => getStatus(progressMap, p.grapheme) === 'practising'
  ).length
  return practisingCount < 12
}

// 3 options for introduced, 4 for practising, 5 for mastered
function getOptionCount(progressMap, entry) {
  const status = getStatus(progressMap, entry.grapheme)
  if (status === 'mastered') return 5
  if (status === 'practising') return 4
  return 3
}

export function selectNextQuestion(progressMap) {
  const phase2PractisingOrMastered = countByStatus(progressMap, ['practising', 'mastered'], 2)
  const allowPhase3 = phase2PractisingOrMastered >= 6

  const reviewCandidates = phonics.filter(p =>
    ['introduced', 'practising'].includes(getStatus(progressMap, p.grapheme))
  )

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
  if (reviewCandidates.length > 0 && !canIntroduceNew(progressMap)) {
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
  const nextUnseen = getNextUnseen(progressMap, allowPhase3)
  if (nextUnseen) {
    const optionCount = getOptionCount(progressMap, nextUnseen)
    return { entry: nextUnseen, distractors: pickDistractors(nextUnseen, progressMap, optionCount - 1), isNew: true, optionCount }
  }

  // All graphemes introduced — fall back to review
  const fallback = pickRandom(reviewCandidates.length > 0 ? reviewCandidates : masteredCandidates)
  const optionCount = getOptionCount(progressMap, fallback)
  return { entry: fallback, distractors: pickDistractors(fallback, progressMap, optionCount - 1), isNew: false, optionCount }
}
