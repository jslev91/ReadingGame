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
