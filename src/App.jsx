import { useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import GameScreen from './screens/GameScreen'
import SessionSummaryScreen from './screens/SessionSummaryScreen'
import ShopScreen from './screens/ShopScreen'
import ProgressScreen from './screens/ProgressScreen'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [sessionResult, setSessionResult] = useState(null)

  if (screen === 'progress') {
    return <ProgressScreen onBack={() => setScreen('home')} />
  }

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

  if (screen === 'shop') {
    return <ShopScreen onBack={() => setScreen('home')} />
  }

  return <HomeScreen onPlay={() => setScreen('game')} onShop={() => setScreen('shop')} onProgress={() => setScreen('progress')} />
}
