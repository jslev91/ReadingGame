import { useState, useEffect } from 'react'
import { speak } from '../../../core/services/tts'

const ONES = [
  'zero','one','two','three','four','five','six','seven','eight','nine',
  'ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen',
]
const TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety']

function numberWord(n) {
  if (n < 20) return ONES[n]
  if (n < 100) {
    const t = TENS[Math.floor(n / 10)]
    const o = n % 10
    return o === 0 ? t : `${t} ${ONES[o]}`
  }
  return 'one hundred'
}

function arithmeticToSpeech(fact) {
  if (fact.operation === 'add') {
    return `${numberWord(fact.a)} plus ${numberWord(fact.b)}, equals`
  }
  return `${numberWord(fact.a)} minus ${numberWord(fact.b)}, equals`
}

function nearbyDistractors(answer, band, count) {
  const result = []
  const offsets = band.maxAnswer > 20 ? [1, 2, 10, 11] : [1, 2, 3]
  for (const o of offsets) {
    if (result.length >= count) break
    if (answer + o <= band.maxAnswer + 5 && !result.includes(answer + o)) result.push(answer + o)
    if (result.length < count && answer - o >= 0 && !result.includes(answer - o)) result.push(answer - o)
  }
  return result.slice(0, count)
}

export default function ArithmeticQuestion({ band, fact, options, onCorrect, onWrong, locked }) {
  const [chosen, setChosen] = useState(null)

  useEffect(() => {
    const cancel = speak('arith_tts', arithmeticToSpeech(fact))
    return cancel
  }, [])

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

  const symbol = fact.operation === 'add' ? '+' : '−'

  return (
    <div className="p-6 flex flex-col gap-8 items-center">
      <p className="text-5xl font-bold text-gray-800 tracking-wide">
        {fact.a} {symbol} {fact.b} = <span className="text-yellow-500">?</span>
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

// Exported for use in GameScreen — keeps option generation co-located with the component
export function generateArithmeticOptions(fact, band, status) {
  const optionCount = (status === 'practising' || status === 'mastered') ? 4 : 3
  const distractors = nearbyDistractors(fact.answer, band, optionCount - 1)
  const options = [fact.answer, ...distractors].sort(() => Math.random() - 0.5)
  return { options, optionCount }
}
