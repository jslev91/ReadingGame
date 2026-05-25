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
  poops: [],
  nextPoopAt: null,
}

function randomPoopDelay() {
  // 45–90 minutes in ms
  return (45 + Math.floor(Math.random() * 46)) * 60 * 1000
}

function applyDecay(stats) {
  const now = Date.now()

  // Schedule first poop if not yet set
  let nextPoopAt = stats.nextPoopAt
  if (!nextPoopAt) {
    nextPoopAt = new Date(now + randomPoopDelay()).toISOString()
  }

  // Generate poop if due
  let poops = stats.poops ?? []
  if (new Date(nextPoopAt).getTime() <= now) {
    if (poops.length < 3) {
      poops = [
        ...poops,
        { id: uuid(), x: 5 + Math.floor(Math.random() * 81), placedAt: new Date(now).toISOString() },
      ]
    }
    // Always advance nextPoopAt whether or not a poop was placed
    nextPoopAt = new Date(now + randomPoopDelay()).toISOString()
  }

  if (!stats.lastDecayTimestamp) {
    return { ...stats, poops, nextPoopAt }
  }

  const elapsed = now - new Date(stats.lastDecayTimestamp).getTime()

  // Remove expired active items
  const activeItems = (stats.activeItems ?? []).filter(
    inst => new Date(inst.expiresAt).getTime() > now
  )

  // Hunger: food active → gain, else → decay
  const foodActive = activeItems.some(inst => getItem(inst.itemId)?.effect?.stat === 'hunger')
  let hungerDelta
  if (foodActive) {
    const ratePerMs = activeItems.reduce((sum, inst) => {
      const def = getItem(inst.itemId)
      if (def?.effect?.stat !== 'hunger') return sum
      return sum + def.effect.ratePerMinute / 60000
    }, 0)
    hungerDelta = Math.floor(elapsed * ratePerMs)
  } else {
    hungerDelta = -Math.floor(elapsed / DECAY.hunger.intervalMs)
  }

  // Cleanliness: bath active → gain; poop present → faster decay
  const bathActive = activeItems.some(inst => getItem(inst.itemId)?.effect?.stat === 'cleanliness')
  let cleanlinessDelta
  if (bathActive) {
    const ratePerMs = activeItems.reduce((sum, inst) => {
      const def = getItem(inst.itemId)
      if (def?.effect?.stat !== 'cleanliness') return sum
      return sum + def.effect.ratePerMinute / 60000
    }, 0)
    cleanlinessDelta = Math.floor(elapsed * ratePerMs)
  } else {
    // Each poop multiplies decay by ×1.5 (stackable)
    const multiplier = Math.pow(1.5, poops.length)
    const effectiveIntervalMs = DECAY.cleanliness.intervalMs / multiplier
    cleanlinessDelta = -Math.floor(elapsed / effectiveIntervalMs)
  }

  return {
    ...stats,
    activeItems,
    poops,
    nextPoopAt,
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
      value: Math.min(stats.cleanliness.max, Math.max(0, stats.cleanliness.value + cleanlinessDelta)),
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

  // Live tick: check for expired items, new poops, and accumulated stat changes.
  // Only resets lastDecayTimestamp when something changed, letting elapsed time
  // accumulate across ticks until it's large enough to produce an integer change.
  useEffect(() => {
    const id = setInterval(() => {
      setStats(prev => {
        const next = applyDecay(prev)
        const changed = (
          next.activeItems.length    !== prev.activeItems.length  ||
          next.poops.length          !== prev.poops.length        ||
          next.nextPoopAt            !== prev.nextPoopAt          ||
          next.energy.value          !== prev.energy.value        ||
          next.hunger.value          !== prev.hunger.value        ||
          next.cleanliness.value     !== prev.cleanliness.value
        )
        if (changed) {
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

  function removePoop(poopId) {
    save({
      ...stats,
      poops: stats.poops.filter(p => p.id !== poopId),
      cleanliness: {
        ...stats.cleanliness,
        value: Math.min(stats.cleanliness.max, stats.cleanliness.value + 5),
      },
    })
  }

  return {
    stats,
    mood: deriveMood(stats),
    onCorrect,
    onWrong,
    canAfford,
    canPurchase,
    purchaseItem,
    removePoop,
  }
}
