// Stub — to be replaced with real question types in session 11.
export default function MathsQuestion({ onCorrect }) {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <p style={{ fontSize: 24, fontWeight: 'bold' }}>Maths questions coming soon!</p>
      <button
        style={{ marginTop: 24, padding: '16px 32px', fontSize: 20, borderRadius: 12 }}
        onClick={onCorrect}
      >
        Continue
      </button>
    </div>
  )
}
