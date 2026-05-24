import { useState } from 'react'
import { getItem, setItem } from '../services/storage'

const STORAGE_KEY = 'petState'

const DECAY = {
  energy: { intervalMs: 5 * 60 * 1000,  rate: 1 },
  hunger: { intervalMs: 8 * 60 * 1000,  rate: 1 },
  social: { intervalMs: 20 * 60 * 1000, rate: 1 },
}

const DEFAULTS = {
  energy: { value: 70, max: 100 },
  hunger: { value: 80, max: 100 },
  social: { value: 90, max: 100 },
  coins: 0,
  lastDecayTimestamp: null,
}

function applyDecay(stats) {
  if (!stats.lastDecayTimestamp) return stats
  const elapsed = Date.now() - new Date(stats.lastDecayTimestamp).getTime()
  return {
    ...stats,
    energy: {
      ...stats.energy,
      value: Math.max(0, stats.energy.value - Math.floor(elapsed / DECAY.energy.intervalMs)),
    },
    hunger: {
      ...stats.hunger,
      value: Math.max(0, stats.hunger.value - Math.floor(elapsed / DECAY.hunger.intervalMs)),
    },
    social: {
      ...stats.social,
      value: Math.max(0, stats.social.value - Math.floor(elapsed / DECAY.social.intervalMs)),
    },
  }
}

function deriveMood(stats) {
  const avg = (stats.energy.value + stats.hunger.value + stats.social.value) / 3
  if (avg > 60) return 'happy'
  if (avg > 30) return 'okay'
  return 'sad'
}

export function usePet(userId) {
  const [stats, setStats] = useState(() => {
    const saved = getItem(userId, STORAGE_KEY) ?? DEFAULTS
    return applyDecay(saved)
  })

  function save(next) {
    const withTimestamp = { ...next, lastDecayTimestamp: new Date().toISOString() }
    setItem(userId, STORAGE_KEY, withTimestamp)
    setStats(withTimestamp)
  }

  function onCorrect() {
    save({
      ...stats,
      coins: stats.coins + 1,
      energy: { ...stats.energy, value: Math.min(stats.energy.max, stats.energy.value + 5) },
    })
  }

  function onWrong() {
    save({
      ...stats,
      energy: { ...stats.energy, value: Math.max(0, stats.energy.value - 3) },
    })
  }

  return { stats, mood: deriveMood(stats), onCorrect, onWrong }
}
