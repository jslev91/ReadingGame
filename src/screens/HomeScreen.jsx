import { usePet } from '../hooks/usePet'
import { removeItem } from '../services/storage'
import Jimmy from '../components/Jimmy'

const GUEST = { id: 'guest', name: 'Player' }

function handleReset() {
  removeItem(GUEST.id, 'graphemeProgress')
  removeItem(GUEST.id, 'petState')
  window.location.reload()
}

export default function HomeScreen({ onPlay, onShop }) {
  const { stats, mood } = usePet(GUEST.id)

  return (
    <div className="relative min-h-screen bg-yellow-50 flex flex-col items-center justify-center gap-8 p-6">
      {/* Shop button */}
      <button
        onClick={onShop}
        className="absolute top-4 right-4 min-h-16 min-w-16 flex items-center justify-center text-2xl rounded-2xl bg-white border-2 border-yellow-300 text-yellow-700 shadow-sm"
        aria-label="Shop"
      >
        🛍️
      </button>

      <div className="w-full max-w-sm">
        <Jimmy stats={stats} mood={mood} />
      </div>

      <button
        onClick={onPlay}
        className="min-h-16 px-10 py-4 bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-yellow-900 text-2xl font-bold rounded-3xl shadow-md transition-transform"
      >
        Play with Jimmy
      </button>

      <button
        onClick={() => { if (window.confirm('Reset all progress?')) handleReset() }}
        className="absolute bottom-4 right-4 text-xs text-gray-300 px-2 py-1 rounded"
        aria-label="Reset progress"
      >
        reset
      </button>
    </div>
  )
}
