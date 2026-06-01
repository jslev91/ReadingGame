import { useState } from 'react'
import { useProfiles } from '../hooks/useProfiles'
import CreateProfileScreen from './CreateProfileScreen'

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

export default function ProfileSelectScreen({ subject = null, onSelect }) {
  const { profiles, createProfile, deleteProfile, setActiveProfile } = useProfiles(subject)
  const [creating, setCreating] = useState(false)

  function handleSelect(profile) {
    setActiveProfile(profile.id)
    onSelect(profile)
  }

  function handleCreated({ name, colour, subject: chosenSubject }) {
    const profile = createProfile({ name, colour, subject: chosenSubject })
    setCreating(false)
    handleSelect(profile)
  }

  function handleDelete(id) {
    deleteProfile(id)
  }

  const appTitle = subject === 'maths' ? 'Jimmy Maths' : subject === 'phonics' ? 'Jimmy Phonics' : 'Jimmy'

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center">
        <div className="text-6xl mb-2">🦒</div>
        <h1 className="text-3xl font-black text-yellow-800">{appTitle}</h1>
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
        <CreateProfileScreen
          defaultSubject={subject}
          onCreated={handleCreated}
          onCancel={() => setCreating(false)}
        />
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
