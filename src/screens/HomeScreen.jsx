import { useState } from 'react'
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
  const pet = usePet(GUEST.id)
  const [toast, setToast] = useState(null) // { message, x }

  function showToast(message, x) {
    setToast({ message, x })
    setTimeout(() => setToast(null), 1500)
  }

  function handlePoopTap(poopId) {
    const poop = pet.stats.poops.find(p => p.id === poopId)
    const x = poop?.x ?? 50
    if (pet.hasTool('shovel')) {
      pet.removePoop(poopId)
      showToast('✨ Clean!', x)
    } else {
      showToast('Need a shovel! 🪣', x)
    }
  }

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

      <div className="w-full max-w-sm relative">
        <Jimmy
          stats={pet.stats}
          mood={pet.mood}
          poops={pet.stats.poops ?? []}
          onPoopTap={handlePoopTap}
        />
        {toast && (
          <div
            className="absolute text-sm font-bold bg-white rounded-xl px-3 py-1 shadow pointer-events-none"
            style={{ left: `${toast.x}%`, top: '20%', transform: 'translateX(-50%)' }}
          >
            {toast.message}
          </div>
        )}
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
