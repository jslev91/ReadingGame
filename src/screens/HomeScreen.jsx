import { usePet } from '../hooks/usePet'
import Jimmy from '../components/Jimmy'

const GUEST = { id: 'guest', name: 'Player' }

export default function HomeScreen({ onPlay }) {
  const { stats, mood } = usePet(GUEST.id)

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center gap-8 p-6">
      <div className="w-full max-w-sm">
        <Jimmy stats={stats} mood={mood} />
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
