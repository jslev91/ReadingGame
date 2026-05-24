// Reverse of PhonemeQuestion: the child hears a whole word and taps the grapheme
// that represents its first sound. Audio uses TTS fallback intentionally — full words
// via Web Speech API are clear and natural; no recorded .wav files are needed.

import { useEffect, useState, useMemo } from 'react'
import { speak } from '../services/tts'

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function InitialSoundQuestion({ entry, distractors, onCorrect, onWrong, locked = false }) {
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState(null)

  const options = useMemo(
    () => shuffle([entry, ...distractors]),
    [entry]
  )

  useEffect(() => {
    setAnswered(false)
    setSelected(null)
    // Use a key that won't match any .wav file — TTS fallback speaks the word naturally
    return speak(`${entry.audioKey}_word`, `what sound is at the beginning of ${entry.exampleWords[0]}`)
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
    const base = 'min-h-16 w-24 rounded-2xl text-4xl font-bold transition-transform focus:outline-none'
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
        onClick={() => speak(`${entry.audioKey}_word`, `what sound is at the beginning of ${entry.exampleWords[0]}`)}
        className="flex flex-col items-center gap-2 cursor-pointer"
        aria-label={`Hear the word again: ${`what sound is at the beginning of ${entry.exampleWords[0]}`}`}
      >
        <span className="text-7xl">🔊</span>
        <span className="text-lg font-bold text-yellow-700">What sound does it start with?</span>
      </button>

      <div className="flex gap-6">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleTap(option)}
            disabled={answered || locked}
            className={buttonClass(option)}
            aria-label={option.grapheme}
          >
            {option.grapheme}
          </button>
        ))}
      </div>

      {answered && selected !== entry && (
        <p className="text-base font-bold text-gray-500">
          It starts with <span className="text-green-600">{entry.phonemeDescription}</span>
        </p>
      )}
    </div>
  )
}
