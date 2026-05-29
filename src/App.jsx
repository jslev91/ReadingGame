import { useState } from 'react'
import { getGlobal } from './core/services/storage'
import TestModeSplash from './core/components/TestModeSplash'
import ProfileSelectScreen from './core/screens/ProfileSelectScreen'
import HomeScreen from './core/screens/HomeScreen'
import GameScreen from './subjects/phonics/screens/GameScreen'
import SessionSummaryScreen from './core/screens/SessionSummaryScreen'
import ShopScreen from './core/screens/ShopScreen'
import ProgressScreen from './subjects/phonics/screens/ProgressScreen'

const TEST_MODE = new URLSearchParams(window.location.search).get('testMode') === '1'

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
  const [testSplashDone, setTestSplashDone] = useState(false)

  if (TEST_MODE && !testSplashDone) {
    return <TestModeSplash onContinue={() => setTestSplashDone(true)} />
  }

  if (!profile) {
    return <ProfileSelectScreen subject="phonics" onSelect={p => { setProfile(p); setScreen('home') }} />
  }

  if (screen === 'profiles') {
    return <ProfileSelectScreen subject="phonics" onSelect={p => { setProfile(p); setScreen('home') }} />
  }

  if (screen === 'progress') {
    return <ProgressScreen userId={profile.id} onBack={() => setScreen('home')} />
  }

  if (screen === 'editProgress') {
    return <ProgressScreen userId={profile.id} editable onBack={() => setScreen('home')} />
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
      onEditGraphemes={() => setScreen('editProgress')}
    />
  )
}
