// Times tables in UK National Curriculum teaching order
export const MATHS_TOPICS = [
  // Phase 1 — 2s, 5s, 10s (introduced in Year 2)
  { id: 'times_2',  label: '2 times table',  phase: 1, order: 1,  type: 'times_table', b: 2,  minFactor: 1, maxFactor: 12 },
  { id: 'times_5',  label: '5 times table',  phase: 1, order: 2,  type: 'times_table', b: 5,  minFactor: 1, maxFactor: 12 },
  { id: 'times_10', label: '10 times table', phase: 1, order: 3,  type: 'times_table', b: 10, minFactor: 1, maxFactor: 12 },
  // Phase 2 — 3s, 4s (Year 3)
  { id: 'times_3',  label: '3 times table',  phase: 2, order: 4,  type: 'times_table', b: 3,  minFactor: 1, maxFactor: 12 },
  { id: 'times_4',  label: '4 times table',  phase: 2, order: 5,  type: 'times_table', b: 4,  minFactor: 1, maxFactor: 12 },
  // Phase 3 — 6s, 7s, 8s (Year 4)
  { id: 'times_6',  label: '6 times table',  phase: 3, order: 6,  type: 'times_table', b: 6,  minFactor: 1, maxFactor: 12 },
  { id: 'times_7',  label: '7 times table',  phase: 3, order: 7,  type: 'times_table', b: 7,  minFactor: 1, maxFactor: 12 },
  { id: 'times_8',  label: '8 times table',  phase: 3, order: 8,  type: 'times_table', b: 8,  minFactor: 1, maxFactor: 12 },
  // Phase 4 — 9s, 11s, 12s (Year 4 consolidation)
  { id: 'times_9',  label: '9 times table',  phase: 4, order: 9,  type: 'times_table', b: 9,  minFactor: 1, maxFactor: 12 },
  { id: 'times_11', label: '11 times table', phase: 4, order: 10, type: 'times_table', b: 11, minFactor: 1, maxFactor: 12 },
  { id: 'times_12', label: '12 times table', phase: 4, order: 11, type: 'times_table', b: 12, minFactor: 1, maxFactor: 12 },
]

export function getTopic(id) {
  return MATHS_TOPICS.find(t => t.id === id) ?? null
}

// Arithmetic difficulty bands — facts are generated programmatically, not listed statically.
// Gating: add-1 always eligible; each subsequent band requires the previous to be 'practising'.
// sub-1 unlocks when add-1 is 'practising'.
export const BANDS = [
  { id: 'add-1', name: 'Adding to 10',          operation: 'add',      maxA: 5,   maxB: 5,   maxAnswer: 10  },
  { id: 'add-2', name: 'Adding to 20',           operation: 'add',      maxA: 10,  maxB: 10,  maxAnswer: 20  },
  { id: 'add-3', name: 'Adding to 100',          operation: 'add',      maxA: 50,  maxB: 50,  maxAnswer: 100 },
  { id: 'sub-1', name: 'Subtracting within 10',  operation: 'subtract', maxA: 10,  maxB: 5,   maxAnswer: 10  },
  { id: 'sub-2', name: 'Subtracting within 20',  operation: 'subtract', maxA: 20,  maxB: 10,  maxAnswer: 20  },
  { id: 'sub-3', name: 'Subtracting within 100', operation: 'subtract', maxA: 100, maxB: 50,  maxAnswer: 100 },
]

export function getBand(id) {
  return BANDS.find(b => b.id === id) ?? null
}

export function generateArithmeticFact(band) {
  if (band.operation === 'add') {
    const a = Math.floor(Math.random() * band.maxA) + 1
    const maxBForA = Math.min(band.maxB, band.maxAnswer - a)
    if (maxBForA < 1) return generateArithmeticFact(band) // retry if clamped out
    const b = Math.floor(Math.random() * maxBForA) + 1
    return { a, b, answer: a + b, operation: 'add' }
  } else {
    // a must be at least maxB+1 so there's room for b; also a !== b to avoid 0 result
    const a = band.maxB + 1 + Math.floor(Math.random() * (band.maxA - band.maxB))
    const maxBForA = Math.min(a - 1, band.maxB)
    if (maxBForA < 1) return generateArithmeticFact(band)
    const b = Math.floor(Math.random() * maxBForA) + 1
    return { a, b, answer: a - b, operation: 'subtract' }
  }
}
