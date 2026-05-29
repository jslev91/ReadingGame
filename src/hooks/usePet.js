import { useState, useEffect, useRef } from 'react'
import { getItem } from '../data/items'
import { getItem as getStorageItem, setItem } from '../core/services/storage'

const STORAGE_KEY = 'petState'

// TEST_MODE: append ?testMode=1 to the URL to compress all timings by 300×.
// Works on any build including the deployed PWA — no code change or rebuild needed.
const TEST_MODE = typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('testMode') === '1'
const T = TEST_MODE ? 300 : 1  // time compression factor

const DAY_MS = 24 * 60 * 60 * 1000
const DECAY = {
  energy:      { intervalMs: DAY_MS / 70 / T },  // 70 pts lost per day
  hunger:      { intervalMs: DAY_MS / 50 / T },  // 50 pts lost per day
  cleanliness: { intervalMs: DAY_MS / 20 / T },  // 20 pts lost per day (base, before poop multiplier)
}

const DEFAULTS = {
  energy:      { value: 70, max: 100 },
  hunger:      { value: 80, max: 100 },
  cleanliness: { value: 90, max: 100 },
  coins: 0,
  lastDecayTimestamp: null,
  // Sub-integer remainders carried forward across ticks so slow stats
  // accumulate correctly even when faster stats reset the timestamp.
  pendingDecay: { energy: 0, hunger: 0, cleanliness: 0 },
  activeItems: [],
  inventory: { tools: [], cosmetics: [] },
  poops: [],
  nextPoopAt: null,
}

