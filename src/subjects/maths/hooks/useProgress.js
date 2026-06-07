import { useState, useCallback } from 'react'
import { getItem, setItem } from '../../../core/services/storage'
import { BANDS, getBand } from '../data/curriculum'

const TOPIC_KEY = 'mathsProgress'
const BAND_KEY  = 'mathsBandProgress'

const TOPIC_THRESHOLDS = { practising: 3, mastered: 7 }
const BAND_THRESHOLDS  = { practising: 5, mastered: 15 }

function defaultEntry() {
  return { status: 'unseen', correctCount: 0, lastSeen: null }
}

function nextStatus(current, correctCount, thresholds) {
  if (current === 'unseen' || current === 'mastered') return current
  if (correctCount >= thresholds.mastered) return 'mastered'
  if (correctCount >= thresholds.practising) return 'practising'
  return current
}

// Band gating rules
function isBandEligible(band, bandProgressMap) {
  const status = id => bandProgressMap[id]?.status ?? 'unseen'
  switch (band.id) {
    case 'add-1': return true
    case 'add-2': return status('add-1') === 'practising' || status('add-1') === 'mastered'
    case 'add-3': return status('add-2') === 'practising' || status('add-2') === 'mastered'
    case 'sub-1': return status('add-1') === 'practising' || status('add-1') === 'mastered'
    case 'sub-2': return status('sub-1') === 'practising' || status('sub-1') === 'mastered'
    case 'sub-3': return status('sub-2') === 'practising' || status('sub-2') === 'mastered'
    default: return false
  }
}

export function selectNextBand(bandProgressMap, pace = 'normal') {
  const eligible = BANDS.filter(b => isBandEligible(b, bandProgressMap))
  if (eligible.length === 0) return getBand('add-1')

  const introduced = eligible.filter(b => bandProgressMap[b.id]?.status === 'introduced')
  const practising = eligible.filter(b => bandProgressMap[b.id]?.status === 'practising')
  const mastered   = eligible.filter(b => bandProgressMap[b.id]?.status === 'mastered')

  // Mastered maintenance: 1 in 10
  if (mastered.length > 0 && (introduced.length > 0 || practising.length > 0) && Math.random() < 0.1) {
    return mastered[Math.floor(Math.random() * mastered.length)]
  }

  // Focus on introduced; pace-adjusted gate for introducing next band
  if (introduced.length > 0) {
    if (practising.length > 0 && Math.random() < 0.3) {
      return practising[Math.floor(Math.random() * practising.length)]
    }
    return introduced[Math.floor(Math.random() * introduced.length)]
  }

  // Can introduce next unseen eligible band based on pace
  const threshold = pace === 'fast' ? 4 : pace === 'slow' ? 6 : 5
  const readyToIntroduce = practising.length === 0 || practising.every(b =>
    (bandProgressMap[b.id]?.correctCount ?? 0) >= threshold
  )

  const nextUnseen = eligible.find(b => !bandProgressMap[b.id] || bandProgressMap[b.id].status === 'unseen')
  if (nextUnseen && readyToIntroduce) {
    if (practising.length > 0 && Math.random() < 0.3) {
      return practising[Math.floor(Math.random() * practising.length)]
    }
    return nextUnseen
  }

  if (practising.length > 0) return practising[Math.floor(Math.random() * practising.length)]
  if (mastered.length > 0) return mastered[Math.floor(Math.random() * mastered.length)]
  return getBand('add-1')
}

export function useMathsProgress(userId) {
  const [progressMap, setProgressMap] = useState(() => getItem(userId, TOPIC_KEY) ?? {})
  const [bandProgressMap, setBandProgressMap] = useState(() => getItem(userId, BAND_KEY) ?? {})

  function saveTopic(updated) {
    setItem(userId, TOPIC_KEY, updated)
    setProgressMap(updated)
  }

  function saveBand(updated) {
    setItem(userId, BAND_KEY, updated)
    setBandProgressMap(updated)
  }

  function getTopicEntry(topicId) {
    return progressMap[topicId] ?? defaultEntry()
  }

  function getBandEntry(bandId) {
    return bandProgressMap[bandId] ?? defaultEntry()
  }

  const recordPresented = useCallback((topicId) => {
    const entry = getTopicEntry(topicId)
    if (entry.status !== 'unseen') {
      saveTopic({ ...progressMap, [topicId]: { ...entry, lastSeen: new Date().toISOString() } })
      return
    }
    saveTopic({ ...progressMap, [topicId]: { ...entry, status: 'introduced', lastSeen: new Date().toISOString() } })
  }, [progressMap])

  const recordCorrect = useCallback((topicId) => {
    const entry = getTopicEntry(topicId)
    const correctCount = entry.correctCount + 1
    const status = nextStatus(entry.status, correctCount, TOPIC_THRESHOLDS)
    saveTopic({ ...progressMap, [topicId]: { ...entry, correctCount, status, lastSeen: new Date().toISOString() } })
  }, [progressMap])

  const recordWrong = useCallback((topicId) => {
    const entry = getTopicEntry(topicId)
    saveTopic({ ...progressMap, [topicId]: { ...entry, lastSeen: new Date().toISOString() } })
  }, [progressMap])

  const setTopicStatus = useCallback((topicId, status) => {
    const correctCount = status === 'mastered' ? 7 : status === 'practising' ? 3 : status === 'introduced' ? 1 : 0
    saveTopic({ ...progressMap, [topicId]: { status, correctCount, lastSeen: new Date().toISOString() } })
  }, [progressMap])

  const recordBandPresented = useCallback((bandId) => {
    const entry = getBandEntry(bandId)
    if (entry.status !== 'unseen') {
      saveBand({ ...bandProgressMap, [bandId]: { ...entry, lastSeen: new Date().toISOString() } })
      return
    }
    saveBand({ ...bandProgressMap, [bandId]: { ...entry, status: 'introduced', lastSeen: new Date().toISOString() } })
  }, [bandProgressMap])

  const recordBandCorrect = useCallback((bandId) => {
    const entry = getBandEntry(bandId)
    const correctCount = entry.correctCount + 1
    const status = nextStatus(entry.status, correctCount, BAND_THRESHOLDS)
    saveBand({ ...bandProgressMap, [bandId]: { ...entry, correctCount, status, lastSeen: new Date().toISOString() } })
  }, [bandProgressMap])

  const recordBandWrong = useCallback((bandId) => {
    const entry = getBandEntry(bandId)
    saveBand({ ...bandProgressMap, [bandId]: { ...entry, lastSeen: new Date().toISOString() } })
  }, [bandProgressMap])

  const setBandStatus = useCallback((bandId, status) => {
    const correctCount = status === 'mastered' ? 15 : status === 'practising' ? 5 : status === 'introduced' ? 1 : 0
    saveBand({ ...bandProgressMap, [bandId]: { status, correctCount, lastSeen: new Date().toISOString() } })
  }, [bandProgressMap])

  const getBandProgress = useCallback((bandId) => getBandEntry(bandId), [bandProgressMap])

  return {
    progressMap, recordPresented, recordCorrect, recordWrong, setTopicStatus,
    bandProgressMap, getBandProgress, recordBandPresented, recordBandCorrect, recordBandWrong, setBandStatus,
  }
}
