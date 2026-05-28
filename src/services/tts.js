// Voices load asynchronously — cache them after voiceschanged so getBestVoice()
// never sees an empty list regardless of when speak() is first called.
let cachedVoices = []
function loadVoices() {
  cachedVoices = window.speechSynthesis?.getVoices() ?? []
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
  loadVoices()
}

function getBestVoice() {
  return (
    cachedVoices.find(v => v.name.includes('Google') && v.lang === 'en-GB') ??
    cachedVoices.find(v => v.lang === 'en-GB') ??
    cachedVoices.find(v => v.lang.startsWith('en')) ??
    cachedVoices[0] ??
    null
  )
}

export function speak(audioKey, fallbackText) {
  const audio = new Audio(`/audio/${audioKey}.wav`)
  let fallbackCalled = false
  let cancelled = false
  let fallbackTimer = null

  function triggerFallback() {
    if (fallbackCalled || cancelled) return
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

  audio.onerror = triggerFallback
  audio.play().catch(err => {
    if (err.name !== 'AbortError') triggerFallback()
  })

  return () => {
    cancelled = true
    audio.pause()
    audio.currentTime = 0
    clearTimeout(fallbackTimer)
    window.speechSynthesis?.cancel()
  }
}
