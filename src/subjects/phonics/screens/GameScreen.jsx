import { useState, useEffect, useRef } from 'react'
import { usePet } from '../../../core/hooks/usePet'
import { useProgress, selectNextTrickyWord } from '../hooks/useProgress'
import { selectNextQuestion } from '../../../services/questionSelector'
import { selectBlendingWord } from '../../../data/words'
import Jimmy from '../../../core/components/Jimmy'
import PhonemeQuestion from '../components/PhonemeQuestion'
import InitialSoundQuestion from '../components/InitialSoundQuestion'
import BlendingQuestion from '../components/BlendingQuestion'
import SpellingQuestion from '../components/SpellingQuestion'
import TrickyWordQuestion from '../components/TrickyWordQuestion'

const SESSION_LENGTH = 10

export default function GameScreen({ userId, onHome, onSessionComplete }) {
  const pet = usePet(userId)
  const progress = useProgress(userId)
  const trickyQuestion = useRef(null)
  const [question, setQuestion] = useState(null)
  const [locked, setLocked] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [poopToast, setPoopToast] = useState(null)
  const jimmyRef = useRef(null)

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

    // Weighted question type selection: 35% phoneme, 20% initial, 15% blending, 15% spelling, 15% tricky
    // Types not yet eligible have weight 0; remaining weights are rescaled proportionally.
    const blendingEligible = blending !== null
    const initialEligible = introCount >= 2
    const tricky = selectNextTrickyWord(progress.trickyWordProgressMap)
    trickyQuestion.current = tricky
    const typeWeights = {
      phoneme:  0.35,
      initial:  initialEligible  ? 0.20 : 0,
      blending: blendingEligible ? 0.15 : 0,
      spelling: blendingEligible ? 0.15 : 0,
      tricky:   tricky           ? 0.15 : 0,
    }
    const totalWeight = Object.values(typeWeights).reduce((a, b) => a + b, 0)
    let r = Math.random() * totalWeight
    let type = 'phoneme'
    for (const [t, w] of Object.entries(typeWeights)) {
      r -= w
      if (r <= 0) { type = t; break }
    }

    if (type === 'blending' || type === 'spelling') {
      setQuestion({ type, ...blending })
    } else if (type === 'tricky') {
      progress.recordTrickyPresented(trickyQuestion.current.targetWord.word)
      setQuestion({ type, ...trickyQuestion.current })
    } else {
      const next = selectNextQuestion(progress.progressMap)
      progress.recordPresented(next.entry.grapheme)
      setQuestion({ type, ...next })
    }
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
    const coinReward = pet.jimmySleeping ? 0 : 1
    pet.onCorrect(coinReward)
    if (question.type === 'tricky') {
      progress.recordTrickyCorrect(question.targetWord.word)
    } else if (question.type !== 'blending' && question.type !== 'spelling') {
      progress.recordCorrect(question.entry.grapheme)
    }
    jimmyRef.current?.react('happy')
    advance(true, coinReward)
  }

  function handleWrong() {
    if (locked) return
    setLocked(true)
    pet.onWrong()
    if (question.type === 'tricky') {
      progress.recordTrickyWrong(question.targetWord.word)
    } else if (question.type !== 'blending' && question.type !== 'spelling') {
      progress.recordWrong(question.entry.grapheme)
    }
    jimmyRef.current?.react('sad')
    advance(false)
  }

  function renderQuestion() {
    if (!question) return null
    if (question.type === 'tricky') {
      return (
        <TrickyWordQuestion
          key={'tricky-' + questionIndex}
          targetWord={question.targetWord}
          distractors={question.distractors}
          status={progress.trickyWordProgressMap[question.targetWord.word]?.status ?? 'seen'}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          locked={locked}
        />
      )
    }
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
    if (question.type === 'spelling') {
      return (
        <SpellingQuestion
          key={'spelling-' + questionIndex}
          wordEntry={question.wordEntry}
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
          {renderQuestion()}
        </div>
      )}
    </div>
  )
}
