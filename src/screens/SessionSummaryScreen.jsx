import Jimmy from '../components/Jimmy'

function getMessage(correct) {
  if (correct >= 8) return "Amazing! Jimmy is so happy! 🌟"
  if (correct >= 5) return "Well done! Keep going! 😊"
  return "Good try! Practice makes perfect! 💪"
}

function getSummaryPose(correct) {
  if (correct >= 7) return 'happy'
  if (correct >= 4) return 'idle'
  return 'sad'
}

export default function SessionSummaryScreen({ result, stats, mood, onPlayAgain, onHome }) {
  const { correct, total, coinsEarned } = result

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center gap-8 p-6">
      <div className="w-full max-w-sm">
        <Jimmy stats={stats} mood={mood} pose={getSummaryPose(correct)} />
      </div>

      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-6xl font-bold text-yellow-600">🪙 +{coinsEarned}</p>
        <p className="text-xl font-bold text-gray-700">{getMessage(correct)}</p>
        <p className="text-base text-gray-500">{correct} out of {total}</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={onPlayAgain}
          className="min-h-16 bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-yellow-900 text-2xl font-bold rounded-3xl shadow-md transition-transform"
        >
          Play again
        </button>
        <button
          onClick={onHome}
          className="min-h-16 bg-white border-2 border-yellow-300 active:scale-95 text-yellow-700 text-2xl font-bold rounded-3xl transition-transform"
        >
          🏠 Home
        </button>
      </div>
    </div>
  )
}
