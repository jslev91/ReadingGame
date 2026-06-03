import { useState, useEffect, useRef } from 'react'
import { usePet } from '../../../core/hooks/usePet'
import { playCorrectSound } from '../../../core/services/sounds'
import { useMathsProgress } from '../hooks/useProgress'
import { selectNextTopic, generateQuestion } from '../services/questionSelector'
import Jimmy from '../../../core/components/Jimmy'
import MathsQuestion from '../components/MathsQuestion'

const SESSION_LENGTH = 10

export default function GameScreen({ userId, onHome, onSessionComplete }) {
  const pet = usePet(userId)
  const progress = useMathsProgress(userId)
  const [topic, setTopic] = useState(null)
  const [question, setQuestion] = useState(null)
  const [locked, setLocked] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [poopToast, setPoopToast] = useState(null)
  const jimmyRef = useRef(null)
  const sessionCorrect = useRef(0)
  const sessionCoins = useRef(0)

  function handlePoopTap(poopId) {
    const poop = pet.stats.poops.find(p => p.id === poopId)
    const x = poop?.x ?? 50
    if (pet.hasTool('shovel')) {
      pet.removePoop(poopId)
      setPoopToast({ message: '✨ Clean!', x })
    } else {
      setPoopToast({ message: 'Need a shovel! 🪣', x })
    }
    setTimeout(() => setPoopToast(null), 1500)
  }

  // questionIndex is the only dep — same reasoning as phonics GameScreen:
  // progress.progressMap is current at render time; adding it would infinite-loop via recordPresented.
  useEffect(() => {
    const nextTopic = selectNextTopic(progress.progressMap)
    const nextQuestion = generateQuestion(nextTopic)
    progress.recordPresented(nextTopic.id)
    setTopic(nextTopic)
    setQuestion(nextQuestion)
    setLocked(false)
  }, [questionIndex])

  function advance(correct, coinsEarned = 1) {
    const nextIndex = questionIndex + 1
    if (correct) {
      sessionCorrect.current += 1
      sessionCoins.current += coinsEarned
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
    playCorrectSound()
    const coinReward = pet.jimmySleeping ? 0 : 1
    pet.onCorrect(coinReward)
    progress.recordCorrect(topic.id)
    jimmyRef.current?.react('happy')
    advance(true, coinReward)
  }

  function handleWrong() {
    if (locked) return
    setLocked(true)
    pet.onWrong()
    progress.recordWrong(topic.id)
    jimmyRef.current?.react('sad')
    advance(false)
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center gap-6 p-4">
      <div className="w-full flex items-center justify-between">
        <button
          onClick={onHome}
          className="min-h-16 min-w-16 flex items-center justify-center text-2xl rounded-2xl bg-white border-2 border-blue-300 text-blue-700"
          aria-label="Home"
        >
          🏠
        </button>
        <span className="text-sm font-bold text-blue-700">
          {questionIndex + 1} / {SESSION_LENGTH}
        </span>
      </div>

      <div className="w-full max-w-sm relative">
        <Jimmy
          ref={jimmyRef}
          stats={pet.stats}
          mood={pet.mood}
          poops={pet.stats.poops ?? []}
          onPoopTap={handlePoopTap}
        />
        {poopToast && (
          <div
            className="absolute text-sm font-bold bg-white rounded-xl px-3 py-1 shadow pointer-events-none"
            style={{ left: `${poopToast.x}%`, top: '20%', transform: 'translateX(-50%)' }}
          >
            {poopToast.message}
          </div>
        )}
      </div>

      {question && topic && (
        <div className="bg-white rounded-3xl shadow-lg w-full max-w-sm">
          <MathsQuestion
            key={questionIndex}
            question={question}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            locked={locked}
          />
        </div>
      )}
    </div>
  )
}
