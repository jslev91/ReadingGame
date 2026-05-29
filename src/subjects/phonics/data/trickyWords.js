export const TRICKY_WORDS = [
  // Phase 2
  { word: 'the',    phase: 2, audioFallback: 'the' },
  { word: 'to',     phase: 2, audioFallback: 'to' },
  { word: 'no',     phase: 2, audioFallback: 'no' },
  { word: 'go',     phase: 2, audioFallback: 'go' },
  { word: 'I',      phase: 2, audioFallback: 'I' },
  // Phase 3
  { word: 'he',     phase: 3, audioFallback: 'he' },
  { word: 'she',    phase: 3, audioFallback: 'she' },
  { word: 'we',     phase: 3, audioFallback: 'we' },
  { word: 'me',     phase: 3, audioFallback: 'me' },
  { word: 'be',     phase: 3, audioFallback: 'be' },
  { word: 'was',    phase: 3, audioFallback: 'was' },
  { word: 'my',     phase: 3, audioFallback: 'my' },
  { word: 'you',    phase: 3, audioFallback: 'you' },
  { word: 'they',   phase: 3, audioFallback: 'they' },
  { word: 'her',    phase: 3, audioFallback: 'her' },
  { word: 'all',    phase: 3, audioFallback: 'all' },
  { word: 'are',    phase: 3, audioFallback: 'are' },
  // Phase 4
  { word: 'said',   phase: 4, audioFallback: 'said' },
  { word: 'so',     phase: 4, audioFallback: 'so' },
  { word: 'do',     phase: 4, audioFallback: 'do' },
  { word: 'some',   phase: 4, audioFallback: 'some' },
  { word: 'come',   phase: 4, audioFallback: 'come' },
  { word: 'were',   phase: 4, audioFallback: 'were' },
  { word: 'there',  phase: 4, audioFallback: 'there' },
  { word: 'little', phase: 4, audioFallback: 'little' },
  { word: 'one',    phase: 4, audioFallback: 'one' },
  { word: 'out',    phase: 4, audioFallback: 'out' },
]

export function getTrickyWord(word) {
  return TRICKY_WORDS.find(w => w.word === word) ?? null
}
