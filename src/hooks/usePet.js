import { useState, useEffect } from 'react'
import { getItem } from '../data/items'
import { getItem as getStorageItem, setItem } from '../services/storage'

const STORAGE_KEY = 'petState'

const DECAY = {
  energy:      { intervalMs: 5  * 60 * 1000, rate: 1 },
  hunger:      { intervalMs: 8  * 60 * 1000, rate: 1 },
  cleanliness: { intervalMs: 20 * 60 * 1000, rate: 1 },
}

const DEFAULTS = {
  energy:      { value: 70, max: 100 },
  hunger:      { value: 80, max: 100 },
  cleanliness: { value: 90, max: 100 },
  coins: 0,
  lastDecayTimestamp: null,
  activeItems: [],
  inventory: { tools: [], cosmetics: [] },
}

function applyDecay(stats) {
  if (!stats.lastDecayTimestamp) return stats
  const elapsed = Date.now() - new Date(stats.lastDecayTimestamp).getTime()
  const now = Date.now()

  // Remove expired items
  const activeItems = (stats.activeItems ?? []).filter(
    inst => new Date(inst.expiresAt).getTime() > now
  )

  // Calculate hunger delta: active food items provide gain instead of decay
  const foodActive = activeItems.some(inst => {
    const def = getItem(inst.itemId)
    return def?.effect?.stat === 'hunger'
  })

  let hungerDelta
  if (foodActive) {
    const totalRatePerMs = activeItems.reduce((sum, inst) => {
      const def = getItem(inst.itemId)
      if (def?.effect?.stat !== 'hunger') return sum
      return sum + def.effect.ratePerMinute / 60000
    }, 0)
    hungerDelta = Math.floor(elapsed * totalRatePerMs)
  } else {
    hungerDelta = -Math.floor(elapsed / DECAY.hunger.intervalMs)
  }

  return {
    ...stats,
    activeItems,
    energy: {
      ...stats.energy,
      value: Math.max(0, stats.energy.value - Math.floor(elapsed / DECAY.energy.intervalMs)),
    },
    hunger: {
      ...stats.hunger,
      value: Math.min(stats.hunger.max, Math.max(0, stats.hunger.value + hungerDelta)),
    },
    cleanliness: {
      ...stats.cleanliness,
      value: Math.max(0, stats.cleanliness.value - Math.floor(elapsed / DECAY.cleanliness.intervalMs)),
    },
  }
}

function deriveMood(stats) {
  const avg = (stats.energy.value + stats.hunger.value + stats.cleanliness.value) / 3
  if (avg > 60) return 'happy'
  if (avg > 30) return 'okay'
  return 'sad'
}

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function usePet(userId) {
  const [stats, setStats] = useState(() => {
    const raw = getStorageItem(userId, STORAGE_KEY) ?? {}
    const saved = {
      ...DEFAULTS,
      ...raw,
      inventory: { ...DEFAULTS.inventory, ...(raw.inventory ?? {}) },
    }
    return applyDecay(saved)
  })

  // Live tick: check for expired items and accumulate stat changes.
  // Only resets lastDecayTimestamp when something actually changed — this lets
  // elapsed time keep accumulating across ticks until it crosses an integer
  // boundary (e.g. 2 minutes for hunger gain at 0.5/min).
  useEffect(() => {
    const id = setInterval(() => {
      setStats(prev => {
        const next = applyDecay(prev)
        const itemsExpired = next.activeItems.length !== prev.activeItems.length
        const statsChanged = (
          next.energy.value      !== prev.energy.value ||
          next.hunger.value      !== prev.hunger.value ||
          next.cleanliness.value !== prev.cleanliness.value
        )
        if (itemsExpired || statsChanged) {
          const withTs = { ...next, lastDecayTimestamp: new Date().toISOString() }
          setItem(userId, STORAGE_KEY, withTs)
          return withTs
        }
        return prev
      })
    }, 10000)
    return () => clearInterval(id)
  }, [userId])

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

  function canAfford(itemId) {
    const def = getItem(itemId)
    return def ? stats.coins >= def.cost : false
  }

  function canPurchase(itemId) {
    const def = getItem(itemId)
    if (!def) return { canBuy: false, reason: 'unknown_item' }
    if (def.comingSoon) return { canBuy: false, reason: 'coming_soon' }
    if (stats.coins < def.cost) return { canBuy: false, reason: 'insufficient_coins' }
    if (def.type === 'consumable') {
      const activeCount = stats.activeItems.filter(i => i.itemId === itemId).length
      if (activeCount >= def.maxActive) return { canBuy: false, reason: 'already_active' }
    }
    if (def.type === 'tool' && stats.inventory.tools.includes(itemId)) {
      return { canBuy: false, reason: 'already_owned' }
    }
    if (def.type === 'cosmetic' && stats.inventory.cosmetics.includes(itemId)) {
      return { canBuy: false, reason: 'already_owned' }
    }
    return { canBuy: true }
  }

  function purchaseItem(itemId) {
    const { canBuy, reason } = canPurchase(itemId)
    if (!canBuy) return { success: false, reason }

    const def = getItem(itemId)
    const next = { ...stats, coins: stats.coins - def.cost }

    if (def.type === 'consumable') {
      const now = Date.now()
      const expiresAt = new Date(now + def.effect.duration * 60 * 1000).toISOString()
      next.activeItems = [
        ...stats.activeItems,
        {
          instanceId: uuid(),
          itemId,
          x: 10 + Math.floor(Math.random() * 71),
          placedAt: new Date(now).toISOString(),
          expiresAt,
        },
      ]
    } else if (def.type === 'tool') {
      next.inventory = { ...stats.inventory, tools: [...stats.inventory.tools, itemId] }
    } else if (def.type === 'cosmetic') {
      next.inventory = { ...stats.inventory, cosmetics: [...stats.inventory.cosmetics, itemId] }
    }

    save(next)
    return { success: true }
  }

  return { stats, mood: deriveMood(stats), onCorrect, onWrong, canAfford, canPurchase, purchaseItem }
}
