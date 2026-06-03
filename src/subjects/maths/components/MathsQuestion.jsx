import { useState, useEffect, useCallback } from 'react'
import { speak } from '../../../core/services/tts'

// Dots arranged in rows of 5 (subitising-friendly)
function DotGrid({ count, colour = 'bg-blue-400' }) {
  const rows = []
  let rem = count
  while (rem > 0) {
    rows.push(Math.min(rem, 5))
    rem -= 5
  }
  return (
    <div className="flex flex-col items-center gap-1.5">
      {rows.map((n, ri) => (
        <div key={ri} className="flex gap-1.5">
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className={`w-8 h-8 rounded-full ${colour}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

// Subtraction: first `remaining` dots blue, last `b` dots grey with ✕
function SubtractionDots({ a, b }) {
  const remaining = a - b
  const rows = []
  let rem = a
  let startIdx = 0
  while (rem > 0) {
    const count = Math.min(rem, 5)
    rows.push({ count, startIdx })
    startIdx += count
    rem -= count
  }
  return (
    <div className="flex flex-col items-center gap-1.5">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {Array.from({ length: row.count }, (_, i) => {
            const idx = row.startIdx + i
            const removed = idx >= remaining
            return (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  removed ? 'bg-red-200 text-red-400' : 'bg-blue-400'
                }`}
              >
                {removed ? '✕' : ''}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function QuestionVisual({ question }) {
  switch (question.type) {
    case 'counting':
      // numbers_to_20 topic uses minN 11 — show the numeral for recognition
      if (question.minN >= 11) {
        return <div className="text-8xl font-bold text-blue-500 py-2 select-none">{question.n}</div>
      }
      return <DotGrid count={question.n} />

    case 'addition':
      return (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <DotGrid count={question.a} colour="bg-blue-400" />
          <span className="text-4xl font-bold text-gray-400">+</span>
          <DotGrid count={question.b} colour="bg-green-400" />
        </div>
      )

    case 'subtraction':
      return <SubtractionDots a={question.a} b={question.b} />

    case 'bond':
      return (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {question.unknownFirst ? (
            <>
              <div className="w-14 h-14 rounded-2xl border-4 border-dashed border-yellow-400 flex items-center justify-center text-2xl font-bold text-yellow-500">?</div>
              <span className="text-3xl font-bold text-gray-400">+</span>
              <DotGrid count={question.known} colour="bg-blue-400" />
              <span className="text-3xl font-bold text-gray-400">=</span>
              <span className="text-3xl font-bold text-gray-700">{question.total}</span>
            </>
          ) : (
            <>
              <DotGrid count={question.known} colour="bg-blue-400" />
              <span className="text-3xl font-bold text-gray-400">+</span>
              <div className="w-14 h-14 rounded-2xl border-4 border-dashed border-yellow-400 flex items-center justify-center text-2xl font-bold text-yellow-500">?</div>
              <span className="text-3xl font-bold text-gray-400">=</span>
              <span className="text-3xl font-bold text-gray-700">{question.total}</span>
            </>
          )}
        </div>
      )

    default:
      return null
  }
}

function getEquation(question) {
  switch (question.type) {
    case 'counting':
      return question.minN >= 11 ? 'What number is this?' : 'How many dots?'
    case 'addition':
      return `${question.a} + ${question.b} = ?`
    case 'subtraction':
      return `${question.a} − ${question.b} = ?`
    case 'bond':
      return question.unknownFirst
        ? `? + ${question.known} = ${question.total}`
        : `${question.known} + ? = ${question.total}`
    default:
      return ''
  }
}

function getPrompt(question) {
  switch (question.type) {
    case 'counting':
      return question.minN >= 11 ? 'What number is this?' : 'How many dots?'
    case 'addition':
      return `${question.a} plus ${question.b}. How many altogether?`
    case 'subtraction':
      return `${question.a} take away ${question.b}. How many are left?`
    case 'bond':
      return question.unknownFirst
        ? `What goes with ${question.known} to make ${question.total}?`
        : `${question.known} plus what number makes ${question.total}?`
    default:
      return ''
  }
}

export default function MathsQuestion({ question, onCorrect, onWrong, locked }) {
  const [chosen, setChosen] = useState(null)
  const prompt = getPrompt(question)

  useEffect(() => {
    const cancel = speak('maths_tts', prompt)
    return cancel
  }, [])

  const replay = useCallback(() => speak('maths_tts', prompt), [prompt])

  function handleTap(option) {
    if (locked || chosen !== null) return
    setChosen(option)
    if (option === question.answer) {
      onCorrect()
    } else {
      setTimeout(onWrong, 800)
    }
  }

  function buttonStyle(option) {
    const base = 'min-h-16 flex-1 text-3xl font-bold rounded-2xl border-2 transition-colors'
    if (chosen === null) return `${base} bg-white border-yellow-300 active:scale-95`
    if (option === question.answer) return `${base} bg-green-400 border-green-500 text-white`
    if (option === chosen) return `${base} bg-red-400 border-red-500 text-white`
    return `${base} bg-white border-gray-200 opacity-40`
  }

  return (
    <div className="p-6 flex flex-col gap-6 items-center">
      <div className="min-h-20 flex items-center justify-center">
        <QuestionVisual question={question} />
      </div>

      <div className="flex items-center gap-2">
        <p className="text-xl font-bold text-center text-gray-700">{getEquation(question)}</p>
        <button onClick={replay} aria-label="Replay" className="text-xl ml-1">🔊</button>
      </div>

      <div className="flex gap-3 w-full">
        {question.options.map(opt => (
          <button key={opt} onClick={() => handleTap(opt)} className={buttonStyle(opt)}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
