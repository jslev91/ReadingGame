import { useState } from 'react'

export default function ParentAreaScreen({ profile, onClose, onSwitchProfile, onDeleteProfile, onResetProgress, onEditGraphemes }) {
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

        <button
          onClick={onEditGraphemes}
          className="w-full py-3 rounded-2xl border-2 border-blue-200 text-blue-600 font-bold"
        >
          Edit Graphemes
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
