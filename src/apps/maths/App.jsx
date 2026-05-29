import { useState } from 'react'
import { getGlobal } from '../../core/services/storage'
import ProfileSelectScreen from '../../core/screens/ProfileSelectScreen'
import HomeScreen from '../../core/screens/HomeScreen'
import GameScreen from '../../subjects/maths/screens/GameScreen'
import SessionSummaryScreen from '../../core/screens/SessionSummaryScreen'
import ShopScreen from '../../core/screens/ShopScreen'
import ProgressScreen from '../../subjects/maths/screens/ProgressScreen'

function loadActiveProfile() {
  const id = getGlobal('activeProfile')
  if (!id) return null
  const profiles = getGlobal('profiles') ?? []
  return profiles.find(p => p.id === id) ?? null
}

export default function App() {
  const [profile, setProfile] = useState(() => loadActiveProfile())
  const [screen, setScreen] = useState('home')
  const [sessionResult, setSessionResult] = useState(null)

  if (!profile) {
    return <ProfileSelectScreen subject="maths" onSelect={p => { setProfile(p); setScreen('home') }} />
  }

  if (screen === 'profiles') {
    return <ProfileSelectScreen subject="maths" onSelect={p => { setProfile(p); setScreen('home') }} />
  }

  if (screen === 'progress') {
    return <ProgressScreen onBack={() => setScreen('home')} />
  }

  if (screen === 'game') {
    return (
      <GameScreen
        userId={profile.id}
        onHome={() => setScreen('home')}
        onSessionComplete={result => {
          setSessionResult(result)
          setScreen('summary')
        }}
      />
    )
  }

  if (screen === 'summary') {
    return (
      <SessionSummaryScreen
        result={sessionResult}
        stats={sessionResult.stats}
        mood={sessionResult.mood}
        onPlayAgain={() => setScreen('game')}
        onHome={() => setScreen('home')}
      />
    )
  }

  if (screen === 'shop') {
    return <ShopScreen userId={profile.id} onBack={() => setScreen('home')} />
  }

  return (
    <HomeScreen
      userId={profile.id}
      profile={profile}
      onPlay={() => setScreen('game')}
      onShop={() => setScreen('shop')}
      onProgress={() => setScreen('progress')}
      onSwitchProfile={() => setScreen('profiles')}
      onDeleteProfile={() => { setProfile(null); setScreen('home') }}
      onEditGraphemes={() => setScreen('progress')}
    />
  )
}
