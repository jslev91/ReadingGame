const BAR_COLOUR = { happy: 'bg-green-400', okay: 'bg-amber-400', sad: 'bg-red-400' }

export default function Jimmy({ energy, mood }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-7xl">🦒</span>
      <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${BAR_COLOUR[mood]}`}
          style={{ width: `${energy}%` }}
        />
      </div>
    </div>
  )
}
