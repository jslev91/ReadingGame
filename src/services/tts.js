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
export function speak(audioKey, fallbackText) {
  const audio = new Audio(`/audio/${audioKey}.wav`)
  audio.onerror = () => speakFallback(fallbackText ?? audioKey)
  audio.play().catch(() => speakFallback(fallbackText ?? audioKey))
}
