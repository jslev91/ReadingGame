// KS2 maths curriculum topics — to be built out in session 11.
// Topics will cover: number bonds, addition, subtraction, multiplication tables,
// division, fractions, place value (Years 3–6 / ages 7–11).

export const MATHS_TOPICS = []

export function getTopic(id) {
  return MATHS_TOPICS.find(t => t.id === id) ?? null
}
