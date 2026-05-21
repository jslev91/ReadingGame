import { useState, useEffect, useRef } from 'react'
import { usePet } from '../hooks/usePet'
import { useProgress } from '../hooks/useProgress'
import { selectNextQuestion } from '../services/questionSelector'
import Jimmy from '../components/Jimmy'
import PhonemeQuestion from '../components/PhonemeQuestion'

const GUEST = { id: 'guest', name: 'Player' }

export default function GameScreen({ onHome }) {
  const pet = usePet(GUEST.id)
  const progress = useProgress(GUEST.id)
  const sessionIntroducedRef = useRef(false)

  const [question, setQuestion] = useState(null)
  const [locked, setLocked] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)

  // Runs with a fresh closure each time questionIndex increments,
  // so progress.progressMap is always up to date when selecting the next question.
  useEffect(() => {
    const next = selectNextQuestion(progress.progressMap, sessionIntroducedRef.current)
    if (next.isNew) sessionIntroducedRef.current = true
    progress.recordPresented(next.entry.grapheme)
    setQuestion(next)
    setLocked(false)
  }, [questionIndex])

  function handleCorrect() {
    if (locked) return
    setLocked(true)
    pet.onCorrect()
    progress.recordCorrect(question.entry.grapheme)
    setTimeout(() => setQuestionIndex(i => i + 1), 1000)
  }

  function handleWrong() {
    if (locked) return
    setLocked(true)
    pet.onWrong()
    progress.recordWrong(question.entry.grapheme)
    setTimeout(() => setQuestionIndex(i => i + 1), 1500)
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center gap-8 p-6">
      <div className="w-full flex items-center justify-between">
        <button
          onClick={onHome}
          className="min-h-16 min-w-16 flex items-center justify-center text-2xl rounded-2xl bg-white border-2 border-yellow-300 text-yellow-700"
          aria-label="Home"
        >
          🏠
        </button>
        <Jimmy energy={pet.energy} mood={pet.mood} />
        <div className="min-w-16" />
      </div>

      {question && (
        <div className="bg-white rounded-3xl shadow-lg w-full max-w-sm">
          <PhonemeQuestion
            key={question.entry.grapheme + question.entry.phonemeDescription + questionIndex}
            entry={question.entry}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            locked={locked}
          />
        </div>
      )}
    </div>
  )
}
