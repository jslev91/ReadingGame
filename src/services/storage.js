const key = (userId, suffix) => `jimmy:${userId}:${suffix}`

export function getItem(userId, suffix) {
  const raw = localStorage.getItem(key(userId, suffix))
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setItem(userId, suffix, value) {
  localStorage.setItem(key(userId, suffix), JSON.stringify(value))
}

export function removeItem(userId, suffix) {
  localStorage.removeItem(key(userId, suffix))
}

// Stub: read per-user, per-grapheme progress status
// Returns "unseen" | "introduced" | "practising" | "mastered"
export function getGraphemeStatus(userId, grapheme) {
  const all = getItem(userId, 'graphemeStatus') ?? {}
  return all[grapheme] ?? 'unseen'
}

// Stub: write per-user, per-grapheme progress status
export function setGraphemeStatus(userId, grapheme, status) {
  const all = getItem(userId, 'graphemeStatus') ?? {}
  all[grapheme] = status
  setItem(userId, 'graphemeStatus', all)
}
