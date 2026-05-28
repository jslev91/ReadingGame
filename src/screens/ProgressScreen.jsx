import phonics from '../data/phonics'
import { useProgress } from '../hooks/useProgress'

const STATUS_STYLE = {
  unseen:      { bg: 'bg-gray-100',   text: 'text-gray-300',   label: '' },
  introduced:  { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '★' },
  practising:  { bg: 'bg-orange-100', text: 'text-orange-700', label: '★★' },
  mastered:    { bg: 'bg-green-100',  text: 'text-green-700',  label: '★★★' },
}

function GraphemeTile({ entry, progress }) {
  const status = progress?.status ?? 'unseen'
  const { bg, text, label } = STATUS_STYLE[status]
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl p-2 ${bg} min-w-0`}>
      <span className={`text-xl font-bold ${text}`}>{entry.grapheme}</span>
      {label && <span className={`text-xs ${text} leading-none`}>{label}</span>}
    </div>
  )
}

function PhaseSection({ phase, entries, progressMap }) {
  return (
    <div className="w-full">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Phase {phase}</h2>
      <div className="grid grid-cols-6 gap-2">
        {entries.map(entry => (
          <GraphemeTile
            key={entry.audioKey ?? entry.grapheme}
            entry={entry}
            progress={progressMap[entry.grapheme]}
          />
        ))}
      </div>
    </div>
  )
}

export default function ProgressScreen({ userId, onBack }) {
  const { progressMap } = useProgress(userId)

  const phase2 = phonics.filter(p => p.phase === 2).sort((a, b) => a.order - b.order)
  const phase3 = phonics.filter(p => p.phase === 3).sort((a, b) => a.order - b.order)

  const counts = {
    introduced: Object.values(progressMap).filter(p => p.status === 'introduced').length,
    practising: Object.values(progressMap).filter(p => p.status === 'practising').length,
    mastered:   Object.values(progressMap).filter(p => p.status === 'mastered').length,
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col p-4 gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="min-h-16 min-w-16 flex items-center justify-center text-2xl rounded-2xl bg-white border-2 border-yellow-300 text-yellow-700"
          aria-label="Back"
        >
          🏠
        </button>
        <h1 className="text-2xl font-bold text-yellow-800">Sounds learnt</h1>
      </div>

      {/* Summary counts */}
      <div className="flex gap-3">
        <div className="flex-1 bg-yellow-100 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700">{counts.introduced}</p>
          <p className="text-xs text-yellow-600">Learning</p>
        </div>
        <div className="flex-1 bg-orange-100 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-orange-700">{counts.practising}</p>
          <p className="text-xs text-orange-600">Practising</p>
        </div>
        <div className="flex-1 bg-green-100 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{counts.mastered}</p>
          <p className="text-xs text-green-600">Mastered</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-400">
        <span><span className="text-gray-300">■</span> Not seen</span>
        <span><span className="text-yellow-500">■</span> ★ Learning</span>
        <span><span className="text-orange-500">■</span> ★★ Practising</span>
        <span><span className="text-green-500">■</span> ★★★ Mastered</span>
      </div>

      <PhaseSection phase={2} entries={phase2} progressMap={progressMap} />
      <PhaseSection phase={3} entries={phase3} progressMap={progressMap} />
    </div>
  )
}
