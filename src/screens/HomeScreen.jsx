import { useState, useRef } from 'react'
import { usePet } from '../hooks/usePet'
import { removeItem, getGlobal, setGlobal } from '../services/storage'
import Jimmy from '../components/Jimmy'

function ParentPanel({ profile, onClose, onSwitchProfile, onDeleteProfile, onResetProgress }) {
  const [confirm, setConfirm] = useState(null) // 'reset' | 'delete'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-black text-gray-800 text-lg">Parent Settings</span>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">✕</button>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
          <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: profile.colour }} />
          <span className="font-bold text-gray-700">{profile.name}</span>
        </div>

        <button
          onClick={onSwitchProfile}
          className="w-full py-3 rounded-2xl border-2 border-yellow-300 text-yellow-800 font-bold"
        >
          Switch Profile
        </button>

        {confirm === 'reset' ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-center text-gray-600">Reset all of {profile.name}'s progress?<br/>This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold">Cancel</button>
              <button onClick={onResetProgress} className="flex-1 py-3 rounded-2xl bg-orange-400 text-white font-bold">Reset</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirm('reset')}
            className="w-full py-3 rounded-2xl border-2 border-orange-200 text-orange-600 font-bold"
          >
            Reset {profile.name}'s Progress
          </button>
        )}

        {confirm === 'delete' ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-center text-gray-600">Delete {profile.name}?<br/>All progress will be lost.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold">Cancel</button>
              <button onClick={onDeleteProfile} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold">Delete</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirm('delete')}
            className="w-full py-3 rounded-2xl border-2 border-red-200 text-red-500 font-bold"
          >
            Delete Profile
          </button>
        )}
      </div>
    </div>
  )
}

export default function HomeScreen({ userId, profile, onPlay, onShop, onProgress, onSwitchProfile, onDeleteProfile }) {
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
        <ParentPanel
          profile={profile}
          onClose={() => setParentOpen(false)}
          onSwitchProfile={() => { setParentOpen(false); onSwitchProfile() }}
          onResetProgress={handleResetProgress}
          onDeleteProfile={handleDeleteProfile}
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
