export default function ProgressScreen({ onBack }) {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <button onClick={onBack} style={{ fontSize: 24 }}>← Back</button>
      <p style={{ marginTop: 32, fontSize: 20 }}>Maths progress coming in session 11.</p>
    </div>
  )
}
