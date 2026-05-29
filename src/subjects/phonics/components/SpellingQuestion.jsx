// The child hears a word and must tap its graphemes in order to spell it.
// Productive inverse of BlendingQuestion: recall and sequence sounds → graphemes.

import { useEffect, useState, useMemo, useRef } from 'react'
import phonics from '../data/phonics'
import { speak } from '../../../core/services/tts'
import { PHONEME_ALIASES } from '../services/questionSelector'

const phase2 = phonics.filter(p => p.phase === 2)

function getEntry(grapheme) {
  return phonics.find(p => p.grapheme === grapheme)
}

function speakSpelling(wordEntry) {
  let cancelled = false
  const timers = []
  const cancelFns = []

  const cancelAll = () => {
    cancelled = true
    timers.forEach(clearTimeout)
    cancelFns.forEach(fn => fn())
  }

  // Whole word first
  cancelFns.push(speak('', wordEntry.word))

  // Phoneme by phoneme 800ms later
  let delay = 800
  for (const grapheme of wordEntry.graphemes) {
    const entry = getEntry(grapheme)
    if (!entry) { delay += 500; continue }
    ;((e, d) => {
      const t = setTimeout(() => {
        if (!cancelled) cancelFns.push(speak(e.audioKey, e.ttsText))
      }, d)
      timers.push(t)
    })(entry, delay)
    delay += 500
  }

  return cancelAll
}

function pickGraphemeDistractors(wordEntry) {
  const wordGraphemes = new Set(wordEntry.graphemes)
  // Also exclude phoneme aliases (e.g. if word has 'f', exclude 'ff')
  const excluded = new Set(wordGraphemes)
  for (const g of wordGraphemes) {
    for (const alias of (PHONEME_ALIASES[g] ?? [])) excluded.add(alias)
  }
  const candidates = phase2.filter(p => !excluded.has(p.grapheme))
  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 2).map(p => p.grapheme)
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function SpellingQuestion({ wordEntry, onCorrect, onWrong, locked = false }) {
  // filledBlanks: null = empty, { grapheme, wasCorrect } = filled
  const [filledBlanks, setFilledBlanks] = useState(() =>
    new Array(wordEntry.graphemes.length).fill(null)
  )
  const [usedIds, setUsedIds] = useState(new Set())
  const [flashIds, setFlashIds] = useState({}) // id -> 'correct' | 'wrong'
  const [hasError, setHasError] = useState(false)
  const [done, setDone] = useState(false)

  // Shuffled buttons: { id, grapheme }
  const buttons = useMemo(() => {
    const distractors = pickGraphemeDistractors(wordEntry)
    const graphemes = [...wordEntry.graphemes, ...distractors]
    return shuffle(graphemes).map((g, i) => ({ id: i, grapheme: g }))
  }, [wordEntry])

  useEffect(() => {
    setFilledBlanks(new Array(wordEntry.graphemes.length).fill(null))
    setUsedIds(new Set())
    setFlashIds({})
    setHasError(false)
    setDone(false)
    return speakSpelling(wordEntry)
  }, [wordEntry])

  const hasErrorRef = useRef(false)
  useEffect(() => { hasErrorRef.current = hasError }, [hasError])

  function currentPos(blanks) {
    return blanks.findIndex(b => b === null)
  }

  function handleTap(button) {
    if (done || locked) return
    setFilledBlanks(prevBlanks => {
      const pos = currentPos(prevBlanks)
      if (pos === -1) return prevBlanks

      const correctGrapheme = wordEntry.graphemes[pos]
      const isCorrect = button.grapheme === correctGrapheme

      if (isCorrect) {
        // Fill blank, mark button used
        setUsedIds(prev => new Set([...prev, button.id]))
        const next = [...prevBlanks]
        next[pos] = { grapheme: button.grapheme, wasCorrect: true }

        if (currentPos(next) === -1) {
          setDone(true)
          // GameScreen's advance() adds the inter-question delay
          hasErrorRef.current ? onWrong?.() : onCorrect?.()
        }
        return next
      } else {
        // Wrong tap: flash wrong, find correct button and flash green, auto-fill
        setHasError(true)
        hasErrorRef.current = true

        // Find first unused button with correct grapheme
        const correctBtn = buttons.find(b => b.grapheme === correctGrapheme && !usedIds.has(b.id) && b.id !== button.id)
        const newFlash = { [button.id]: 'wrong' }
        if (correctBtn) newFlash[correctBtn.id] = 'correct'
        setFlashIds(newFlash)

        // Don't consume the wrong button if its grapheme is still needed for a
        // later position — otherwise tapping it early locks the child out.
        const neededLater = wordEntry.graphemes.slice(pos + 1).includes(button.grapheme)
        if (!neededLater) setUsedIds(new Set([...usedIds, button.id]))

        // Clear flash after 800ms
        setTimeout(() => setFlashIds({}), 800)

        const next = [...prevBlanks]
        next[pos] = { grapheme: correctGrapheme, wasCorrect: false }

        if (currentPos(next) === -1) {
          setDone(true)
          onWrong?.()
        }
        return next
      }
    })
  }

  function buttonClass(button) {
    const flash = flashIds[button.id]
    if (flash === 'correct') return 'min-h-16 min-w-16 rounded-2xl text-2xl font-bold bg-green-400 border-4 border-green-600 text-white transition-colors'
    if (flash === 'wrong')   return 'min-h-16 min-w-16 rounded-2xl text-2xl font-bold bg-red-400 border-4 border-red-600 text-white transition-colors'
    if (usedIds.has(button.id)) return 'min-h-16 min-w-16 rounded-2xl text-2xl font-bold bg-gray-100 border-4 border-gray-200 text-gray-300'
    return 'min-h-16 min-w-16 rounded-2xl text-2xl font-bold bg-white border-4 border-yellow-400 text-yellow-900 active:scale-95 transition-transform'
  }

  const replayHandle = useRef(null)

  function handleReplay() {
    if (replayHandle.current) replayHandle.current()
    replayHandle.current = speakSpelling(wordEntry)
  }

  return (
    <div className="flex flex-col items-center gap-8 p-6 select-none">
      <button
        onClick={handleReplay}
        className="flex flex-col items-center gap-2 cursor-pointer"
        aria-label="Hear the word again"
      >
        <span className="text-7xl">🔊</span>
        <span className="text-lg font-bold text-yellow-700">Spell the word!</span>
      </button>

      {/* Blank tiles */}
      <div className="flex gap-3 justify-center flex-wrap">
        {wordEntry.graphemes.map((_, i) => {
          const filled = filledBlanks[i]
          let tileClass = 'min-w-12 h-12 rounded-xl border-4 flex items-center justify-center text-xl font-bold px-2'
          if (!filled) tileClass += ' border-yellow-300 bg-yellow-50 text-transparent'
          else if (filled.wasCorrect) tileClass += ' border-green-500 bg-green-100 text-green-800'
          else tileClass += ' border-gray-300 bg-gray-100 text-gray-700'
          return (
            <div key={i} className={tileClass} aria-label={filled ? filled.grapheme : 'blank'}>
              {filled ? filled.grapheme : '_'}
            </div>
          )
        })}
      </div>

      {/* Grapheme buttons */}
      <div className="flex flex-wrap gap-3 justify-center w-full px-2">
        {buttons.map(button => (
          <button
            key={button.id}
            onClick={() => handleTap(button)}
            disabled={usedIds.has(button.id) || done || locked}
            className={buttonClass(button)}
            aria-label={button.grapheme}
          >
            {button.grapheme}
          </button>
        ))}
      </div>
    </div>
  )
}
