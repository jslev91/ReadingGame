import { MATHS_TOPICS } from '../data/curriculum'

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

// Distractors for TimesTableQuestion — nearby products within the same table
function nearbyProductDistractors(a, b, topic, count) {
  const result = []
  let offset = 1
  while (result.length < count && offset <= 20) {
    const hiF = a + offset
    const loF = a - offset
    if (hiF <= topic.maxFactor) result.push(hiF * b)
    if (result.length < count && loF >= topic.minFactor) result.push(loF * b)
    offset++
  }
  return result.slice(0, count)
}

// Distractors for DivisionQuestion — nearby factors within the same table
function nearbyFactorDistractors(a, topic, count) {
  const result = []
  let offset = 1
  while (result.length < count && offset <= 20) {
    const hi = a + offset
    const lo = a - offset
    if (hi <= topic.maxFactor) result.push(hi)
    if (result.length < count && lo >= topic.minFactor) result.push(lo)
    offset++
  }
  return result.slice(0, count)
}

export function selectNextTopic(progressMap) {
  const ordered = MATHS_TOPICS

  const introduced = ordered.filter(t => progressMap[t.id]?.status === 'introduced')
  const practising = ordered.filter(t => progressMap[t.id]?.status === 'practising')
  const mastered   = ordered.filter(t => progressMap[t.id]?.status === 'mastered')

  // Mastered maintenance: 1 in 10, only when other active topics exist
  if (mastered.length > 0 && (introduced.length > 0 || practising.length > 0) && Math.random() < 0.1) {
    return mastered[Math.floor(Math.random() * mastered.length)]
  }

  // Focus on introduced topics; no new introduction while any remain introduced
  if (introduced.length > 0) {
    if (practising.length > 0 && Math.random() < 0.3) {
      return practising[Math.floor(Math.random() * practising.length)]
    }
    return introduced[Math.floor(Math.random() * introduced.length)]
  }

  // No introduced — safe to move to next unseen topic in order
  const nextUnseen = ordered.find(t => !progressMap[t.id] || progressMap[t.id].status === 'unseen')
  if (nextUnseen) {
    if (practising.length > 0 && Math.random() < 0.3) {
      return practising[Math.floor(Math.random() * practising.length)]
    }
    return nextUnseen
  }

  if (practising.length > 0) return practising[Math.floor(Math.random() * practising.length)]
  return mastered[Math.floor(Math.random() * mastered.length)]
}

// kind: 'times_table' | 'division'
// format (division only): 'division' | 'missing-factor'
export function generateQuestion(topic, status, kind = 'times_table', format = null) {
  const optionCount = (status === 'practising' || status === 'mastered') ? 4 : 3
  const a = randomInt(topic.minFactor, topic.maxFactor)
  const fact = { a, b: topic.b, answer: a * topic.b }

  if (kind === 'division') {
    const distractors = nearbyFactorDistractors(fact.a, topic, optionCount - 1)
    return {
      kind: 'division',
      topicId: topic.id,
      fact,
      format: format ?? (Math.random() < 0.5 ? 'division' : 'missing-factor'),
      options: shuffle([fact.a, ...distractors]),
      optionCount,
    }
  }

  const distractors = nearbyProductDistractors(fact.a, fact.b, topic, optionCount - 1)
  return {
    kind: 'times_table',
    topicId: topic.id,
    fact,
    options: shuffle([fact.answer, ...distractors]),
    optionCount,
  }
}
