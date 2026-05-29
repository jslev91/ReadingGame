// The child hears a word spoken phoneme-by-phoneme, then identifies the written word
// from three options. Tests blending: connecting a phoneme sequence to its written form.
// This is the reverse of reading — decoding spoken sounds into a recognised written word.

import { useEffect, useState, useMemo } from 'react'
import phonics from '../data/phonics'
import { speak } from '../core/services/tts'

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

// Looks up a phonics entry by grapheme string. For ambiguous graphemes (oo),
// either entry works here since we're just getting the audioKey for TTS.
function getEntry(grapheme) {
  return phonics.find(p => p.grapheme === grapheme)
}

// Speaks each phoneme in sequence with gaps, then speaks the whole word.
// Returns a cancel function that stops all pending and active audio.
function speakBlending(wordEntry) {
  let cancelled = false
  const timers = []
  const cancelFns = []  // cancel functions from speak() calls already started

  const cancelAll = () => {
    cancelled = true
    timers.forEach(clearTimeout)
    cancelFns.forEach(fn => fn())  // stop any audio already playing
  }

  let delay = 0
  for (const grapheme of wordEntry.graphemes) {
    const entry = getEntry(grapheme)
    if (!entry) continue
    const t = setTimeout(() => {
      if (!cancelled) cancelFns.push(speak(entry.audioKey, entry.ttsText))
    }, delay)
    timers.push(t)
    delay += 500
  }

  // Speak the whole word after phonemes finish
  const wordDelay = delay + 700
  const t = setTimeout(() => {
    if (!cancelled) cancelFns.push(speak('', wordEntry.word))
  }, wordDelay)
  timers.push(t)

  return cancelAll
}

export default function BlendingQuestion({ wordEntry, distractors, onCorrect, onWrong, locked = false }) {
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState(null)

  const options = useMemo(
    () => shuffle([wordEntry, ...distractors]),
    [wordEntry]
  )

  useEffect(() => {
    setAnswered(false)
    setSelected(null)
    return speakBlending(wordEntry)
  }, [wordEntry])

  function handleTap(option) {
    if (answered || locked) return
    setAnswered(true)
    setSelected(option)
    if (option === wordEntry) {
      onCorrect?.()
    } else {
      onWrong?.()
    }
  }

  function buttonClass(option) {
    const base = 'flex-1 min-h-16 rounded-2xl text-2xl font-bold transition-transform focus:outline-none'
    if (!answered) {
      return `${base} bg-white border-4 border-yellow-400 text-yellow-900 active:scale-95`
    }
    if (option === wordEntry) {
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
        onClick={() => speakBlending(wordEntry)}
        className="flex flex-col items-center gap-2 cursor-pointer"
        aria-label="Hear the word again"
      >
        <span className="text-7xl">🔊</span>
        <span className="text-lg font-bold text-yellow-700">What word is this?</span>
      </button>

      <div className="flex gap-3 w-full px-2">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleTap(option)}
            disabled={answered || locked}
            className={buttonClass(option)}
            aria-label={option.word}
          >
            {option.word}
          </button>
        ))}
      </div>

      {answered && selected !== wordEntry && (
        <p className="text-base font-bold text-gray-500">
          The word was <span className="text-green-600">{wordEntry.word}</span>
        </p>
      )}
    </div>
  )
}
