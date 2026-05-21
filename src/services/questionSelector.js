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

function pickDistractors(correct, progressMap) {
  const introduced = phonics.filter(p =>
    p.grapheme !== correct.grapheme &&
    ['introduced', 'practising', 'mastered'].includes(getStatus(progressMap, p.grapheme))
  )

  const selected = [...introduced].sort(() => Math.random() - 0.5).slice(0, 2)

  // Fill remaining slots from Phase 2 in order if not enough introduced graphemes
  if (selected.length < 2) {
    const fallbacks = phase2.filter(
      p => p.grapheme !== correct.grapheme && !selected.find(s => s.grapheme === p.grapheme)
    )
    while (selected.length < 2 && fallbacks.length > 0) {
      selected.push(fallbacks.shift())
    }
  }

  return selected
}

function getNextUnseen(progressMap, allowPhase3) {
  const sequence = allowPhase3 ? [...phase2, ...phase3] : phase2
  return sequence.find(p => getStatus(progressMap, p.grapheme) === 'unseen') ?? null
}

// A new grapheme is introduced only once the most recently introduced one has
// reached 'practising' (3 correct answers). This paces introductions naturally
// without an arbitrary per-session cap that blocks all further progress.
function canIntroduceNew(progressMap) {
  const introduced = [...phase2, ...phase3].filter(
    p => getStatus(progressMap, p.grapheme) !== 'unseen'
  )
  if (introduced.length === 0) return true

  const lastIntroduced = introduced.sort((a, b) => {
    const ta = progressMap[a.grapheme]?.lastSeen ?? ''
    const tb = progressMap[b.grapheme]?.lastSeen ?? ''
    return tb.localeCompare(ta)
  })[0]

  const status = getStatus(progressMap, lastIntroduced.grapheme)
  return status === 'practising' || status === 'mastered'
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
    return { entry, distractors: pickDistractors(entry, progressMap), isNew: false }
  }

  // Prefer reviewing existing graphemes unless conditions allow a new introduction
  if (reviewCandidates.length > 0 && !canIntroduceNew(progressMap)) {
    const entry = pickRandom(reviewCandidates)
    return { entry, distractors: pickDistractors(entry, progressMap), isNew: false }
  }

  // Introduce next unseen grapheme
  const nextUnseen = getNextUnseen(progressMap, allowPhase3)
  if (nextUnseen) {
    return { entry: nextUnseen, distractors: pickDistractors(nextUnseen, progressMap), isNew: true }
  }

  // All graphemes introduced — fall back to review
  const fallback = pickRandom(reviewCandidates.length > 0 ? reviewCandidates : masteredCandidates)
  return { entry: fallback, distractors: pickDistractors(fallback, progressMap), isNew: false }
}
