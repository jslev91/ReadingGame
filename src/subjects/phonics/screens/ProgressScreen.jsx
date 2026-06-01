import phonics from '../data/phonics'
import { TRICKY_WORDS } from '../data/trickyWords'
import { useProgress } from '../hooks/useProgress'

const STATUSES = ['unseen', 'introduced', 'practising', 'mastered']
const TRICKY_STATUSES = ['unseen', 'seen', 'familiar', 'known']

const STATUS_STYLE = {
  unseen:      { bg: 'bg-gray-100',   text: 'text-gray-300',   label: '' },
  introduced:  { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '★' },
  practising:  { bg: 'bg-orange-100', text: 'text-orange-700', label: '★★' },
  mastered:    { bg: 'bg-green-100',  text: 'text-green-700',  label: '★★★' },
}

const TRICKY_STATUS_STYLE = {
  unseen:   { bg: 'bg-gray-100',   text: 'text-gray-300',   label: '' },
  seen:     { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '★' },
  familiar: { bg: 'bg-orange-100', text: 'text-orange-700', label: '★★' },
  known:    { bg: 'bg-green-100',  text: 'text-green-700',  label: '★★★' },
}

function GraphemeTile({ entry, progress, editable, onCycle }) {
  const status = progress?.status ?? 'unseen'
  const { bg, text, label } = STATUS_STYLE[status]
  if (editable) {
    return (
      <button
        onClick={onCycle}
        className={`flex flex-col items-center justify-center rounded-xl p-2 ${bg} min-w-0 active:scale-95 transition-transform`}
      >
        <span className={`text-xl font-bold ${text}`}>{entry.grapheme}</span>
        {label && <span className={`text-xs ${text} leading-none`}>{label}</span>}
      </button>
    )
  }
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl p-2 ${bg} min-w-0`}>
      <span className={`text-xl font-bold ${text}`}>{entry.grapheme}</span>
      {label && <span className={`text-xs ${text} leading-none`}>{label}</span>}
    </div>
  )
}

function PhaseSection({ phase, entries, progressMap, editable, onCycle }) {
  return (
    <div className="w-full">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Phase {phase}</h2>
      <div className="grid grid-cols-6 gap-2">
        {entries.map(entry => (
          <GraphemeTile
            key={entry.audioKey ?? entry.grapheme}
            entry={entry}
            progress={progressMap[entry.grapheme]}
            editable={editable}
            onCycle={() => onCycle(entry)}
          />
        ))}
      </div>
    </div>
  )
}

function TrickyWordTile({ wordEntry, progress, editable, onCycle }) {
  const status = progress?.status ?? 'unseen'
  const { bg, text, label } = TRICKY_STATUS_STYLE[status]
  if (editable) {
    return (
      <button
        onClick={onCycle}
        className={`flex flex-col items-center justify-center rounded-xl p-2 ${bg} min-w-0 active:scale-95 transition-transform`}
      >
        <span className={`text-base font-bold ${text}`}>{wordEntry.word}</span>
        {label && <span className={`text-xs ${text} leading-none`}>{label}</span>}
      </button>
    )
  }
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl p-2 ${bg} min-w-0`}>
      <span className={`text-base font-bold ${text}`}>{wordEntry.word}</span>
      {label && <span className={`text-xs ${text} leading-none`}>{label}</span>}
    </div>
  )
}

function TrickyPhaseSection({ phase, words, progressMap, editable, onCycle }) {
  return (
    <div className="w-full">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Phase {phase}</h3>
      <div className="grid grid-cols-4 gap-2">
        {words.map(w => (
          <TrickyWordTile
            key={w.word}
            wordEntry={w}
            progress={progressMap[w.word]}
            editable={editable}
            onCycle={() => onCycle(w)}
          />
        ))}
      </div>
    </div>
  )
}

