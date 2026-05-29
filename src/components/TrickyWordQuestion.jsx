import { useState, useEffect, useRef } from 'react'
import { speak } from '../services/tts'

export default function TrickyWordQuestion({ targetWord, distractors, status = 'seen', onCorrect, onWrong, locked }) {
  const showWord = status === 'seen' // hide when familiar or known — test recall
  const [phase, setPhase] = useState('presentation') // 'presentation' | 'question'
  const [answered, setAnswered] = useState(null)     // null | 'correct' | word tapped
  const options = useRef(
    [targetWord, ...distractors].sort(() => Math.random() - 0.5)
  ).current

  useEffect(() => {
    const cancel = speak('', targetWord.audioFallback)
    const timer = setTimeout(() => setPhase('question'), 1500)
    return () => { cancel(); clearTimeout(timer) }
  }, [])

  function handleReplay() {
    speak('', targetWord.audioFallback)
  }

  function handleTap(word) {
    if (locked || answered !== null) return
    if (word.word === targetWord.word) {
      setAnswered('correct')
      onCorrect()
    } else {
      setAnswered(word.word)
      setTimeout(() => onWrong(), 800)
    }
  }

  function buttonStyle(word) {
    if (answered === null) return ''
    if (word.word === targetWord.word) return 'bg-green-100 border-green-500'
    if (answered === word.word) return 'bg-red-100 border-red-400'
    return 'opacity-40'
  }

  if (phase === 'presentation') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 min-h-48">
        <p className="text-6xl font-bold text-gray-800 tracking-wide">{targetWord.word}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="flex items-center gap-3">
        {showWord && <p className="text-3xl font-bold text-gray-700">{targetWord.word}</p>}
        <button
          onClick={handleReplay}
          className="min-h-12 min-w-12 flex items-center justify-center text-xl rounded-2xl bg-yellow-100 border-2 border-yellow-300"
          aria-label="Replay word"
        >
          🔊
        </button>
      </div>
      <p className="text-sm text-gray-400">{showWord ? 'Which one did you see?' : 'Which word did you hear?'}</p>
      <div className="flex flex-col gap-3 w-full">
        {options.map(word => (
          <button
            key={word.word}
            onClick={() => handleTap(word)}
            disabled={answered !== null || locked}
            className={`min-h-16 w-full rounded-3xl border-2 text-3xl font-bold text-gray-800 bg-white border-yellow-300 active:scale-95 transition-all ${buttonStyle(word)}`}
          >
            {word.word}
          </button>
        ))}
      </div>
    </div>
  )
}
