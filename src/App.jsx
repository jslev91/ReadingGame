import { useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import GameScreen from './screens/GameScreen'
import SessionSummaryScreen from './screens/SessionSummaryScreen'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [sessionResult, setSessionResult] = useState(null)

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
        stats={sessionResult.stats}
        mood={sessionResult.mood}
        onPlayAgain={() => setScreen('game')}
        onHome={() => setScreen('home')}
      />
    )
  }

  return <HomeScreen onPlay={() => setScreen('game')} />
}
