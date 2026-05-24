// Pose → image file mapping.
// Only "idle" is available now. Future poses to add:
//   walking-1 → jimmy-walk-1.png
//   walking-2 → jimmy-walk-2.png
//   sleep     → jimmy-sleep.png
//   eating    → jimmy-eating.png
//   happy     → jimmy-happy.png
//   sad       → jimmy-sad.png
const POSE_IMAGE = {
  idle: '/images/jimmy-idle.png',
}

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

// Props: stats (full usePet stats object), mood (string), pose (default "idle")
export default function Jimmy({ stats, mood, pose = 'idle' }) {
  const src = POSE_IMAGE[pose] ?? POSE_IMAGE.idle

  return (
    <div className="w-full">
      {/* Habitat */}
      <div className="relative h-48 w-full rounded-2xl overflow-hidden">
        {/* Sky */}
        <div className="absolute inset-0 bg-sky-300" />
        {/* Grass strip */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-green-500" />

        {/* Coin counter */}
        <div className="absolute top-2 right-3 text-sm font-bold text-yellow-800 bg-yellow-100/80 rounded-full px-2 py-0.5">
          🪙 {stats.coins}
        </div>

        {/* Jimmy sprite — sits on the grass line */}
        <img
          src={src}
          alt={`Jimmy the giraffe (${mood})`}
          className="absolute h-24 w-auto bottom-8 left-1/2 -translate-x-1/2"
        />
      </div>

      {/* Stat bars — below the habitat */}
      <div className="flex gap-3 mt-2 px-1">
        <StatBar emoji="⚡" value={stats.energy.value} max={stats.energy.max} colour="bg-green-400" />
        <StatBar emoji="🍃" value={stats.hunger.value} max={stats.hunger.max} colour="bg-orange-400" />
        <StatBar emoji="💬" value={stats.social.value} max={stats.social.max} colour="bg-purple-400" />
      </div>
    </div>
  )
}
