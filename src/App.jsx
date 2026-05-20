import { useEffect } from 'react'
import { usePet } from './hooks/usePet'
import PhonemeQuestion from './components/PhonemeQuestion'
import phonics from './data/phonics'

const GUEST = { id: 'guest', name: 'Player' }

// Hardcoded test entry — "sh" from Phase 3
const TEST_ENTRY = phonics.find(p => p.grapheme === 'sh')

const MOOD_EMOJI = { happy: '😄', okay: '😐', sad: '😢' }

export default function App() {
  const { energy, mood, onCorrect, onWrong } = usePet(GUEST.id)

  useEffect(() => {
    console.log('[App] pet state — energy:', energy, 'mood:', mood)
  }, [energy, mood])

  function handleCorrect() {
    onCorrect()
    console.log('[App] correct answer')
  }

  function handleWrong() {
    onWrong()
    console.log('[App] wrong answer')
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-3xl font-bold text-yellow-700">Jimmy Phonics</h1>

      <div className="flex items-center gap-4 bg-white rounded-2xl px-6 py-3 shadow">
        <span className="text-3xl">{MOOD_EMOJI[mood]}</span>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Jimmy</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${energy}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-600">{energy}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg w-full max-w-sm">
        <PhonemeQuestion
          entry={TEST_ENTRY}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
        />
      </div>
    </div>
  )
}
