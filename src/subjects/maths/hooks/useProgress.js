import { useState, useCallback } from 'react'
import { getItem, setItem } from '../../../core/services/storage'

const STORAGE_KEY = 'mathsProgress'
const THRESHOLDS = { practising: 3, mastered: 7 }

function defaultEntry() {
  return { status: 'unseen', correctCount: 0, lastSeen: null }
}

function nextStatus(current, correctCount) {
  if (current === 'unseen' || current === 'mastered') return current
  if (correctCount >= THRESHOLDS.mastered) return 'mastered'
  if (correctCount >= THRESHOLDS.practising) return 'practising'
  return current
}

export function useMathsProgress(userId) {
  const [progressMap, setProgressMap] = useState(() => getItem(userId, STORAGE_KEY) ?? {})

  function save(updated) {
    setItem(userId, STORAGE_KEY, updated)
    setProgressMap(updated)
  }

  function getEntry(topicId) {
    return progressMap[topicId] ?? defaultEntry()
  }

  const recordPresented = useCallback((topicId) => {
    const entry = getEntry(topicId)
    if (entry.status !== 'unseen') {
      save({ ...progressMap, [topicId]: { ...entry, lastSeen: new Date().toISOString() } })
      return
    }
    save({ ...progressMap, [topicId]: { ...entry, status: 'introduced', lastSeen: new Date().toISOString() } })
  }, [progressMap])

  const recordCorrect = useCallback((topicId) => {
    const entry = getEntry(topicId)
    const correctCount = entry.correctCount + 1
    const status = nextStatus(entry.status, correctCount)
    save({ ...progressMap, [topicId]: { ...entry, correctCount, status, lastSeen: new Date().toISOString() } })
  }, [progressMap])

  const recordWrong = useCallback((topicId) => {
    const entry = getEntry(topicId)
    save({ ...progressMap, [topicId]: { ...entry, lastSeen: new Date().toISOString() } })
  }, [progressMap])

  const setTopicStatus = useCallback((topicId, status) => {
    const correctCount = status === 'mastered' ? 7 : status === 'practising' ? 3 : status === 'introduced' ? 1 : 0
    save({ ...progressMap, [topicId]: { status, correctCount, lastSeen: new Date().toISOString() } })
  }, [progressMap])

  return { progressMap, recordPresented, recordCorrect, recordWrong, setTopicStatus }
}