function randomPoopDelay(fast = false) {
  // 22–45 min when cleanliness is 0, else 45–90 min (compressed by T in test mode)
  const min = fast ? 22 : 45
  const range = fast ? 24 : 46
  return (min + Math.floor(Math.random() * range)) * 60 * 1000 / T
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
    nextPoopAt = new Date(now + randomPoopDelay(dirtyHabitat)).toISOString()
  }

  if (!stats.lastDecayTimestamp) {
    return {
      ...stats, poops, nextPoopAt,
      lastDecayTimestamp: new Date(now).toISOString(),
      pendingDecay: { energy: 0, hunger: 0, cleanliness: 0 },
    }
  }

  const elapsed = now - new Date(stats.lastDecayTimestamp).getTime()
  const pending = stats.pendingDecay ?? { energy: 0, hunger: 0, cleanliness: 0 }

  // Remove expired active items
  const activeItems = (stats.activeItems ?? []).filter(
    inst => new Date(inst.expiresAt).getTime() > now
  )

  // Energy (always decays) — accumulate fractional remainder
  const rawEnergy = pending.energy + elapsed / DECAY.energy.intervalMs
  const energyDecrement = Math.floor(rawEnergy)
  const pendingEnergy = rawEnergy - energyDecrement

  // Hunger: food active → gain, else → decay
  const foodActive = activeItems.some(inst => getItem(inst.itemId)?.effect?.stat === 'hunger')
  let hungerDelta, pendingHunger
  if (foodActive) {
    const ratePerMs = activeItems.reduce((sum, inst) => {
      const def = getItem(inst.itemId)
      if (def?.effect?.stat !== 'hunger') return sum
      return sum + def.effect.ratePerMinute * T / 60000
    }, 0)
    const rawGain = (pending.hunger ?? 0) + elapsed * ratePerMs
    hungerDelta = Math.floor(rawGain)
    pendingHunger = rawGain - hungerDelta
  } else {
    const rawLoss = (pending.hunger ?? 0) + elapsed / DECAY.hunger.intervalMs
    hungerDelta = -Math.floor(rawLoss)
    pendingHunger = rawLoss - Math.floor(rawLoss)
  }

  // Cleanliness: bath active → gain; poop present → faster decay
  const bathActive = activeItems.some(inst => getItem(inst.itemId)?.effect?.stat === 'cleanliness')
  let cleanlinessDelta, pendingCleanliness
  if (bathActive) {
    const ratePerMs = activeItems.reduce((sum, inst) => {
      const def = getItem(inst.itemId)
      if (def?.effect?.stat !== 'cleanliness') return sum
      return sum + def.effect.ratePerMinute * T / 60000
    }, 0)
    const rawGain = (pending.cleanliness ?? 0) + elapsed * ratePerMs
    cleanlinessDelta = Math.floor(rawGain)
    pendingCleanliness = rawGain - cleanlinessDelta
  } else {
    const multiplier = Math.pow(1.5, poops.length)
    const effectiveIntervalMs = DECAY.cleanliness.intervalMs / multiplier
    const rawLoss = (pending.cleanliness ?? 0) + elapsed / effectiveIntervalMs
    cleanlinessDelta = -Math.floor(rawLoss)
    pendingCleanliness = rawLoss - Math.floor(rawLoss)
  }

  return {
    ...stats,
    activeItems,
    poops,
    nextPoopAt,
    lastDecayTimestamp: new Date(now).toISOString(),
    pendingDecay: { energy: pendingEnergy, hunger: pendingHunger, cleanliness: pendingCleanliness },
    energy: {
      ...stats.energy,
      value: Math.max(0, stats.energy.value - energyDecrement),
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
  const savedRef = useRef(null)

  const [stats, setStats] = useState(() => {
    const raw = getStorageItem(userId, STORAGE_KEY) ?? {}
    const rawInv = raw.inventory ?? {}
    const rawTools = rawInv.tools ?? []
    const tools = rawTools.map(t =>
      typeof t === 'string' ? { id: t, usesRemaining: 10 } : t
    )
    const saved = {
      ...DEFAULTS,
      ...raw,
      inventory: { ...DEFAULTS.inventory, ...rawInv, tools },
      coins: TEST_MODE ? Math.max(raw.coins ?? 0, 500) : (raw.coins ?? DEFAULTS.coins),
    }
    savedRef.current = saved
    return applyDecay(saved)
  })

  // Persist immediately if applyDecay generated a poop on mount.
  useEffect(() => {
    const saved = savedRef.current
    if (
      stats.poops.length !== (saved.poops?.length ?? 0) ||
      stats.nextPoopAt !== saved.nextPoopAt
    ) {
      setItem(userId, STORAGE_KEY, stats)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Live tick: always apply decay and persist so fractional remainders are
  // never lost. Only trigger a re-render when visible stat values change.
  useEffect(() => {
    const id = setInterval(() => {
      setStats(prev => {
        const next = applyDecay(prev)
        setItem(userId, STORAGE_KEY, next)
        const visibleChanged = (
          next.activeItems.length    !== prev.activeItems.length  ||
          next.poops.length          !== prev.poops.length        ||
          next.nextPoopAt            !== prev.nextPoopAt          ||
          next.energy.value          !== prev.energy.value        ||
          next.hunger.value          !== prev.hunger.value        ||
          next.cleanliness.value     !== prev.cleanliness.value
        )
        return visibleChanged ? next : prev
      })
    }, 10000)
    return () => clearInterval(id)
  }, [userId])

  // Generic save for shop/poop actions — updates lastDecayTimestamp.
  function save(updater) {
    setStats(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      const withTimestamp = { ...next, lastDecayTimestamp: new Date().toISOString() }
      setItem(userId, STORAGE_KEY, withTimestamp)
      return withTimestamp
    })
  }

  // Reward save: preserves lastDecayTimestamp and pendingDecay so the
  // fractional accumulation is not disrupted by frequent correct/wrong answers.
  function saveReward(updater) {
    setStats(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      setItem(userId, STORAGE_KEY, next)
      return next
    })
  }

  function onCorrect(coinReward = 1) {
    saveReward(prev => ({
      ...prev,
      coins: prev.coins + coinReward,
      energy: { ...prev.energy, value: Math.min(prev.energy.max, prev.energy.value + (TEST_MODE ? 25 : 3)) },
    }))
  }

  function onWrong() {
    saveReward(prev => ({
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
    if (def.type === 'cosmetic' || def.type === 'decoration') {
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
      if (def.type === 'consumable' || def.type === 'cosmetic' || def.type === 'decoration') {
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
    jimmySleeping: stats.energy.value <= 25,
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
