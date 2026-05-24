function getBestVoice() {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v => v.name.includes('Google') && v.lang === 'en-GB') ??
    voices.find(v => v.lang === 'en-GB') ??
    null
  )
}

function speakFallback(text) {
  if (!window.speechSynthesis) return
  setTimeout(() => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-GB'
    utterance.rate = 0.82
    const voice = getBestVoice()
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  }, 100)
}

// audioKey: filename stem under /audio/ (e.g. "s", "oo_long")
// fallbackText: spoken via Web Speech API when the audio file is missing
// Returns a cancel function — always use as useEffect cleanup to prevent
// double-play from StrictMode and rapid question changes.
export function speak(audioKey, fallbackText) {
  const audio = new Audio(`/audio/${audioKey}.wav`)
  let fallbackCalled = false

  function triggerFallback() {
    if (!fallbackCalled) {
      fallbackCalled = true
      speakFallback(fallbackText ?? audioKey)
    }
  }

  // onerror fires when the file cannot be loaded (missing file, network error)
  audio.onerror = triggerFallback

  // AbortError means we intentionally paused via cleanup — do not fall back to TTS
  audio.play().catch(err => {
    if (err.name !== 'AbortError') triggerFallback()
  })

  return () => {
    audio.pause()
    audio.currentTime = 0
    window.speechSynthesis?.cancel()
  }
}
