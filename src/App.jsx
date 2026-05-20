import { useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import GameScreen from './screens/GameScreen'

export default function App() {
  const [screen, setScreen] = useState('home')

  if (screen === 'game') {
    return <GameScreen onHome={() => setScreen('home')} />
  }

  return <HomeScreen onPlay={() => setScreen('game')} />
}
