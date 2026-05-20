import { useState, useCallback } from 'react'
import { getItem, setItem } from '../services/storage'

const STORAGE_KEY = 'graphemeProgress'

const THRESHOLDS = { introduced: 3, mastered: 7 }

function defaultEntry() {
  return { status: 'unseen', correctCount: 0, lastSeen: null }
}

function nextStatus(current, correctCount) {
  if (current === 'unseen') return 'unseen'
  if (current === 'mastered') return 'mastered'
  if (correctCount >= THRESHOLDS.mastered) return 'mastered'
  if (correctCount >= THRESHOLDS.introduced) return 'practising'
  return current
}

export function useProgress(userId) {
  const [progressMap, setProgressMap] = useState(() => {
    return getItem(userId, STORAGE_KEY) ?? {}
  })

  function save(updated) {
    setItem(userId, STORAGE_KEY, updated)
    setProgressMap(updated)
  }

  function getEntry(grapheme) {
    return progressMap[grapheme] ?? defaultEntry()
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

  return { progressMap, getProgress, recordPresented, recordCorrect, recordWrong }
}
