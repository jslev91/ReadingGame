import { forwardRef, useImperativeHandle } from 'react'
import { useJimmyAnimation } from '../hooks/useJimmyAnimation'
import { getItem } from '../../data/items'
import { getCosmeticSprite } from '../../services/cosmeticSprites'

const DECAY_RATES = {
  hunger:      1 / 8,   // per minute
  cleanliness: 1 / 20,  // per minute (before poop multiplier)
}

function getStatDirection(statName, stats, poops) {
  if (statName === 'energy') return 'down'

  const activeItems = stats.activeItems ?? []
  const relevant = activeItems.filter(inst => getItem(inst.itemId)?.effect?.stat === statName)
  if (relevant.length === 0) return 'down'

  const itemRate = relevant.reduce((sum, inst) => {
    const def = getItem(inst.itemId)
    return sum + (def?.effect?.ratePerMinute ?? 0)
  }, 0)

  let decayRate = DECAY_RATES[statName] ?? 0
  if (statName === 'cleanliness') {
    decayRate *= Math.pow(1.5, (poops ?? []).length)
  }

  const net = itemRate - decayRate
  if (net > 0.1) return 'up'
  if (net >= -0.1) return 'stable'
  return 'down'
}

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

const habitatKeyframes = `
@keyframes smell {
  0%   { opacity: 0; transform: translateY(0); }
  40%  { opacity: 0.6; }
  100% { opacity: 0; transform: translateY(-18px); }
}
@keyframes cloudDrift {
  0%   { left: 110%; }
  100% { left: -25%; }
}
@keyframes ballBounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%       { transform: translateX(-50%) translateY(-22px); }
}
`

const DIRECTION_ARROW = {
  up:     <span className="text-xs text-green-600 ml-0.5">▲</span>,
  down:   <span className="text-xs text-red-500 ml-0.5">▼</span>,
  stable: <span className="text-xs text-gray-400 ml-0.5">►</span>,
}

function StatBar({ emoji, value, max, colour, direction }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex-1">
      <div className="flex justify-between items-baseline">
        <span className="text-xs">{emoji}{DIRECTION_ARROW[direction]}</span>
        <span className="text-xs text-gray-400">{value}</span>
      </div>
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

  const heightPx = def.spriteHeightPx ?? 32
  const bottomPx = def.bottomPx ?? 32

  return (
    <div
      className={`absolute text-3xl select-none ${fading ? 'opacity-50' : ''}`}
      style={{ left: `${instance.x}%`, bottom: `${bottomPx}px`, transform: 'translateX(-50%)', zIndex: 1 }}
      aria-hidden="true"
    >
      {def.sprite ? (
        <img
          src={def.sprite}
          alt=""
          style={{ height: `${heightPx}px`, width: 'auto' }}
          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block' }}
        />
      ) : null}
      <span style={{ display: def.sprite ? 'none' : 'block' }}>{def.emoji}</span>
    </div>
  )
}

function SkyItem({ instance }) {
  const def = getItem(instance.itemId)
  if (!def) return null
  const now = Date.now()
  const placed = new Date(instance.placedAt).getTime()
  const expires = new Date(instance.expiresAt).getTime()
  const fading = (now - placed) / (expires - placed) > 0.7
  const heightPx = def.spriteHeightPx ?? 48
  return (
    <div
      className={`absolute select-none ${fading ? 'opacity-50' : ''}`}
      style={{ top: '2%', left: '12%', transform: 'translateX(-50%)', zIndex: 0 }}
      aria-hidden="true"
    >
      {def.sprite
        ? <img src={def.sprite} alt="" style={{ height: `${heightPx}px`, width: 'auto' }} onError={e => { e.currentTarget.style.display = 'none' }} />
        : <span className="text-3xl">{def.emoji}</span>}
    </div>
  )
}

