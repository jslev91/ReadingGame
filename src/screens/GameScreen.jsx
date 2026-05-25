import { useState, useEffect, useRef } from 'react'
import { usePet } from '../hooks/usePet'
import { useProgress } from '../hooks/useProgress'
import { selectNextQuestion } from '../services/questionSelector'
import { selectBlendingWord } from '../data/words'
import Jimmy from '../components/Jimmy'
import PhonemeQuestion from '../components/PhonemeQuestion'
import InitialSoundQuestion from '../components/InitialSoundQuestion'
import BlendingQuestion from '../components/BlendingQuestion'

const GUEST = { id: 'guest', name: 'Player' }
const SESSION_LENGTH = 10

export default function GameScreen({ onHome, onSessionComplete }) {
  const pet = usePet(GUEST.id)
  const progress = useProgress(GUEST.id)
  const [question, setQuestion] = useState(null)
  const [locked, setLocked] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const jimmyRef = useRef(null)

  // Session tracking — resets each time GameScreen mounts
  const sessionCorrect = useRef(0)
  const sessionCoins = useRef(0)

  // questionIndex is the only dep. progress.progressMap is NOT stale because:
  // useProgress re-evaluates on every render, and recordCorrect/recordWrong update
  // progressMap 1000ms before setQuestionIndex fires. By the time this effect runs,
  // the render that triggered it already carries the updated progressMap.
  // Adding progressMap to deps would cause an infinite loop (recordPresented updates it).
  useEffect(() => {
    const blending = selectBlendingWord(progress.progressMap)
    const introCount = Object.keys(progress.progressMap).length

    // Weighted question type selection
    // BlendingQuestion: eligible when selectBlendingWord returns non-null
    // InitialSoundQuestion: eligible when 2+ graphemes introduced
    // PhonemeQuestion: always eligible
    let type = 'phoneme'
    const blendingEligible = blending !== null
    const initialEligible = introCount >= 2

    if (blendingEligible && initialEligible) {
      const r = Math.random()
      type = r < 0.5 ? 'phoneme' : r < 0.75 ? 'initial' : 'blending'
    } else if (blendingEligible) {
      type = Math.random() < 0.75 ? 'phoneme' : 'blending'
    } else if (initialEligible) {
      type = Math.random() < 0.67 ? 'phoneme' : 'initial'
    }

    if (type === 'blending') {
      setQuestion({ type: 'blending', ...blending })
    } else {
      const next = selectNextQuestion(progress.progressMap)
      progress.recordPresented(next.entry.grapheme)
      setQuestion({ type, ...next })
    }
    setLocked(false)
  }, [questionIndex])

  function advance(correct) {
    const nextIndex = questionIndex + 1
    if (correct) {
      sessionCorrect.current += 1
      sessionCoins.current += 1
    }
    if (nextIndex >= SESSION_LENGTH) {
      setTimeout(() => onSessionComplete({
        correct: sessionCorrect.current,
        total: SESSION_LENGTH,
        coinsEarned: sessionCoins.current,
        stats: pet.stats,
        mood: pet.mood,
      }), correct ? 1000 : 1500)
    } else {
      setTimeout(() => setQuestionIndex(nextIndex), correct ? 1000 : 1500)
    }
  }

  function handleCorrect() {
    if (locked) return
    setLocked(true)
    pet.onCorrect()
    if (question.type !== 'blending') progress.recordCorrect(question.entry.grapheme)
    jimmyRef.current?.react('happy')
    advance(true)
  }

  function handleWrong() {
    if (locked) return
    setLocked(true)
    pet.onWrong()
    if (question.type !== 'blending') progress.recordWrong(question.entry.grapheme)
    jimmyRef.current?.react('sad')
    advance(false)
  }

  function renderQuestion() {
    if (!question) return null
    if (question.type === 'blending') {
      return (
        <BlendingQuestion
          key={'blending-' + questionIndex}
          wordEntry={question.wordEntry}
          distractors={question.distractors}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          locked={locked}
        />
      )
    }
    const Component = question.type === 'initial' ? InitialSoundQuestion : PhonemeQuestion
    return (
      <Component
        key={question.entry.grapheme + question.entry.phonemeDescription + questionIndex}
        entry={question.entry}
        distractors={question.distractors}
        onCorrect={handleCorrect}
        onWrong={handleWrong}
        locked={locked}
      />
    )
  }

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
        <span className="text-sm font-bold text-yellow-700">
          {questionIndex + 1} / {SESSION_LENGTH}
        </span>
      </div>

      <div className="w-full max-w-sm">
        <Jimmy ref={jimmyRef} stats={pet.stats} mood={pet.mood} />
      </div>

      {question && (
        <div className="bg-white rounded-3xl shadow-lg w-full max-w-sm">
          {renderQuestion()}
        </div>
      )}
    </div>
  )
}
