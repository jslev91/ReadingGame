import { useState, useCallback } from 'react'
import { getItem, setItem } from '../services/storage'

const WINDOW_SIZE = 20
const MIN_ANSWERS = 5

export function usePerformance(userId, subject) {
  const storageKey = `${subject}:recentPerformance`
  const [data, setData] = useState(() => getItem(userId, storageKey) ?? { window: [], rate: null })

  const recordAnswer = useCallback((correct) => {
    const window = [...data.window, correct].slice(-WINDOW_SIZE)
    const rate = window.length >= MIN_ANSWERS
      ? window.filter(Boolean).length / window.length
      : null
    const updated = { window, rate }
    setItem(userId, storageKey, updated)
    setData(updated)
  }, [data, userId, storageKey])

  const introductionPace =
    data.rate === null ? 'normal' :
    data.rate > 0.85   ? 'fast' :
    data.rate < 0.55   ? 'slow' :
    'normal'

  return { recentRate: data.rate, introductionPace, recordAnswer }
}