export default function ProgressScreen({ userId, onBack, editable = false }) {
  const { progressMap, setGraphemeStatus, trickyWordProgressMap, setTrickyWordStatus } = useProgress(userId)

  const phase2 = phonics.filter(p => p.phase === 2).sort((a, b) => a.order - b.order)
  const phase3 = phonics.filter(p => p.phase === 3).sort((a, b) => a.order - b.order)

  const trickyPhase2 = TRICKY_WORDS.filter(w => w.phase === 2)
  const trickyPhase3 = TRICKY_WORDS.filter(w => w.phase === 3)
  const trickyPhase4 = TRICKY_WORDS.filter(w => w.phase === 4)

  const counts = {
    introduced: Object.values(progressMap).filter(p => p.status === 'introduced').length,
    practising: Object.values(progressMap).filter(p => p.status === 'practising').length,
    mastered:   Object.values(progressMap).filter(p => p.status === 'mastered').length,
  }

  const trickyCounts = {
    seen:     Object.values(trickyWordProgressMap).filter(p => p.status === 'seen').length,
    familiar: Object.values(trickyWordProgressMap).filter(p => p.status === 'familiar').length,
    known:    Object.values(trickyWordProgressMap).filter(p => p.status === 'known').length,
  }

  function handleCycle(entry) {
    const current = progressMap[entry.grapheme]?.status ?? 'unseen'
    const next = STATUSES[(STATUSES.indexOf(current) + 1) % STATUSES.length]
    setGraphemeStatus(entry.grapheme, next)
  }

  function handleCycleTricky(wordEntry) {
    const current = trickyWordProgressMap[wordEntry.word]?.status ?? 'unseen'
    const next = TRICKY_STATUSES[(TRICKY_STATUSES.indexOf(current) + 1) % TRICKY_STATUSES.length]
    setTrickyWordStatus(wordEntry.word, next)
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
          {editable ? '✓' : '🏠'}
        </button>
        <div>
          <h1 className="text-2xl font-bold text-yellow-800">
            {editable ? 'Edit Progress' : 'Sounds learnt'}
          </h1>
          {editable && <p className="text-xs text-gray-400 mt-0.5">Tap any tile to cycle its status</p>}
        </div>
      </div>

      {/* Grapheme summary counts */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Sounds (graphemes)</p>
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
      </div>

      {/* Tricky word summary counts */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Tricky words</p>
        <div className="flex gap-3">
          <div className="flex-1 bg-yellow-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-yellow-700">{trickyCounts.seen}</p>
            <p className="text-xs text-yellow-600">Seen</p>
          </div>
          <div className="flex-1 bg-orange-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-orange-700">{trickyCounts.familiar}</p>
            <p className="text-xs text-orange-600">Familiar</p>
          </div>
          <div className="flex-1 bg-green-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{trickyCounts.known}</p>
            <p className="text-xs text-green-600">Known</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
        <span><span className="text-gray-300">■</span> Not seen</span>
        <span><span className="text-yellow-500">■</span> ★ Learning / Seen</span>
        <span><span className="text-orange-500">■</span> ★★ Practising / Familiar</span>
        <span><span className="text-green-500">■</span> ★★★ Mastered / Known</span>
      </div>

      {/* Grapheme sections */}
      <PhaseSection phase={2} entries={phase2} progressMap={progressMap} editable={editable} onCycle={handleCycle} />
      <PhaseSection phase={3} entries={phase3} progressMap={progressMap} editable={editable} onCycle={handleCycle} />

      {/* Tricky word sections */}
      <div className="w-full flex flex-col gap-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide -mb-2">Tricky Words</h2>
        <TrickyPhaseSection phase={2} words={trickyPhase2} progressMap={trickyWordProgressMap} editable={editable} onCycle={handleCycleTricky} />
        <TrickyPhaseSection phase={3} words={trickyPhase3} progressMap={trickyWordProgressMap} editable={editable} onCycle={handleCycleTricky} />
        <TrickyPhaseSection phase={4} words={trickyPhase4} progressMap={trickyWordProgressMap} editable={editable} onCycle={handleCycleTricky} />
      </div>
    </div>
  )
}
