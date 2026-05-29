import { useState, useRef } from 'react'
import { usePet } from '../hooks/usePet'
import { removeItem, getGlobal, setGlobal } from '../services/storage'
import Jimmy from '../components/Jimmy'
import ParentAreaScreen from './ParentAreaScreen'

export default function HomeScreen({ userId, profile, onPlay, onShop, onProgress, onSwitchProfile, onDeleteProfile, onEditGraphemes }) {
  const pet = usePet(userId)
  const [toast, setToast] = useState(null)
  const [parentOpen, setParentOpen] = useState(false)
  const longPressTimer = useRef(null)

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

  function handleResetProgress() {
    removeItem(userId, 'graphemeProgress')
    removeItem(userId, 'petState')
    removeItem(userId, 'trickyWordProgress')
    window.location.reload()
  }

  function handleDeleteProfile() {
    const profiles = (getGlobal('profiles') ?? []).filter(p => p.id !== userId)
    setGlobal('profiles', profiles)
    setGlobal('activeProfile', null)
    onDeleteProfile()
  }

  function startLongPress(e) {
    e.preventDefault()
    longPressTimer.current = setTimeout(() => setParentOpen(true), 800)
  }

  function cancelLongPress() {
    clearTimeout(longPressTimer.current)
  }

  return (
    <div className="relative min-h-screen bg-yellow-50 flex flex-col items-center justify-center gap-8 p-6">
      {parentOpen && (
        <ParentAreaScreen
          profile={profile}
          onClose={() => setParentOpen(false)}
          onSwitchProfile={() => { setParentOpen(false); onSwitchProfile() }}
          onResetProgress={handleResetProgress}
          onDeleteProfile={handleDeleteProfile}
          onEditGraphemes={() => { setParentOpen(false); onEditGraphemes() }}
        />
      )}

      {/* Top buttons */}
      <button
        onClick={onShop}
        className="absolute top-4 right-4 min-h-16 min-w-16 flex items-center justify-center text-2xl rounded-2xl bg-white border-2 border-yellow-300 text-yellow-700 shadow-sm"
        aria-label="Shop"
      >
        🛍️
      </button>
      <button
        onClick={onProgress}
        className="absolute top-4 left-4 min-h-16 min-w-16 flex items-center justify-center text-2xl rounded-2xl bg-white border-2 border-yellow-300 text-yellow-700 shadow-sm"
        aria-label="Progress"
      >
        ⭐
      </button>

      {/* Profile indicator */}
      <button
        onClick={onSwitchProfile}
        className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-yellow-200 shadow-sm active:scale-95 transition-transform"
        aria-label="Switch profile"
      >
        <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: profile.colour }} />
        <span className="font-bold text-yellow-900">{profile.name}</span>
        <span className="text-gray-400 text-xs">▼</span>
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

      {/* Long-press gear: parent access only */}
      <button
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onContextMenu={e => e.preventDefault()}
        className="absolute bottom-4 left-4 text-gray-300 text-xl px-2 py-1 rounded select-none"
        style={{ touchAction: 'none' }}
        aria-label="Parent settings (hold)"
      >
        ⚙️
      </button>
    </div>
  )
}
