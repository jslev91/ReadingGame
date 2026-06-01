import { useState } from 'react'
import { getGlobal, setGlobal, getItem } from '../services/storage'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function loadProfiles() {
  const profiles = getGlobal('profiles') ?? []
  // Migration: profiles without subject default to 'phonics'
  return profiles.map(p => p.subject ? p : { ...p, subject: 'phonics' })
}

function saveProfiles(profiles) {
  setGlobal('profiles', profiles)
}

export function useProfiles(subject) {
  const [profiles, setProfiles] = useState(() => {
    const existing = loadProfiles()
    // Guest migration: if guest localStorage data exists and no profiles yet, seed a phonics profile
    if (existing.length === 0 && getItem('guest', 'petState') !== null) {
      const migrated = [{ id: 'guest', name: 'Player', colour: '#f97316', subject: 'phonics', createdAt: new Date().toISOString() }]
      saveProfiles(migrated)
      return migrated
    }
    return existing
  })

  function getProfilesForSubject(subj) {
    if (!subj) return profiles  // null/undefined = all subjects
    return profiles.filter(p => p.subject === subj)
  }

  function createProfile({ name, colour, subject: subjectOverride }) {
    const resolvedSubject = subjectOverride ?? subject ?? 'phonics'
    const profile = { id: uid(), name, colour, subject: resolvedSubject, createdAt: new Date().toISOString() }
    const next = [...profiles, profile]
    saveProfiles(next)
    setProfiles(next)
    return profile
  }

  function deleteProfile(id) {
    const next = profiles.filter(p => p.id !== id)
    saveProfiles(next)
    setProfiles(next)
  }

  function setActiveProfile(id) {
    setGlobal('activeProfile', id)
  }

  return {
    profiles: getProfilesForSubject(subject),
    createProfile,
    deleteProfile,
    setActiveProfile,
  }
}
