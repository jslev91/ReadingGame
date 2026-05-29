import { useState } from 'react'
import MathsQuestion from '../components/MathsQuestion'

export default function GameScreen({ userId, onHome, onSessionComplete }) {
  const [done, setDone] = useState(false)

  function handleCorrect() {
    if (done) return
    setDone(true)
    setTimeout(() => onSessionComplete({ correct: 1, total: 1, coinsEarned: 1 }), 1000)
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center gap-6 p-4">
      <button
        onClick={onHome}
        className="self-start min-h-16 min-w-16 flex items-center justify-center text-2xl rounded-2xl bg-white border-2 border-blue-300 text-blue-700"
        aria-label="Home"
      >
        🏠
      </button>
      <div className="bg-white rounded-3xl shadow-lg w-full max-w-sm">
        <MathsQuestion onCorrect={handleCorrect} />
      </div>
    </div>
  )
}
