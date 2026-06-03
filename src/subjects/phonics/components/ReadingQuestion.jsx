import { useState, useEffect, useRef } from 'react'
import { speak } from '../../../core/services/tts'

// Phase 1: auto-plays all 3 words in sequence, showing which is playing
// Phase 2: shows the target word; 3 columns each with 🔊 (preview) and ↑ (commit)

export default function ReadingQuestion({ wordEntry, distractors, onCorrect, onWrong, locked }) {
  // Shuffle once on mount
  const [words] = useState(() => [...[wordEntry, ...distractors]].sort(() => Math.random() - 0.5))
  const targetIdx = words.findIndex(w => w.word === wordEntry.word)

  const [phase, setPhase] = useState('playing')  // 'playing' | 'choosing'
  const [playingIdx, setPlayingIdx] = useState(0)
  const [chosen, setChosen] = useState(null)
  const timersRef = useRef([])
  const cancelsRef = useRef([])

  function clearAll() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    cancelsRef.current.forEach(fn => fn?.())
    cancelsRef.current = []
  }

  function playSequence() {
    clearAll()
    setPhase('playing')
    setPlayingIdx(0)

    cancelsRef.current.push(speak('', words[0].word))

    const t1 = setTimeout(() => {
      setPlayingIdx(1)
      cancelsRef.current.push(speak('', words[1].word))
    }, 1200)

    const t2 = setTimeout(() => {
      setPlayingIdx(2)
      cancelsRef.current.push(speak('', words[2].word))
    }, 2400)

    const t3 = setTimeout(() => {
      setPhase('choosing')
    }, 3600)

    timersRef.current = [t1, t2, t3]
  }

  useEffect(() => {
    playSequence()
    return clearAll
  }, [])

  function handleSelect(idx) {
    if (locked || chosen !== null || phase !== 'choosing') return
    setChosen(idx)
    if (idx === targetIdx) {
      onCorrect()
    } else {
      setTimeout(onWrong, 800)
    }
  }

  function speakWord(idx) {
    speak('', words[idx].word)
  }

  function selectButtonStyle(idx) {
    const base = 'min-h-16 w-16 text-2xl rounded-2xl border-2 font-bold flex items-center justify-center transition-colors'
    if (chosen === null) return `${base} bg-yellow-50 border-yellow-300 active:scale-95`
    if (idx === targetIdx) return `${base} bg-green-400 border-green-500 text-white`
    if (idx === chosen) return `${base} bg-red-400 border-red-500 text-white`
    return `${base} bg-white border-gray-200 opacity-40`
  }

  if (phase === 'playing') {
    return (
      <div className="p-6 flex flex-col items-center gap-6">
        <p className="text-lg font-bold text-gray-500">Listen carefully...</p>
        <div className="flex gap-4">
          {words.map((_, i) => (
            <div
              key={i}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                i === playingIdx
                  ? 'bg-yellow-400 text-white scale-110 animate-pulse'
                  : i < playingIdx
                  ? 'bg-green-200 text-green-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-sm font-bold text-gray-400 mb-1">Which one said this word?</p>
        <p className="text-5xl font-bold text-gray-800">{wordEntry.word}</p>
      </div>

      <div className="flex justify-around w-full gap-2">
        {words.map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            {/* 🔊 preview — no commitment */}
            <button
              onClick={() => speakWord(i)}
              className="min-h-16 min-w-16 text-3xl rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center active:scale-95"
              aria-label={`Play word ${i + 1}`}
            >
              🔊
            </button>
            {/* ↑ select — commits the answer */}
            <button
              onClick={() => handleSelect(i)}
              className={selectButtonStyle(i)}
              aria-label={`Choose word ${i + 1}`}
            >
              ↑
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={playSequence}
        className="text-sm font-bold text-blue-500"
      >
        🔊 Hear all again
      </button>
    </div>
  )
}