function CloudItem({ instance }) {
  const def = getItem(instance.itemId)
  if (!def) return null
  const now = Date.now()
  const placed = new Date(instance.placedAt).getTime()
  const expires = new Date(instance.expiresAt).getTime()
  const fading = (now - placed) / (expires - placed) > 0.7
  const heightPx = def.spriteHeightPx ?? 56
  // Derive unique speed and vertical position from instanceId so two clouds differ
  const seed = instance.instanceId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const duration = 40 + (seed % 25)          // 40–64 seconds per crossing
  const topPct   = 8  + (seed % 22)          // 8–29% from top of habitat
  const delay    = -(seed % duration)         // start partway through cycle
  return (
    <div
      className={`absolute select-none ${fading ? 'opacity-50' : ''}`}
      style={{
        top: `${topPct}%`,
        zIndex: 0,
        animation: `cloudDrift ${duration}s linear ${delay}s infinite`,
      }}
      aria-hidden="true"
    >
      {def.sprite
        ? <img src={def.sprite} alt="" style={{ height: `${heightPx}px`, width: 'auto' }} onError={e => { e.currentTarget.style.display = 'none' }} />
        : <span className="text-3xl">{def.emoji}</span>}
    </div>
  )
}

function BallItem({ instance, jimmyX }) {
  const def = getItem(instance.itemId)
  if (!def) return null
  const now = Date.now()
  const placed = new Date(instance.placedAt).getTime()
  const expires = new Date(instance.expiresAt).getTime()
  const fading = (now - placed) / (expires - placed) > 0.7
  const heightPx = def.spriteHeightPx ?? 44
  const bottomPx = def.bottomPx ?? 40
  const bouncing = Math.abs(jimmyX - instance.x) < 14
  return (
    <div
      className={`absolute select-none ${fading ? 'opacity-50' : ''}`}
      style={{
        left: `${instance.x}%`,
        bottom: `${bottomPx}px`,
        zIndex: 1,
        transform: bouncing ? undefined : 'translateX(-50%)',
        animation: bouncing ? 'ballBounce 0.45s ease-in-out infinite' : 'none',
      }}
      aria-hidden="true"
    >
      {def.sprite
        ? <img src={def.sprite} alt="" style={{ height: `${heightPx}px`, width: 'auto' }} onError={e => { e.currentTarget.style.display = 'none' }} />
        : <span className="text-3xl">{def.emoji}</span>}
    </div>
  )
}

function PoopItem({ poop, onTap }) {
  return (
    <button
      onClick={() => onTap(poop.id)}
      className="absolute bottom-8 min-w-16 min-h-16 flex flex-col items-center justify-end"
      style={{ left: `${poop.x}%`, transform: 'translateX(-50%)', zIndex: 1 }}
      aria-label="Poop — tap to clean"
    >
      {/* Smell animation */}
      <div className="flex gap-0.5 mb-0.5 text-gray-400 text-xs" aria-hidden="true">
        {['~', '~', '~'].map((w, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              animation: `smell 1.6s ease-in-out ${i * 0.4}s infinite`,
            }}
          >
            {w}
          </span>
        ))}
      </div>
      <span className="text-2xl leading-none select-none">💩</span>
    </button>
  )
}

// Exposes react(pose) via ref so GameScreen can trigger reactions without managing
// animation state itself. Using forwardRef + useImperativeHandle keeps the animation
// hook internal and the component interface minimal.
function ShovelIndicator({ stats }) {
  const tool = (stats.inventory?.tools ?? []).find(t => t.id === 'shovel')
  if (!tool) return null
  const uses = tool.usesRemaining
  const colour = uses <= 1 ? 'text-red-600' : uses <= 3 ? 'text-amber-500' : 'text-yellow-800'
  return (
    <span className={`text-sm font-bold ${colour}`}>🪣 {uses}</span>
  )
}

