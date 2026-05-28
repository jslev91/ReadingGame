import { useState } from 'react'
import { getGlobal } from './services/storage'
import ProfileSelectScreen from './screens/ProfileSelectScreen'
import HomeScreen from './screens/HomeScreen'
import GameScreen from './screens/GameScreen'
import SessionSummaryScreen from './screens/SessionSummaryScreen'
import ShopScreen from './screens/ShopScreen'
import ProgressScreen from './screens/ProgressScreen'

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
    return <ProfileSelectScreen onSelect={p => { setProfile(p); setScreen('home') }} />
  }

  if (screen === 'profiles') {
    return <ProfileSelectScreen onSelect={p => { setProfile(p); setScreen('home') }} />
  }

  if (screen === 'progress') {
    return <ProgressScreen userId={profile.id} onBack={() => setScreen('home')} />
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
    />
  )
}
