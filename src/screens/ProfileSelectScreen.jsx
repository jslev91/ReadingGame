import { useState } from 'react'
import { getGlobal, setGlobal, getItem } from '../services/storage'

const COLOURS = [
  '#f97316', // orange
  '#3b82f6', // blue
  '#22c55e', // green
  '#ec4899', // pink
  '#a855f7', // purple
  '#eab308', // yellow
]

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function loadProfiles() {
  return getGlobal('profiles') ?? []
}

function saveProfiles(profiles) {
  setGlobal('profiles', profiles)
}

function ProfileCard({ profile, onSelect, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div
      className="relative flex flex-col items-center justify-center rounded-3xl p-6 min-h-32 cursor-pointer active:scale-95 transition-transform shadow-md"
      style={{ backgroundColor: profile.colour }}
      onClick={() => !confirmDelete && onSelect(profile)}
    >
      <span className="text-4xl font-black text-white drop-shadow">{profile.name[0].toUpperCase()}</span>
      <span className="text-white font-bold mt-1 text-lg">{profile.name}</span>
      {confirmDelete ? (
        <div className="absolute inset-0 bg-black/60 rounded-3xl flex flex-col items-center justify-center gap-2 p-3">
          <span className="text-white text-sm font-bold text-center">Delete {profile.name}?</span>
          <div className="flex gap-2">
            <button
              onClick={e => { e.stopPropagation(); onDelete(profile.id) }}
              className="bg-red-500 text-white text-xs font-bold rounded-xl px-3 py-1"
            >Yes</button>
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(false) }}
              className="bg-white text-gray-700 text-xs font-bold rounded-xl px-3 py-1"
            >No</button>
          </div>
        </div>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
          className="absolute top-2 right-2 text-white/60 text-xs hover:text-white"
          aria-label="Delete profile"
        >✕</button>
      )}
    </div>
  )
}

export default function ProfileSelectScreen({ onSelect }) {
  const [profiles, setProfiles] = useState(() => {
    const existing = loadProfiles()
    // Guest migration: if guest data exists and no profiles yet, seed a guest profile
    if (existing.length === 0 && getItem('guest', 'petState') !== null) {
      const migrated = [{ id: 'guest', name: 'Player', colour: '#f97316' }]
      saveProfiles(migrated)
      return migrated
    }
    return existing
  })
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [colour, setColour] = useState(COLOURS[0])

  function handleSelect(profile) {
    setGlobal('activeProfile', profile.id)
    onSelect(profile)
  }

  function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return
    const profile = { id: uid(), name: trimmed, colour }
    const next = [...profiles, profile]
    saveProfiles(next)
    setProfiles(next)
    setCreating(false)
    setName('')
    setColour(COLOURS[0])
    handleSelect(profile)
  }

  function handleDelete(id) {
    const next = profiles.filter(p => p.id !== id)
    saveProfiles(next)
    setProfiles(next)
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center">
        <div className="text-6xl mb-2">🦒</div>
        <h1 className="text-3xl font-black text-yellow-800">Jimmy Phonics</h1>
        <p className="text-yellow-600 font-semibold mt-1">Who's playing?</p>
      </div>

      {profiles.length > 0 && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {profiles.map(p => (
            <ProfileCard key={p.id} profile={p} onSelect={handleSelect} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {creating ? (
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
              onClick={() => { setCreating(false); setName('') }}
              className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold"
            >Cancel</button>
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="flex-1 py-3 rounded-2xl bg-yellow-400 text-yellow-900 font-bold disabled:opacity-40"
            >Create</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="min-h-16 px-8 py-4 border-2 border-dashed border-yellow-400 rounded-3xl text-yellow-600 font-bold text-lg active:scale-95 transition-transform"
        >
          + New Profile
        </button>
      )}
    </div>
  )
}
