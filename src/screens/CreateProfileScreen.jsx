import { useState } from 'react'

const COLOURS = [
  '#f97316',
  '#3b82f6',
  '#22c55e',
  '#ec4899',
  '#a855f7',
  '#eab308',
]

export default function CreateProfileScreen({ onCreated, onCancel }) {
  const [name, setName] = useState('')
  const [colour, setColour] = useState(COLOURS[0])

  function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return
    onCreated({ name: trimmed, colour })
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-md flex flex-col gap-4">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleCreate()}
        autoFocus
        maxLength={20}
        className="border-2 border-yellow-300 rounded-xl px-4 py-3 text-xl font-bold text-yellow-900 outline-none focus:border-yellow-500"
      />
      <div className="flex gap-3 justify-center">
        {COLOURS.map(c => (
          <button
            key={c}
            onClick={() => setColour(c)}
            className="w-10 h-10 rounded-full border-4 transition-transform active:scale-95"
            style={{
              backgroundColor: c,
              borderColor: colour === c ? '#1f2937' : 'transparent',
              transform: colour === c ? 'scale(1.2)' : undefined,
            }}
            aria-label={c}
          />
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold"
        >Cancel</button>
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="flex-1 py-3 rounded-2xl bg-yellow-400 text-yellow-900 font-bold disabled:opacity-40"
        >Create</button>
      </div>
    </div>
  )
}