const Jimmy = forwardRef(function Jimmy({ stats, mood, pose: poseProp, poops = [], onPoopTap }, ref) {
  const jimmySleeping = stats.energy.value <= 25
  const sluggish = stats.hunger.value <= 25
  const grubby = stats.cleanliness.value === 0

  const anim = useJimmyAnimation(sluggish, jimmySleeping)

  // Sleep overrides all animation; poseProp overrides normal animation (e.g. summary screen)
  const activePose = jimmySleeping ? 'sleep' : (poseProp ?? anim.pose)
  const src = SPRITES[activePose] ?? FALLBACK

  useImperativeHandle(ref, () => ({
    react: anim.react,
  }))

  const activeItems = stats.activeItems ?? []

  return (
    <div className="w-full">
      <style>{habitatKeyframes}</style>

      {/* Habitat */}
      <div className="relative h-48 w-full rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-sky-300" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-green-500" />

        {/* Placed items — behind Jimmy (cosmetics render as sprite overlays, not here) */}
        {activeItems.filter(inst => getItem(inst.itemId)?.type !== 'cosmetic').map(inst => {
          const def = getItem(inst.itemId)
          if (!def) return null
          if (def.layer === 'sky' && def.animated === 'drift') return <CloudItem key={inst.instanceId} instance={inst} />
          if (def.layer === 'sky') return <SkyItem key={inst.instanceId} instance={inst} />
          if (def.interactive === 'bounce') return <BallItem key={inst.instanceId} instance={inst} jimmyX={anim.x} />
          return <HabitatItem key={inst.instanceId} instance={inst} />
        })}

        {/* Poops */}
        {poops.map(poop => (
          <PoopItem key={poop.id} poop={poop} onTap={onPoopTap ?? (() => {})} />
        ))}

        {/* Coin counter + shovel uses */}
        <div className="absolute top-2 right-3 flex gap-2 items-center">
          <ShovelIndicator stats={stats} />
          <div className="text-sm font-bold text-yellow-800 bg-yellow-100/80 rounded-full px-2 py-0.5">
            🪙 {stats.coins}
          </div>
        </div>

        {/* Sleep badge */}
        {jimmySleeping && (
          <div className="absolute top-2 left-3 text-lg" aria-label="Jimmy is sleeping">💤</div>
        )}

        {/* Jimmy sprite + cosmetic overlays */}
        {(() => {
          const cosmeticItems = jimmySleeping ? [] : activeItems.filter(i => getItem(i.itemId)?.type === 'cosmetic')
          const debugOverlay = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('cosmeticDebug') === '1'
          const spriteStyle = jimmySleeping ? {
            width: '95px',
            height: '140px',
            bottom: '0px',
            left: `${anim.x}%`,
            transform: 'translateX(-50%)',
            transition: 'none',
            zIndex: 2,
            filter: grubby ? 'sepia(0.9) hue-rotate(60deg) brightness(0.7) saturate(1.8)' : undefined,
          } : {
            width: '80px',
            height: '96px',
            bottom: '32px',
            left: `${anim.x}%`,
            transform: `translateX(-50%) ${anim.direction === 'right' ? 'scaleX(-1)' : ''}`,
            transition: 'left 0.4s linear',
            zIndex: 2,
            filter: grubby ? 'sepia(0.9) hue-rotate(60deg) brightness(0.7) saturate(1.8)' : undefined,
          }
          return (
            <div
              className={jimmySleeping ? 'absolute animate-pulse' : 'absolute'}
              style={{ ...spriteStyle, display: 'inline-block' }}
            >
              <img
                src={src}
                alt={`Jimmy the giraffe (${mood})`}
                onError={e => { e.currentTarget.src = FALLBACK }}
                className="object-contain object-bottom"
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
              {cosmeticItems.map(item => {
                const def = getItem(item.itemId)
                if (!def?.overlayStyle) return null
                if (debugOverlay) {
                  return (
                    <div
                      key={item.instanceId}
                      style={{
                        position: 'absolute',
                        pointerEvents: 'none',
                        background: 'rgba(255,0,0,0.4)',
                        border: '2px solid red',
                        ...def.overlayStyle,
                        height: def.overlayStyle.width,
                      }}
                    />
                  )
                }
                return (
                  <img
                    key={item.instanceId}
                    src={getCosmeticSprite(item.itemId)}
                    alt=""
                    style={{
                      position: 'absolute',
                      pointerEvents: 'none',
                      ...def.overlayStyle,
                    }}
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                )
              })}
            </div>
          )
        })()}
      </div>

      {/* Stat bars */}
      <div className="flex gap-3 mt-2 px-1">
        <StatBar emoji="⚡" value={stats.energy.value} max={stats.energy.max} colour="bg-green-400" direction={getStatDirection('energy', stats, poops)} />
        <StatBar emoji="🍃" value={stats.hunger.value} max={stats.hunger.max} colour="bg-orange-400" direction={getStatDirection('hunger', stats, poops)} />
        <StatBar emoji="🛁" value={stats.cleanliness.value} max={stats.cleanliness.max} colour="bg-purple-400" direction={getStatDirection('cleanliness', stats, poops)} />
      </div>
    </div>
  )
})

export default Jimmy
