export const MATHS_TOPICS = [
  // Phase 1 — counting small groups (subitising)
  { id: 'count_to_3',          label: 'Counting to 3',       phase: 1, order: 1,  type: 'counting',    maxN: 3 },
  { id: 'count_to_5',          label: 'Counting to 5',       phase: 1, order: 2,  type: 'counting',    maxN: 5 },
  // Phase 2 — counting to 10, first operations
  { id: 'count_to_10',         label: 'Counting to 10',      phase: 2, order: 3,  type: 'counting',    maxN: 10 },
  { id: 'add_within_5',        label: 'Adding to 5',         phase: 2, order: 4,  type: 'addition',    maxSum: 5 },
  { id: 'subtract_within_5',   label: 'Taking away to 5',    phase: 2, order: 5,  type: 'subtraction', maxN: 5 },
  // Phase 3 — operations within 10, first number bonds
  { id: 'add_within_10',       label: 'Adding to 10',        phase: 3, order: 6,  type: 'addition',    maxSum: 10 },
  { id: 'subtract_within_10',  label: 'Taking away to 10',   phase: 3, order: 7,  type: 'subtraction', maxN: 10 },
  { id: 'bonds_to_5',          label: 'Number bonds to 5',   phase: 3, order: 8,  type: 'bond',        total: 5 },
  // Phase 4 — bonds to 10, recognising 11-20, adding to 20
  { id: 'bonds_to_10',         label: 'Number bonds to 10',  phase: 4, order: 9,  type: 'bond',        total: 10 },
  { id: 'numbers_to_20',       label: 'Numbers to 20',       phase: 4, order: 10, type: 'counting',    minN: 11, maxN: 20 },
  { id: 'add_within_20',       label: 'Adding to 20',        phase: 4, order: 11, type: 'addition',    maxSum: 20 },
]

export function getTopic(id) {
  return MATHS_TOPICS.find(t => t.id === id) ?? null
}
