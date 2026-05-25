import { useState } from 'react'
import { usePet } from './hooks/usePet'
import HomeScreen from './screens/HomeScreen'
import GameScreen from './screens/GameScreen'
import SessionSummaryScreen from './screens/SessionSummaryScreen'

const GUEST = { id: 'guest', name: 'Player' }

export default function App() {
  const [screen, setScreen] = useState('home')
  const [sessionResult, setSessionResult] = useState(null)
  const { stats, mood } = usePet(GUEST.id)

  if (screen === 'game') {
    return (
      <GameScreen
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
        stats={stats}
        mood={mood}
        onPlayAgain={() => setScreen('game')}
        onHome={() => setScreen('home')}
      />
    )
  }

  return <HomeScreen onPlay={() => setScreen('game')} />
}
