import { useState, useCallback } from 'react'
import { getItem, setItem } from '../core/services/storage'
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

function nextStatus(current, correctCount) {
  if (current === 'unseen') return 'unseen'
  if (current === 'mastered') return 'mastered'
  if (correctCount >= THRESHOLDS.mastered) return 'mastered'
  if (correctCount >= THRESHOLDS.practising) return 'practising'
  return current
}

function nextTrickyStatus(current, correctCount) {
  if (current === 'unseen') return 'unseen'
  if (current === 'known') return 'known'
  if (correctCount >= TRICKY_THRESHOLDS.known) return 'known'
  if (correctCount >= TRICKY_THRESHOLDS.familiar) return 'familiar'
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

  // Find the most recently introduced word that hasn't reached familiar yet —
  // that is the "current" word. If it has reached familiar, introduce the next unseen one.
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

  // Check if the most recently introduced word has reached familiar — if so, introduce next
  const lastIntroduced = seenWords[seenWords.length - 1]
  const lastProgress = trickyProgressMap[lastIntroduced.word]
  const readyForNew = lastProgress.status === 'familiar' || lastProgress.status === 'known'

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
    // Weight toward the current word (not yet familiar) but occasionally review older ones
    const notFamiliar = seenWords.filter(w => {
      const p = trickyProgressMap[w.word]
      return p.status !== 'familiar' && p.status !== 'known'
    })
    target = Math.random() < 0.7
      ? notFamiliar[Math.floor(Math.random() * notFamiliar.length)]
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
    const status = nextStatus(entry.status, correctCount)
    save({
      ...progressMap,
      [grapheme]: { ...entry, correctCount, status, lastSeen: new Date().toISOString() },
    })
  }, [progressMap])

  const recordWrong = useCallback((grapheme) => {
    const entry = getEntry(grapheme)
    save({
      ...progressMap,
      [grapheme]: { ...entry, lastSeen: new Date().toISOString() },
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
    const status = nextTrickyStatus(entry.status === 'unseen' ? 'seen' : entry.status, correctCount)
    saveTricky({
      ...trickyWordProgressMap,
      [word]: { ...entry, correctCount, status, lastSeen: new Date().toISOString() },
    })
  }, [trickyWordProgressMap])

  const recordTrickyWrong = useCallback((word) => {
    const entry = getTrickyEntry(word)
    saveTricky({
      ...trickyWordProgressMap,
      [word]: { ...entry, lastSeen: new Date().toISOString() },
    })
  }, [trickyWordProgressMap])

  const setGraphemeStatus = useCallback((grapheme, status) => {
    const correctCount = status === 'mastered' ? 7 : status === 'practising' ? 3 : 0
    save({
      ...progressMap,
      [grapheme]: { status, correctCount, lastSeen: new Date().toISOString() },
    })
  }, [progressMap])

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
  }
}
