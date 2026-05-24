import { useState } from 'react'
import { getItem, setItem } from '../services/storage'

const DECAY_RATE = 1          // energy lost per interval
const DECAY_INTERVAL_MS = 5 * 60 * 1000  // 5 minutes
const DEFAULT_ENERGY = 70

function calcDecay(energy, lastSavedAt) {
  if (!lastSavedAt) return energy
  const elapsed = Date.now() - lastSavedAt
  const intervals = Math.floor(elapsed / DECAY_INTERVAL_MS)
  return Math.max(0, energy - intervals * DECAY_RATE)
}

function deriveMood(energy) {
  if (energy > 60) return 'happy'
  if (energy > 30) return 'okay'
  return 'sad'
}

export function usePet(userId) {
  const [energy, setEnergy] = useState(() => {
    const saved = getItem(userId, 'petEnergy') ?? DEFAULT_ENERGY
    const lastSavedAt = getItem(userId, 'petLastSavedAt')
    const decayed = calcDecay(saved, lastSavedAt)
    return decayed
  })

  function updateEnergy(next) {
    const clamped = Math.min(100, Math.max(0, next))
    setItem(userId, 'petEnergy', clamped)
    setItem(userId, 'petLastSavedAt', Date.now())
    setEnergy(clamped)
  }

  function onCorrect() {
    updateEnergy(energy + 10)
  }

  function onWrong() {
    updateEnergy(energy - 5)
  }

  return { energy, mood: deriveMood(energy), onCorrect, onWrong }
}
