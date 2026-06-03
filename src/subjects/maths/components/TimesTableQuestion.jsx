import { useState } from 'react'

export default function TimesTableQuestion({ fact, options, onCorrect, onWrong, locked }) {
  const [chosen, setChosen] = useState(null)
  // Randomly show b × a or a × b to reinforce commutativity
  const [flip] = useState(() => Math.random() < 0.5)

  function handleTap(option) {
    if (locked || chosen !== null) return
    setChosen(option)
    if (option === fact.answer) {
      onCorrect()
    } else {
      setTimeout(onWrong, 800)
    }
  }

  function buttonStyle(option) {
    const base = 'min-h-16 flex-1 text-3xl font-bold rounded-2xl border-2 transition-colors'
    if (chosen === null) return `${base} bg-white border-yellow-300 active:scale-95`
    if (option === fact.answer) return `${base} bg-green-400 border-green-500 text-white`
    if (option === chosen) return `${base} bg-red-400 border-red-500 text-white`
    return `${base} bg-white border-gray-200 opacity-40`
  }

  const [leftFactor, rightFactor] = flip ? [fact.a, fact.b] : [fact.b, fact.a]

  return (
    <div className="p-6 flex flex-col gap-8 items-center">
      <p className="text-5xl font-bold text-gray-800 tracking-wide">
        {leftFactor} × {rightFactor} = <span className="text-yellow-500">?</span>
      </p>

      {/* 4-option layout wraps 2+2; 3-option sits side by side */}
      <div className={`flex gap-3 w-full ${options.length === 4 ? 'flex-wrap' : ''}`}>
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => handleTap(opt)}
            className={`${buttonStyle(opt)} ${options.length === 4 ? 'basis-[calc(50%-0.375rem)]' : ''}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
