import { useState, useCallback } from 'react'
import { getItem, setItem } from '../../../core/services/storage'
import { TRICKY_WORDS } from '../data/trickyWords'

const STORAGE_KEY = 'graphemeProgress'
const TRICKY_STORAGE_KEY = 'trickyWordProgress'

const THRESHOLDS = { practising: 3, mastered: 7 }
const TRICKY_THRESHOLDS = { familiar: 3, known: 7 }

function defaultEntry() {
  return { status: 'unseen', correctCount: 0, lastSeen: null }
}

function defaultTrickyEntry() {
  return { status: 'unseen', correctCount: 0, lastSeen: null }
}

function deriveStatus(current, correctCount) {
  if (current === 'unseen') return 'unseen'
  if (correctCount >= THRESHOLDS.mastered) return 'mastered'
  if (correctCount >= THRESHOLDS.practising) return 'practising'
  if (current === 'mastered' && correctCount < 5) return 'practising'
  if (current === 'practising' && correctCount < 1) return 'introduced'
  return current
}

function deriveTrickyStatus(current, correctCount) {
  if (current === 'unseen') return 'unseen'
  if (correctCount >= TRICKY_THRESHOLDS.known) return 'known'
  if (correctCount >= TRICKY_THRESHOLDS.familiar) return 'familiar'
  if (current === 'known' && correctCount < 5) return 'familiar'
  if (current === 'familiar' && correctCount < 1) return 'seen'
  return current
}

export function selectNextTrickyWord(trickyProgressMap) {
  // Determine which phase 3 tricky words are unlocked
  const phase2Familiar = TRICKY_WORDS.filter(w => {
    if (w.phase !== 2) return false
    const p = trickyProgressMap[w.word]
    return p && (p.status === 'familiar' || p.status === 'known')
  }).length
  const phase3Unlocked = phase2Familiar >= 3

  const eligible = TRICKY_WORDS.filter(w => {
    if (w.phase === 3 && !phase3Unlocked) return false
    if (w.phase === 4) {
      // Phase 4 tricky words unlock when 3 phase 3 words are familiar/known
      const phase3Familiar = TRICKY_WORDS.filter(tw => {
        if (tw.phase !== 3) return false
        const p = trickyProgressMap[tw.word]
        return p && (p.status === 'familiar' || p.status === 'known')
      }).length
      if (phase3Familiar < 3) return false
    }
    return true
  })

  if (eligible.length === 0) return null

  const seenWords = eligible.filter(w => {
    const p = trickyProgressMap[w.word]
    return p && p.status !== 'unseen'
  })

  // If nothing seen yet, introduce the first eligible word
  if (seenWords.length === 0) {
    const target = eligible[0]
    const pool = eligible.slice(1, 3)
    if (pool.length < 2) return null
    return { targetWord: target, distractors: pool }
  }

  // Words actively being practised: seen or familiar (not yet known)
  const practising = seenWords.filter(w => {
    const p = trickyProgressMap[w.word]
    return p.status === 'seen' || p.status === 'familiar'
  })

  // Gate for introducing a new word: no word still at 'seen' AND under the 5-word cap
  const anyStillSeen = practising.some(w => trickyProgressMap[w.word].status === 'seen')
  const readyForNew = !anyStillSeen && practising.length < 5

  let target
  if (readyForNew) {
    const nextUnseen = eligible.find(w => {
      const p = trickyProgressMap[w.word]
      return !p || p.status === 'unseen'
    })
    // If no new words, pick from seen pool for review (prefer not-yet-known)
    target = nextUnseen ?? seenWords.find(w => {
      const p = trickyProgressMap[w.word]
      return p.status !== 'known'
    }) ?? seenWords[Math.floor(Math.random() * seenWords.length)]
  } else {
    // Focus on words still at 'seen'; occasionally review familiar ones too
    const stillSeen = practising.filter(w => trickyProgressMap[w.word].status === 'seen')
    target = Math.random() < 0.7 && stillSeen.length > 0
      ? stillSeen[Math.floor(Math.random() * stillSeen.length)]
      : seenWords[Math.floor(Math.random() * seenWords.length)]
  }

  // Build distractor pool: other seen words, then upcoming unseen words
  const distractorPool = [
    ...seenWords.filter(w => w.word !== target.word),
    ...eligible.filter(w => {
      const p = trickyProgressMap[w.word]
      return (!p || p.status === 'unseen') && w.word !== target.word
    }),
  ]

  if (distractorPool.length < 2) return null

  const shuffled = [...distractorPool].sort(() => Math.random() - 0.5)
  return { targetWord: target, distractors: shuffled.slice(0, 2) }
}

