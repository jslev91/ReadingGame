const normalUrl = window.location.pathname + window.location.hash

export default function TestModeSplash({ onContinue }) {
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-8 gap-6 text-center">
      <div className="text-6xl">⚡</div>
      <div>
        <h1 className="text-2xl font-black text-amber-800">Test Mode Active</h1>
        <p className="text-amber-700 mt-2">Timings are compressed 300×.<br />This is not the real experience.</p>
      </div>

      <a
        href={normalUrl}
        className="min-h-16 px-10 py-4 bg-yellow-400 text-yellow-900 text-xl font-bold rounded-3xl shadow-md active:scale-95 transition-transform"
      >
        Switch to Normal Mode
      </a>

      <button
        onClick={onContinue}
        className="text-sm text-amber-400 underline underline-offset-2"
      >
        continue in test mode
      </button>
    </div>
  )
}
