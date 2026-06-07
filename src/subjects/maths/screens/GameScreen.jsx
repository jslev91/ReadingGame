import { useState, useEffect, useRef } from 'react'
import { usePet } from '../../../core/hooks/usePet'
import { playCorrectSound } from '../../../core/services/sounds'
import { useMathsProgress, selectNextBand } from '../hooks/useProgress'
import { selectNextTopic, generateQuestion } from '../services/questionSelector'
import { generateArithmeticFact } from '../data/curriculum'
import Jimmy from '../../../core/components/Jimmy'
import TimesTableQuestion from '../components/TimesTableQuestion'
import DivisionQuestion from '../components/DivisionQuestion'
import ArithmeticQuestion, { generateArithmeticOptions } from '../components/ArithmeticQuestion'

const SESSION_LENGTH = 10

export default function GameScreen({ userId, onHome, onSessionComplete, introductionPace = 'normal', onAnswer }) {
  const pet = usePet(userId)
  const progress = useMathsProgress(userId)
  const [question, setQuestion] = useState(null)
  const [currentTopic, setCurrentTopic] = useState(null)
  const [currentBand, setCurrentBand] = useState(null)
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

  // questionIndex is the only dep — same reasoning as phonics GameScreen
  useEffect(() => {
    // Weighted question type: 40% TimesTable, 25% Division (if eligible), 35% Arithmetic
    const topic = selectNextTopic(progress.progressMap, introductionPace)
    const topicStatus = progress.progressMap[topic.id]?.status ?? 'unseen'
    const divEligible = topicStatus === 'practising' || topicStatus === 'mastered'

    const weights = { times: 0.40, division: divEligible ? 0.25 : 0, arithmetic: 0.35 }
    const total = Object.values(weights).reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    let kind = 'times'
    for (const [k, w] of Object.entries(weights)) {
      r -= w
      if (r <= 0) { kind = k; break }
    }

    if (kind === 'arithmetic') {
      const band = selectNextBand(progress.bandProgressMap, introductionPace)
      const fact = generateArithmeticFact(band)
      const bandStatus = progress.bandProgressMap[band.id]?.status ?? 'unseen'
      const { options } = generateArithmeticOptions(fact, band, bandStatus)
      progress.recordBandPresented(band.id)
      setCurrentBand(band)
      setCurrentTopic(null)
      setQuestion({ kind: 'arithmetic', fact, options })
    } else {
      progress.recordPresented(topic.id)
      const format = kind === 'division' ? (Math.random() < 0.5 ? 'division' : 'missing-factor') : null
      setCurrentTopic(topic)
      setCurrentBand(null)
      setQuestion(generateQuestion(topic, topicStatus, kind === 'division' ? 'division' : 'times_table', format))
    }
    setLocked(false)
  }, [questionIndex])

  function advance(correct, coinsEarned = 1) {
    onAnswer?.(correct)
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
    if (currentBand) {
      progress.recordBandCorrect(currentBand.id)
    } else {
      progress.recordCorrect(currentTopic.id)
    }
    jimmyRef.current?.react('happy')
    advance(true, coinReward)
  }

  function handleWrong() {
    if (locked) return
    setLocked(true)
    pet.onWrong()
    if (currentBand) {
      progress.recordBandWrong(currentBand.id)
    } else {
      progress.recordWrong(currentTopic.id)
    }
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

      {question && (
        <div className="bg-white rounded-3xl shadow-lg w-full max-w-sm">
          {question.kind === 'arithmetic' ? (
            <ArithmeticQuestion
              key={questionIndex}
              band={currentBand}
              fact={question.fact}
              options={question.options}
              onCorrect={handleCorrect}
              onWrong={handleWrong}
              locked={locked}
            />
          ) : question.kind === 'division' ? (
            <DivisionQuestion
              key={questionIndex}
              fact={question.fact}
              format={question.format}
              options={question.options}
              onCorrect={handleCorrect}
              onWrong={handleWrong}
              locked={locked}
            />
          ) : (
            <TimesTableQuestion
              key={questionIndex}
              fact={question.fact}
              options={question.options}
              onCorrect={handleCorrect}
              onWrong={handleWrong}
              locked={locked}
            />
          )}
        </div>
      )}
    </div>
  )
}
