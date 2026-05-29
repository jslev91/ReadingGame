// Reverse of PhonemeQuestion: the child hears a whole word and taps the grapheme
// for the target sound. Audio uses TTS fallback intentionally — full words via Web
// Speech API are clear and natural; no recorded .wav files are needed.
// Question wording adapts to where the grapheme appears in the word (beginning/end/middle).

import { useEffect, useState, useMemo } from 'react'
import { speak } from '../core/services/tts'

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

// Finds the best word and derives question phrasing based on where the grapheme sits.
function getSegmentInfo(entry) {
  const candidates = [entry.ttsText, ...entry.exampleWords]
  for (const word of candidates) {
    if (word.startsWith(entry.grapheme))
      return { word, prompt: `what sound is at the beginning of ${word}` }
    if (word.endsWith(entry.grapheme))
      return { word, prompt: `what sound is at the end of ${word}` }
  }
  return { word: entry.ttsText, prompt: `what sound do you hear in ${entry.ttsText}` }
}

export default function InitialSoundQuestion({ entry, distractors, onCorrect, onWrong, locked = false }) {
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState(null)

  const options = useMemo(
    () => shuffle([entry, ...distractors]),
    [entry]
  )

  const { word, prompt } = getSegmentInfo(entry)

  useEffect(() => {
    setAnswered(false)
    setSelected(null)
    // Key won't match any .wav — TTS fallback speaks the question naturally
    return speak(`${entry.audioKey}_word`, prompt)
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
        onClick={() => speak(`${entry.audioKey}_word`, prompt)}
        className="flex flex-col items-center gap-2 cursor-pointer"
        aria-label={`Hear the word again: ${word}`}
      >
        <span className="text-7xl">🔊</span>
        <span className="text-lg font-bold text-yellow-700">{prompt.charAt(0).toUpperCase() + prompt.slice(1)}?</span>
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
          The answer is <span className="text-green-600">{entry.phonemeDescription}</span>
        </p>
      )}
    </div>
  )
}