export function useProgress(userId) {
  const [progressMap, setProgressMap] = useState(() => {
    return getItem(userId, STORAGE_KEY) ?? {}
  })

  const [trickyWordProgressMap, setTrickyWordProgressMap] = useState(() => {
    return getItem(userId, TRICKY_STORAGE_KEY) ?? {}
  })

  function save(updated) {
    setItem(userId, STORAGE_KEY, updated)
    setProgressMap(updated)
  }

  function saveTricky(updated) {
    setItem(userId, TRICKY_STORAGE_KEY, updated)
    setTrickyWordProgressMap(updated)
  }

  function getEntry(grapheme) {
    return progressMap[grapheme] ?? defaultEntry()
  }

  function getTrickyEntry(word) {
    return trickyWordProgressMap[word] ?? defaultTrickyEntry()
  }

  const getProgress = useCallback(
    (grapheme) => getEntry(grapheme),
    [progressMap]
  )

  const recordPresented = useCallback((grapheme) => {
    const entry = getEntry(grapheme)
    if (entry.status !== 'unseen') {
      save({ ...progressMap, [grapheme]: { ...entry, lastSeen: new Date().toISOString() } })
      return
    }
    save({
      ...progressMap,
      [grapheme]: { ...entry, status: 'introduced', lastSeen: new Date().toISOString() },
    })
  }, [progressMap])

  const recordCorrect = useCallback((grapheme) => {
    const entry = getEntry(grapheme)
    const correctCount = entry.correctCount + 1
    const status = deriveStatus(entry.status, correctCount)
    save({
      ...progressMap,
      [grapheme]: { ...entry, correctCount, status, lastSeen: new Date().toISOString() },
    })
  }, [progressMap])

  const recordWrong = useCallback((grapheme) => {
    const entry = getEntry(grapheme)
    const correctCount = Math.max(0, entry.correctCount - 1)
    const status = deriveStatus(entry.status, correctCount)
    save({
      ...progressMap,
      [grapheme]: { ...entry, correctCount, status, lastSeen: new Date().toISOString() },
    })
  }, [progressMap])

  const recordTrickyPresented = useCallback((word) => {
    const entry = getTrickyEntry(word)
    if (entry.status !== 'unseen') {
      saveTricky({ ...trickyWordProgressMap, [word]: { ...entry, lastSeen: new Date().toISOString() } })
      return
    }
    saveTricky({
      ...trickyWordProgressMap,
      [word]: { ...entry, status: 'seen', lastSeen: new Date().toISOString() },
    })
  }, [trickyWordProgressMap])

  const recordTrickyCorrect = useCallback((word) => {
    const entry = getTrickyEntry(word)
    const correctCount = entry.correctCount + 1
    const status = deriveTrickyStatus(entry.status === 'unseen' ? 'seen' : entry.status, correctCount)
    saveTricky({
      ...trickyWordProgressMap,
      [word]: { ...entry, correctCount, status, lastSeen: new Date().toISOString() },
    })
  }, [trickyWordProgressMap])

  const recordTrickyWrong = useCallback((word) => {
    const entry = getTrickyEntry(word)
    const correctCount = Math.max(0, entry.correctCount - 1)
    const status = deriveTrickyStatus(entry.status === 'unseen' ? 'seen' : entry.status, correctCount)
    saveTricky({
      ...trickyWordProgressMap,
      [word]: { ...entry, correctCount, status, lastSeen: new Date().toISOString() },
    })
  }, [trickyWordProgressMap])

  const setGraphemeStatus = useCallback((grapheme, status) => {
    const correctCount = status === 'mastered' ? 7 : status === 'practising' ? 3 : 0
    save({
      ...progressMap,
      [grapheme]: { status, correctCount, lastSeen: new Date().toISOString() },
    })
  }, [progressMap])

  const setTrickyWordStatus = useCallback((word, status) => {
    const correctCount = status === 'known' ? 7 : status === 'familiar' ? 3 : status === 'seen' ? 1 : 0
    saveTricky({
      ...trickyWordProgressMap,
      [word]: { status, correctCount, lastSeen: new Date().toISOString() },
    })
  }, [trickyWordProgressMap])

  return {
    progressMap,
    getProgress,
    recordPresented,
    recordCorrect,
    recordWrong,
    setGraphemeStatus,
    trickyWordProgressMap,
    recordTrickyPresented,
    recordTrickyCorrect,
    recordTrickyWrong,
    setTrickyWordStatus,
  }
}
