import { usePet } from '../hooks/usePet'

const GUEST = { id: 'guest', name: 'Player' }
const MOOD_EMOJI = { happy: '😊', okay: '😐', sad: '😢' }

export default function HomeScreen({ onPlay }) {
  const { mood } = usePet(GUEST.id)

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-2">
        <span className="text-9xl">🦒</span>
        <span className="text-3xl">{MOOD_EMOJI[mood]}</span>
      </div>

      <button
        onClick={onPlay}
        className="min-h-16 px-10 py-4 bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-yellow-900 text-2xl font-bold rounded-3xl shadow-md transition-transform"
      >
        Play with Jimmy
      </button>
    </div>
  )
}
