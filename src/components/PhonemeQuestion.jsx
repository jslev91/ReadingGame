import { useEffect, useState, useMemo } from 'react'
import { speak } from '../services/tts'
import phonics from '../data/phonics'

// Accepts a full phonics entry object rather than a bare grapheme string
// because "oo" appears twice in Phase 3 with different phonemes — a string
// would be ambiguous.
//
// Optional `distractors` prop accepts pre-selected entries from questionSelector.
// Falls back to random same-phase picks when not provided (e.g. in isolation testing).

function pickDistractors(entry) {
  const candidates = phonics.filter(p => p.phase === entry.phase && p.grapheme !== entry.grapheme)
  return [...candidates].sort(() => Math.random() - 0.5).slice(0, 2)
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function PhonemeQuestion({ entry, distractors, onCorrect, onWrong, locked = false }) {
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState(null)

  const options = useMemo(
    () => shuffle([entry, ...(distractors ?? pickDistractors(entry))]),
    [entry]
  )

  useEffect(() => {
    setAnswered(false)
    setSelected(null)
    return speak(entry.audioKey, entry.ttsText)
  }, [entry])

  function handleTap(option) {
    if (answered || locked) return
    setAnswered(true)
    setSelected(option)
    if (option === entry) {
      onCorrect?.()
    } else {
      onWrong?.()
    }
  }

  function buttonClass(option) {
    const base = 'flex-1 min-h-16 rounded-2xl text-4xl font-bold transition-transform focus:outline-none'
    if (!answered) {
      return `${base} bg-white border-4 border-yellow-400 text-yellow-900 active:scale-95`
    }
    if (option === entry) {
      return `${base} bg-green-400 border-4 border-green-600 text-white`
    }
    if (option === selected) {
      return `${base} bg-red-400 border-4 border-red-600 text-white`
    }
    return `${base} bg-white border-4 border-gray-200 text-gray-300`
  }

  return (
    <div className="flex flex-col items-center gap-10 p-6 select-none">
      <button
        onClick={() => speak(entry.audioKey, entry.ttsText)}
        className="flex flex-col items-center gap-2 cursor-pointer"
        aria-label={`Hear the sound again: ${entry.phonemeDescription}`}
      >
        <span className="text-7xl">🔊</span>
        <span className="text-lg font-bold text-yellow-700">Tap to hear the sound</span>
      </button>

      <div className="flex flex-wrap gap-3 w-full px-2">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleTap(option)}
            disabled={answered || locked}
            className={buttonClass(option)}
            style={options.length >= 5 ? { flexBasis: 'calc(33% - 0.5rem)' } : undefined}
            aria-label={option.grapheme}
          >
            {option.grapheme}
          </button>
        ))}
      </div>

      {answered && selected !== entry && (
        <p className="text-base font-bold text-gray-500">
          The sound was <span className="text-green-600">{entry.phonemeDescription}</span>
        </p>
      )}
    </div>
  )
}
