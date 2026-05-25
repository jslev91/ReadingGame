import { forwardRef, useImperativeHandle } from 'react'
import { useJimmyAnimation } from '../hooks/useJimmyAnimation'
import { getItem } from '../data/items'

const SPRITES = {
  'idle':   '/images/jimmy-idle.png',
  'walk-1': '/images/jimmy-walk-1.png',
  'walk-2': '/images/jimmy-walk-2.png',
  'walk-3': '/images/jimmy-walk-3.png',
  'walk-4': '/images/jimmy-walk-4.png',
  'walk-5': '/images/jimmy-walk-5.png',
  'walk-6': '/images/jimmy-walk-6.png',
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

function HabitatItem({ instance }) {
  const def = getItem(instance.itemId)
  if (!def) return null

  const now = Date.now()
  const placed = new Date(instance.placedAt).getTime()
  const expires = new Date(instance.expiresAt).getTime()
  const progress = (now - placed) / (expires - placed)
  const fading = progress > 0.7

  return (
    <div
      className={`absolute bottom-8 text-3xl select-none ${fading ? 'opacity-50' : ''}`}
      style={{
        left: `${instance.x}%`,
        transform: 'translateX(-50%)',
        zIndex: 1,
      }}
      aria-hidden="true"
    >
      {def.sprite ? (
        <img
          src={def.sprite}
          alt=""
          className="h-8 w-auto"
          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block' }}
        />
      ) : null}
      <span style={{ display: def.sprite ? 'none' : 'block' }}>{def.emoji}</span>
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

  const activeItems = stats.activeItems ?? []

  return (
    <div className="w-full">
      {/* Habitat */}
      <div className="relative h-48 w-full rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-sky-300" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-green-500" />

        {/* Placed items — behind Jimmy */}
        {activeItems.map(inst => (
          <HabitatItem key={inst.instanceId} instance={inst} />
        ))}

        {/* Coin counter */}
        <div className="absolute top-2 right-3 text-sm font-bold text-yellow-800 bg-yellow-100/80 rounded-full px-2 py-0.5">
          🪙 {stats.coins}
        </div>

        {/* Jimmy sprite — animated position, z-index above items */}
        <img
          src={src}
          alt={`Jimmy the giraffe (${mood})`}
          onError={e => { e.currentTarget.src = FALLBACK }}
          className="absolute h-24 w-auto bottom-8"
          style={{
            left: `${anim.x}%`,
            transform: `translateX(-50%) ${anim.direction === 'right' ? 'scaleX(-1)' : ''}`,
            transition: 'left 0.4s linear',
            zIndex: 2,
          }}
        />
      </div>

      {/* Stat bars */}
      <div className="flex gap-3 mt-2 px-1">
        <StatBar emoji="⚡" value={stats.energy.value} max={stats.energy.max} colour="bg-green-400" />
        <StatBar emoji="🍃" value={stats.hunger.value} max={stats.hunger.max} colour="bg-orange-400" />
        <StatBar emoji="🛁" value={stats.cleanliness.value} max={stats.cleanliness.max} colour="bg-purple-400" />
      </div>
    </div>
  )
})

export default Jimmy
