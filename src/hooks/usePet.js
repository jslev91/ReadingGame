import { useState, useEffect, useRef } from 'react'
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

function randomPoopDelay(fast = false) {
  // 22–45 min when cleanliness is 0, else 45–90 min
  const min = fast ? 22 : 45
  const range = fast ? 24 : 46
  return (min + Math.floor(Math.random() * range)) * 60 * 1000
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
  const dirtyHabitat = (stats.cleanliness?.value ?? 100) === 0
  if (new Date(nextPoopAt).getTime() <= now) {
    if (poops.length < 3) {
      poops = [
        ...poops,
        { id: uuid(), x: 5 + Math.floor(Math.random() * 81), placedAt: new Date(now).toISOString() },
      ]
    }
    // Always advance nextPoopAt whether or not a poop was placed
    nextPoopAt = new Date(now + randomPoopDelay(dirtyHabitat)).toISOString()
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
  if (stats.hunger.value === 0) return 'sad'
  const avg = (stats.energy.value + stats.hunger.value + stats.cleanliness.value) / 3
  if (avg > 60) return 'happy'
  if (avg > 30) return 'okay'
  return 'sad'
}

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function usePet(userId) {
  // Remember what was in storage before applyDecay ran, so the mount effect
  // can detect whether a poop was generated and needs immediate persistence.
  const savedRef = useRef(null)

  const [stats, setStats] = useState(() => {
    const raw = getStorageItem(userId, STORAGE_KEY) ?? {}
    const rawInv = raw.inventory ?? {}
    // Migrate tools from legacy string array to object array
    const rawTools = rawInv.tools ?? []
    const tools = rawTools.map(t =>
      typeof t === 'string' ? { id: t, usesRemaining: 10 } : t
    )
    const saved = {
      ...DEFAULTS,
      ...raw,
      inventory: { ...DEFAULTS.inventory, ...rawInv, tools },
    }
    savedRef.current = saved
    return applyDecay(saved)
  })

  // If applyDecay generated a poop or advanced nextPoopAt on mount, persist it
  // immediately. Without this, the poop only reaches localStorage when the tick
  // detects a numeric stat change — which never happens if all stats are at 0.
  useEffect(() => {
    const saved = savedRef.current
    if (
      stats.poops.length !== (saved.poops?.length ?? 0) ||
      stats.nextPoopAt !== saved.nextPoopAt
    ) {
      setItem(userId, STORAGE_KEY, { ...stats, lastDecayTimestamp: new Date().toISOString() })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Live tick: check for expired items, new poops, and accumulated stat changes.
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

  // Use functional updates in save so it always reads the latest state rather than
  // a potentially stale closure value. This prevents onCorrect/onWrong from
  // overwriting a poop that the tick just added to state.
  function save(updater) {
    setStats(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      const withTimestamp = { ...next, lastDecayTimestamp: new Date().toISOString() }
      setItem(userId, STORAGE_KEY, withTimestamp)
      return withTimestamp
    })
  }

  function onCorrect(coinReward = 1) {
    save(prev => ({
      ...prev,
      coins: prev.coins + coinReward,
      energy: { ...prev.energy, value: Math.min(prev.energy.max, prev.energy.value + 3) },
    }))
  }

  function onWrong() {
    save(prev => ({
      ...prev,
      energy: { ...prev.energy, value: Math.max(0, prev.energy.value - 3) },
    }))
  }

  function canAfford(itemId) {
    const def = getItem(itemId)
    return def ? stats.coins >= def.cost : false
  }

  function hasTool(id) {
    return (stats.inventory.tools ?? []).some(t => t.id === id)
  }

  function getToolUses(id) {
    const tool = (stats.inventory.tools ?? []).find(t => t.id === id)
    return tool ? tool.usesRemaining : null
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
    if (def.type === 'tool') {
      const tool = (stats.inventory.tools ?? []).find(t => t.id === itemId)
      if (tool && tool.usesRemaining > 0) return { canBuy: false, reason: 'already_owned' }
    }
    if (def.type === 'cosmetic') {
      const activeCount = stats.activeItems.filter(i => i.itemId === itemId).length
      if (activeCount >= def.maxActive) return { canBuy: false, reason: 'already_active' }
    }
    return { canBuy: true }
  }

  function purchaseItem(itemId) {
    const { canBuy, reason } = canPurchase(itemId)
    if (!canBuy) return { success: false, reason }

    const def = getItem(itemId)
    save(prev => {
      const next = { ...prev, coins: prev.coins - def.cost }
      if (def.type === 'consumable' || def.type === 'cosmetic') {
        const now = Date.now()
        const expiresAt = new Date(now + def.effect.duration * 60 * 1000).toISOString()
        next.activeItems = [
          ...prev.activeItems,
          {
            instanceId: uuid(),
            itemId,
            x: 10 + Math.floor(Math.random() * 71),
            placedAt: new Date(now).toISOString(),
            expiresAt,
          },
        ]
      } else if (def.type === 'tool') {
        const existing = (prev.inventory.tools ?? []).filter(t => t.id !== itemId)
        next.inventory = {
          ...prev.inventory,
          tools: [...existing, { id: itemId, usesRemaining: def.maxUses ?? 10 }],
        }
      }
      return next
    })
    return { success: true }
  }

  function removePoop(poopId) {
    save(prev => {
      const tools = (prev.inventory.tools ?? []).map(t =>
        t.id === 'shovel' ? { ...t, usesRemaining: t.usesRemaining - 1 } : t
      ).filter(t => t.usesRemaining > 0)
      return {
        ...prev,
        poops: prev.poops.filter(p => p.id !== poopId),
        cleanliness: {
          ...prev.cleanliness,
          value: Math.min(prev.cleanliness.max, prev.cleanliness.value + 5),
        },
        inventory: { ...prev.inventory, tools },
      }
    })
  }

  return {
    stats,
    mood: deriveMood(stats),
    jimmySleeping: stats.energy.value === 0,
    onCorrect,
    onWrong,
    canAfford,
    canPurchase,
    purchaseItem,
    removePoop,
    hasTool,
    getToolUses,
  }
}
