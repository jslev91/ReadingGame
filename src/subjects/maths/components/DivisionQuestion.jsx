import { useState, useEffect } from 'react'
import { speak } from '../../../core/services/tts'
import { factToSpeech } from './TimesTableQuestion'

function divisionToSpeech(fact, format) {
  if (format === 'division') return `${fact.answer} divided by ${fact.b}, equals`
  return `${fact.b} times what, equals ${fact.answer}`
}

export default function DivisionQuestion({ fact, format, options, onCorrect, onWrong, locked }) {
  const [chosen, setChosen] = useState(null)

  useEffect(() => {
    const cancel = speak('maths_tts', divisionToSpeech(fact, format))
    return cancel
  }, [])

  function handleTap(option) {
    if (locked || chosen !== null) return
    setChosen(option)
    if (option === fact.a) {
      onCorrect()
    } else {
      setTimeout(onWrong, 800)
    }
  }

  function buttonStyle(option) {
    const base = 'min-h-16 flex-1 text-3xl font-bold rounded-2xl border-2 transition-colors'
    if (chosen === null) return `${base} bg-white border-blue-300 active:scale-95`
    if (option === fact.a) return `${base} bg-green-400 border-green-500 text-white`
    if (option === chosen) return `${base} bg-red-400 border-red-500 text-white`
    return `${base} bg-white border-gray-200 opacity-40`
  }

  const equation = format === 'division'
    ? <>{fact.answer} ÷ {fact.b} = <span className="text-yellow-500">?</span></>
    : <>{fact.b} × <span className="text-yellow-500">?</span> = {fact.answer}</>

  return (
    <div className="p-6 flex flex-col gap-8 items-center">
      <p className="text-5xl font-bold text-gray-800 tracking-wide">
        {equation}
      </p>

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
