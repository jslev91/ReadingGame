function getBestVoice() {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v => v.name.includes('Google') && v.lang === 'en-GB') ??
    voices.find(v => v.lang === 'en-GB') ??
    null
  )
}

// audioKey: filename stem under /audio/ (e.g. "s", "oo_long")
// fallbackText: spoken via Web Speech API when the audio file is missing
// Returns a cancel function — always use as useEffect cleanup to prevent
// double-play from StrictMode and rapid question changes.
export function speak(audioKey, fallbackText) {
  const audio = new Audio(`/audio/${audioKey}.wav`)
  let fallbackCalled = false
  let fallbackTimer = null  // tracked so cancel can clear it before it fires

  function triggerFallback() {
    if (!fallbackCalled) {
      fallbackCalled = true
      if (!window.speechSynthesis) return
      fallbackTimer = setTimeout(() => {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(fallbackText ?? audioKey)
        utterance.lang = 'en-GB'
        utterance.rate = 0.82
        const voice = getBestVoice()
        if (voice) utterance.voice = voice
        window.speechSynthesis.speak(utterance)
      }, 100)
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
    clearTimeout(fallbackTimer)   // stop pending TTS before it fires
    window.speechSynthesis?.cancel()
  }
}
