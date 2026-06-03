import { MATHS_TOPICS } from '../data/curriculum'

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

// Returns `count` distinct integers near `answer`, within [min, max], excluding answer itself.
function nearbyDistractors(answer, min, max, count) {
  const result = []
  let offset = 1
  while (result.length < count && offset <= 30) {
    const hi = answer + offset
    const lo = answer - offset
    if (hi <= max && !result.includes(hi)) result.push(hi)
    if (result.length < count && lo >= min && !result.includes(lo)) result.push(lo)
    offset++
  }
  return result.slice(0, count)
}

export function selectNextTopic(progressMap) {
  const ordered = MATHS_TOPICS

  const introduced = ordered.filter(t => progressMap[t.id]?.status === 'introduced')
  const practising = ordered.filter(t => progressMap[t.id]?.status === 'practising')
  const mastered   = ordered.filter(t => progressMap[t.id]?.status === 'mastered')

  // Mastered maintenance: 1 in 10, only when active topics also exist
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

  // No introduced — safe to move to next unseen topic
  const nextUnseen = ordered.find(t => !progressMap[t.id] || progressMap[t.id].status === 'unseen')
  if (nextUnseen) {
    if (practising.length > 0 && Math.random() < 0.3) {
      return practising[Math.floor(Math.random() * practising.length)]
    }
    return nextUnseen
  }

  // All topics seen — review practising first, else mastered
  if (practising.length > 0) return practising[Math.floor(Math.random() * practising.length)]
  return mastered[Math.floor(Math.random() * mastered.length)]
}

export function generateQuestion(topic) {
  switch (topic.type) {
    case 'counting': {
      const min = topic.minN ?? 1
      const n = randomInt(min, topic.maxN)
      const distractors = nearbyDistractors(n, Math.max(min - 1, 0), topic.maxN + 2, 2)
      return {
        type: 'counting',
        topicId: topic.id,
        minN: min,
        maxN: topic.maxN,
        n,
        answer: n,
        options: shuffle([n, ...distractors]),
      }
    }
    case 'addition': {
      // Cap each addend at 10 so dots stay manageable even for add_within_20
      const capA = Math.min(topic.maxSum - 1, 10)
      const a = randomInt(1, capA)
      const capB = Math.min(topic.maxSum - a, 10)
      const b = randomInt(1, capB)
      const answer = a + b
      const distractors = nearbyDistractors(answer, 1, topic.maxSum + 2, 2)
      return {
        type: 'addition',
        topicId: topic.id,
        maxSum: topic.maxSum,
        a, b, answer,
        options: shuffle([answer, ...distractors]),
      }
    }
    case 'subtraction': {
      const a = randomInt(2, topic.maxN)
      const b = randomInt(1, a - 1)
      const answer = a - b
      const distractors = nearbyDistractors(answer, 0, topic.maxN, 2)
      return {
        type: 'subtraction',
        topicId: topic.id,
        maxN: topic.maxN,
        a, b, answer,
        options: shuffle([answer, ...distractors]),
      }
    }
    case 'bond': {
      const known = randomInt(1, topic.total - 1)
      const answer = topic.total - known
      const unknownFirst = Math.random() < 0.5
      const distractors = nearbyDistractors(answer, 0, topic.total, 2)
      return {
        type: 'bond',
        topicId: topic.id,
        total: topic.total,
        known, unknownFirst, answer,
        options: shuffle([answer, ...distractors]),
      }
    }
    default:
      return null
  }
}
