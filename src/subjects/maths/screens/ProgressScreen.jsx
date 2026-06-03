import { MATHS_TOPICS } from '../data/curriculum'
import { useMathsProgress } from '../hooks/useProgress'

const STATUS_COLOUR = {
  unseen:     'bg-gray-200 text-gray-500',
  introduced: 'bg-yellow-200 text-yellow-800',
  practising: 'bg-orange-300 text-orange-900',
  mastered:   'bg-green-400 text-white',
}

const PHASE_LABEL = { 1: 'Phase 1', 2: 'Phase 2', 3: 'Phase 3', 4: 'Phase 4' }
const CYCLE = { unseen: 'introduced', introduced: 'practising', practising: 'mastered', mastered: 'unseen' }

export default function ProgressScreen({ userId, onBack, editable }) {
  const progress = useMathsProgress(userId)
  const phases = [...new Set(MATHS_TOPICS.map(t => t.phase))]

  const introduced = MATHS_TOPICS.filter(t => progress.progressMap[t.id]?.status === 'introduced').length
  const practising = MATHS_TOPICS.filter(t => progress.progressMap[t.id]?.status === 'practising').length
  const mastered   = MATHS_TOPICS.filter(t => progress.progressMap[t.id]?.status === 'mastered').length

  function cycleStatus(topicId) {
    if (!editable) return
    const current = progress.progressMap[topicId]?.status ?? 'unseen'
    progress.setTopicStatus(topicId, CYCLE[current])
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="min-h-16 min-w-16 flex items-center justify-center text-2xl rounded-2xl bg-white border-2 border-blue-300 text-blue-700"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-blue-800">
          {editable ? 'Edit Maths Progress' : 'Times Tables 🔢'}
        </h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">Learning: {introduced}</span>
        <span className="bg-orange-300 text-orange-900 px-3 py-1 rounded-full text-sm font-bold">Practising: {practising}</span>
        <span className="bg-green-400 text-white px-3 py-1 rounded-full text-sm font-bold">Mastered: {mastered}</span>
      </div>

      {editable && (
        <p className="text-sm text-blue-600">Tap any table to cycle its status.</p>
      )}

      {phases.map(phase => {
        const topics = MATHS_TOPICS.filter(t => t.phase === phase)
        return (
          <div key={phase}>
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-2">{PHASE_LABEL[phase]}</h2>
            <div className="flex flex-col gap-2">
              {topics.map(topic => {
                const status = progress.progressMap[topic.id]?.status ?? 'unseen'
                const correct = progress.progressMap[topic.id]?.correctCount ?? 0
                return (
                  <button
                    key={topic.id}
                    onClick={() => cycleStatus(topic.id)}
                    className={`min-h-14 w-full rounded-2xl px-4 py-2 flex justify-between items-center font-bold text-base transition-colors ${STATUS_COLOUR[status]} ${editable ? 'active:scale-95' : 'cursor-default'}`}
                  >
                    <span>{topic.label}</span>
                    {status !== 'unseen' && (
                      <span className="text-sm font-normal opacity-70">{correct} correct</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
