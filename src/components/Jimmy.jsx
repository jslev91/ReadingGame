import { forwardRef, useImperativeHandle } from 'react'
import { useJimmyAnimation } from '../hooks/useJimmyAnimation'

const SPRITES = {
  'idle':   '/images/jimmy-idle.png',
  'walk-1': '/images/jimmy-walk-1.png',
  'walk-2': '/images/jimmy-walk-2.png',
  'happy':  '/images/jimmy-happy.png',
  'sad':    '/images/jimmy-sad.png',
  'sleep':  '/images/jimmy-sleep.png',
}
const FALLBACK = '/images/jimmy-idle.png'

function StatBar({ emoji, value, max, colour }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex-1">
      <span className="text-xs">{emoji}</span>
      <div className="h-2 rounded-full bg-gray-200 mt-0.5">
        <div
          className={`h-2 rounded-full ${colour} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// Exposes react(pose) via ref so GameScreen can trigger reactions without managing
// animation state itself. Using forwardRef + useImperativeHandle keeps the animation
// hook internal and the component interface minimal.
const Jimmy = forwardRef(function Jimmy({ stats, mood, pose: poseProp }, ref) {
  const anim = useJimmyAnimation()

  // poseProp overrides animation (used by SessionSummaryScreen for a static pose)
  const activePose = poseProp ?? anim.pose
  const src = SPRITES[activePose] ?? FALLBACK

  useImperativeHandle(ref, () => ({
    react: anim.react,
  }))

  const flipStyle = anim.direction === 'right' ? { transform: 'scaleX(-1)' } : {}

  return (
    <div className="w-full">
      {/* Habitat */}
      <div className="relative h-48 w-full rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-sky-300" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-green-500" />

        {/* Coin counter */}
        <div className="absolute top-2 right-3 text-sm font-bold text-yellow-800 bg-yellow-100/80 rounded-full px-2 py-0.5">
          🪙 {stats.coins}
        </div>

        {/* Jimmy sprite — animated position */}
        <img
          src={src}
          alt={`Jimmy the giraffe (${mood})`}
          onError={e => { e.currentTarget.src = FALLBACK }}
          className="absolute h-24 w-auto bottom-8"
          style={{
            left: `${anim.x}%`,
            transform: `translateX(-50%) ${anim.direction === 'right' ? 'scaleX(-1)' : ''}`,
            transition: 'left 0.4s linear',
          }}
        />
      </div>

      {/* Stat bars */}
      <div className="flex gap-3 mt-2 px-1">
        <StatBar emoji="⚡" value={stats.energy.value} max={stats.energy.max} colour="bg-green-400" />
        <StatBar emoji="🍃" value={stats.hunger.value} max={stats.hunger.max} colour="bg-orange-400" />
        <StatBar emoji="💬" value={stats.social.value} max={stats.social.max} colour="bg-purple-400" />
      </div>
    </div>
  )
})

export default Jimmy
