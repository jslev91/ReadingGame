import { useState, useEffect, useRef } from 'react'

const TICK_MS = 400

export function useJimmyAnimation(sluggish = false, sleeping = false) {
  const [pose, setPose]           = useState('idle')
  const [direction, setDirection] = useState('right')
  const [x, setX]                 = useState(10)
  const [mode, setMode]           = useState('wandering')

  // Refs so interval callback always reads current values without being re-created
  const stateRef = useRef({ pose, direction, x, mode })
  useEffect(() => { stateRef.current = { pose, direction, x, mode } }, [pose, direction, x, mode])

  const sluggishRef = useRef(sluggish)
  useEffect(() => { sluggishRef.current = sluggish }, [sluggish])

  const sleepingRef = useRef(sleeping)
  useEffect(() => { sleepingRef.current = sleeping }, [sleeping])

  const reactionTimerRef = useRef(null)

  useEffect(() => {
    let walkFrame = 0 // cycles 0–5 through walk-1 … walk-6

    const id = setInterval(() => {
      const { mode, direction, x } = stateRef.current
      const isSluggy = sluggishRef.current

      if (sleepingRef.current || mode !== 'wandering') return

      // Chance to rest: 1-in-5 when sluggish, else 1-in-25
      const restChance = isSluggy ? 1 / 2 : 1 / 25
      if (Math.random() < restChance) {
        setPose('idle')
        setMode('resting')
        const pause = 1500 + Math.random() * 1500
        setTimeout(() => setMode('wandering'), pause)
        return
      }

      // Cycle through 6 walk frames
      walkFrame = (walkFrame + 1) % 6
      setPose(`walk-${walkFrame + 1}`)

      // Move and bounce; sluggish = ±1 instead of ±2
      const step = isSluggy ? 1 : 2
      setX(prev => {
        const next = prev + (direction === 'right' ? step : -step)
        if (next >= 90) { setDirection('left');  return 90 }
        if (next <= 5)  { setDirection('right'); return 5  }
        return next
      })
    }, TICK_MS)

    return () => clearInterval(id)
  }, []) // interval created once; reads live state via refs

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
