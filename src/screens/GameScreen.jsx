import { useState, useEffect } from 'react'
import { usePet } from '../hooks/usePet'
import { useProgress } from '../hooks/useProgress'
import { selectNextQuestion } from '../services/questionSelector'
import Jimmy from '../components/Jimmy'
import PhonemeQuestion from '../components/PhonemeQuestion'
import InitialSoundQuestion from '../components/InitialSoundQuestion'

const GUEST = { id: 'guest', name: 'Player' }

export default function GameScreen({ onHome }) {
  const pet = usePet(GUEST.id)
  const progress = useProgress(GUEST.id)
  const [question, setQuestion] = useState(null)
  const [locked, setLocked] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)

  // questionIndex is the only dep. progress.progressMap is NOT stale because:
  // useProgress re-evaluates on every render, and recordCorrect/recordWrong update
  // progressMap 1000ms before setQuestionIndex fires. By the time this effect runs,
  // the render that triggered it already carries the updated progressMap.
  // Adding progressMap to deps would cause an infinite loop (recordPresented updates it).
  useEffect(() => {
    const next = selectNextQuestion(progress.progressMap)
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

  // Every 3rd question (index 2, 5, 8 …) is an InitialSoundQuestion
  const useInitialSound = questionIndex % 3 === 2
  const QuestionComponent = useInitialSound ? InitialSoundQuestion : PhonemeQuestion

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center gap-6 p-4">
      <div className="w-full flex items-center justify-between">
        <button
          onClick={onHome}
          className="min-h-16 min-w-16 flex items-center justify-center text-2xl rounded-2xl bg-white border-2 border-yellow-300 text-yellow-700"
          aria-label="Home"
        >
          🏠
        </button>
      </div>

      <div className="w-full max-w-sm">
        <Jimmy stats={pet.stats} mood={pet.mood} />
      </div>

      {question && (
        <div className="bg-white rounded-3xl shadow-lg w-full max-w-sm">
          <QuestionComponent
            key={question.entry.grapheme + question.entry.phonemeDescription + questionIndex}
            entry={question.entry}
            distractors={question.distractors}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            locked={locked}
          />
        </div>
      )}
    </div>
  )
}
