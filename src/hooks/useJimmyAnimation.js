import { useState, useEffect, useRef } from 'react'

const TICK_MS = 400
const STEP = 2
const REST_CHANCE = 1 / 25

export function useJimmyAnimation() {
  const [pose, setPose]           = useState('idle')
  const [direction, setDirection] = useState('right')
  const [x, setX]                 = useState(10)
  const [mode, setMode]           = useState('wandering')

  // Refs so interval callback always reads current values without being re-created
  const stateRef = useRef({ pose, direction, x, mode })
  useEffect(() => { stateRef.current = { pose, direction, x, mode } }, [pose, direction, x, mode])

  const reactionTimerRef = useRef(null)

  useEffect(() => {
    let walkFrame = false // alternates walk-1 / walk-2

    const id = setInterval(() => {
      const { mode, direction, x } = stateRef.current

      if (mode !== 'wandering') return

      // Chance to rest
      if (Math.random() < REST_CHANCE) {
        setPose('idle')
        setMode('resting')
        const pause = 1500 + Math.random() * 1500
        setTimeout(() => setMode('wandering'), pause)
        return
      }

      // Alternate walk frames
      walkFrame = !walkFrame
      setPose(walkFrame ? 'walk-1' : 'walk-2')

      // Move and bounce
      setX(prev => {
        const next = prev + (direction === 'right' ? STEP : -STEP)
        if (next >= 90) { setDirection('left');  return 90 }
        if (next <= 5)  { setDirection('right'); return 5  }
        return next
      })
    }, TICK_MS)

    return () => clearInterval(id)
  }, []) // interval created once; reads live state via ref

  function react(reactionPose) {
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current)
    setPose(reactionPose)
    setMode('reacting')
    reactionTimerRef.current = setTimeout(() => {
      setMode('wandering')
      reactionTimerRef.current = null
    }, 1200)
  }

  return { pose, direction, x, react }
}
