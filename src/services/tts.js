function getBestVoice() {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v => v.name.includes('Google') && v.lang === 'en-GB') ??
    voices.find(v => v.lang === 'en-GB') ??
    null
  )
}

export function speak(text, options = {}) {
  if (!window.speechSynthesis) return

  // iOS requires a brief pause after user interaction before synthesis triggers reliably
  setTimeout(() => {
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-GB'
    utterance.rate = options.rate ?? 0.82
    utterance.pitch = options.pitch ?? 1
    utterance.volume = options.volume ?? 1

    const voice = getBestVoice()
    if (voice) utterance.voice = voice

    window.speechSynthesis.speak(utterance)
  }, 100)
}
